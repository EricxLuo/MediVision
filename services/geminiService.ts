import { GoogleGenAI, Type } from "@google/genai";
import { Medication, DailyScheduleItem } from "../types";

// 1. OCR Extraction: Extracts medication details from an image
export const extractMedicationsFromImage = async (
  imageBase64: string,
  sourceType: 'HOSPITAL_DISCHARGE' | 'HOME_MEDICATION'
): Promise<Medication[]> => {
  // Use process.env.API_KEY directly as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Clean base64 string if it has prefix
  const cleanBase64 = imageBase64.split(',')[1] || imageBase64;

  const prompt = `
    Analyze this image of a medication label or prescription list.
    Extract the following details for each medication found:
    - Name (Brand or Generic)
    - Dosage (e.g., 10mg, 5ml)
    - Frequency (e.g., Twice daily, every 8 hours)
    - Specific Instructions (e.g., Take with food, Do not crush)
    
    Return a JSON array.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png', // Assuming PNG/JPEG, Gemini handles standard image types
              data: cleanBase64
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              dosage: { type: Type.STRING },
              frequency: { type: Type.STRING },
              instructions: { type: Type.STRING }
            },
            required: ['name', 'dosage', 'frequency', 'instructions']
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) return [];
    
    const rawData = JSON.parse(jsonText);
    
    // Map to our internal type with IDs
    return rawData.map((med: any) => ({
      id: crypto.randomUUID(),
      name: med.name,
      dosage: med.dosage,
      frequency: med.frequency,
      instructions: med.instructions,
      source: sourceType,
      originalImage: imageBase64 // Keep reference for the pharmacist
    }));

  } catch (error) {
    console.error("Gemini OCR Error:", error);
    throw error;
  }
};

// 2. Schedule Generation: Creates a consolidated schedule from a list of meds
export const generateDailySchedule = async (medications: Medication[]): Promise<DailyScheduleItem[]> => {
  // Use process.env.API_KEY directly as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const medListString = JSON.stringify(medications.map(m => ({
    name: m.name,
    dosage: m.dosage,
    frequency: m.frequency,
    source: m.source
  })));

  const prompt = `
    You are an expert pharmacist assistant.
    Given the following list of medications from both hospital discharge and home supply, create a consolidated 'Daily Medication Schedule'.
    
    Rules:
    1. Organize into: 'Morning', 'Afternoon', 'Evening', 'Bedtime'.
    2. Check for potential duplicates (e.g., patient has 'Lipitor' at home but prescribed 'Atorvastatin' at discharge). If a duplicate is likely, prioritize the HOSPITAL_DISCHARGE one but note the conflict in the notes.
    3. Consider standard administration times (e.g., diuretics in morning, statins at bedtime).
    
    Medications: ${medListString}
    
    Return a JSON array of schedule items.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              timeOfDay: { type: Type.STRING, enum: ['Morning', 'Afternoon', 'Evening', 'Bedtime'] },
              medicationNames: { type: Type.ARRAY, items: { type: Type.STRING } },
              notes: { type: Type.STRING }
            },
            required: ['timeOfDay', 'medicationNames']
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) return [];

    const rawSchedule = JSON.parse(jsonText);

    // Re-map the simple string names back to the full medication objects for the UI
    const finalSchedule: DailyScheduleItem[] = rawSchedule.map((item: any) => {
      const matchedMeds = medications.filter(m => 
        item.medicationNames.some((n: string) => m.name.toLowerCase().includes(n.toLowerCase()) || n.toLowerCase().includes(m.name.toLowerCase()))
      );
      return {
        timeOfDay: item.timeOfDay,
        medications: matchedMeds,
        notes: item.notes
      };
    });

    return finalSchedule;

  } catch (error) {
    console.error("Gemini Schedule Gen Error:", error);
    throw error;
  }
};