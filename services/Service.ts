import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult, SourceType } from '../types';

const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    medications: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          name: { type: Type.STRING },
          dosage: { type: Type.STRING },
          frequency: { type: Type.STRING },
          instructions: { type: Type.STRING },
          source: { 
            type: Type.STRING, 
            enum: [SourceType.HOSPITAL, SourceType.HOME] 
          },
        },
        required: ["id", "name", "dosage", "frequency", "source"]
      }
    },
    schedule: {
      type: Type.OBJECT,
      properties: {
        morning: { type: Type.ARRAY, items: { type: Type.STRING } },
        noon: { type: Type.ARRAY, items: { type: Type.STRING } },
        evening: { type: Type.ARRAY, items: { type: Type.STRING } },
        bedtime: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ["morning", "noon", "evening", "bedtime"]
    },
    warnings: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List any potential drug interactions or duplications between hospital and home meds."
    }
  },
  required: ["medications", "schedule", "warnings"]
};

export const analyzeMedicationImages = async (
  images: { base64: string, mimeType: string }[]
): Promise<AnalysisResult> => {

  const prompt = `
    You are an expert clinical pharmacist and OCR specialist. 
    Analyze the provided images of medication documents and bottles (some may be supplement bottles like vitamins).
    
    TASKS:
    1. EXTRACT Medication Details:
       - Identify the Name of the drug or supplement.
       - Identify the Source: 'HOSPITAL' if it looks like a document/list, 'HOME' if it looks like a bottle/label.
    
    2. CRITICAL: FIND THE INSTRUCTIONS FOR BOTTLES:
       - Supplement bottles often have a huge list of "Supplement Facts" or "Ingredients". **IGNORE THIS LIST** for the purpose of dosage frequency.
       - Look specifically for small sections labeled **"Directions"**, **"Suggested Use"**, **"Dosage"**, or **"Posologie"**.
       - Extract the frequency (e.g., "1 capsule daily", "2 tablets twice a day") from these sections.
       - If a range is given (e.g., "1 to 2 capsules"), pick the maximum for safety or note "1-2".

    3. CREATE SCHEDULE:
       - Assign each medication to Morning, Noon, Evening, or Bedtime based on the instructions.
       - "Daily" or "Once a day" -> Morning.
       - "Twice a day" -> Morning and Evening.
       - "With meals" -> relevant meal times.
       - "Before sleep" -> Bedtime.

    4. SAFETY CHECK:
       - Detect duplicates (e.g., same ingredient in Hospital list and Home bottle).
       - Flag interactions.
    
    Output strictly valid JSON matching the schema.
  `;

  // Prepare parts
  const parts: any[] = [{ text: prompt }];
  
  images.forEach(img => {
    parts.push({
      inlineData: {
        mimeType: img.mimeType,
        data: img.base64
      }
    });
  });

  try {
    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        role: 'user',
        parts: parts
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: analysisSchema,
        temperature: 0.1 // Very low temperature for factual extraction
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    
    return JSON.parse(text) as AnalysisResult;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

export const generateDoctorIcon = async (): Promise<string | null> => {
  try {
    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: 'A cute, minimalistic 3D cartoon doctor icon. Friendly face, wearing a white coat and stethoscope. Soft studio lighting, Apple emoji style aesthetic, white background.',
          },
        ],
      },
    });
    
    // The image is usually in the candidates content parts
    for (const candidate of response.candidates || []) {
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
           return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Failed to generate icon:", error);
    return null;
  }
}