import React, { useState, useRef, useEffect } from 'react';
import { Button } from './components/Button';
import { Card } from './components/Card';
import { MedicationList } from './components/MedicationList';
import { ScheduleTimeline } from './components/ScheduleTimeline';
import { LandingPage } from './components/LandingPage';
import { analyzeMedicationImages, generateDoctorIcon } from './services/geminiService';
import { AnalysisResult, AppStatus } from './types';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Utility for image reading
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [images, setImages] = useState<File[]>([]);
  const [data, setData] = useState<AnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [doctorLogo, setDoctorLogo] = useState<string | null>(null);

  // Generate logo on mount
  useEffect(() => {
    const fetchLogo = async () => {
      const logo = await generateDoctorIcon();
      if (logo) setDoctorLogo(logo);
    };
    fetchLogo();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const validFiles = Array.from(e.dataTransfer.files).filter(file => 
        file.type.startsWith('image/')
      );
      if (validFiles.length > 0) {
        setImages(prev => [...prev, ...validFiles]);
      }
    }
  };

  const startAnalysis = async () => {
    if (images.length === 0) return;
    setStatus(AppStatus.ANALYZING);
    setErrorMsg(null);

    try {
      const imagePayloads = await Promise.all(images.map(async (file) => ({
        base64: await fileToBase64(file),
        mimeType: file.type
      })));

      const result = await analyzeMedicationImages(imagePayloads);
      setData(result);
      setStatus(AppStatus.REVIEW_PENDING);
    } catch (e) {
      console.error(e);
      setErrorMsg("Analysis failed. Please try again with clearer images.");
      setStatus(AppStatus.IDLE);
    }
  };

  const handleApproval = () => {
    setStatus(AppStatus.APPROVED);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('report-content');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 30;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, (imgHeight * pdfWidth) / imgWidth);
      pdf.save('medivision-schedule.pdf');
    } catch (err) {
      console.error("PDF generation failed", err);
    }
  };

  const resetFlow = () => {
    setImages([]);
    setData(null);
    setStatus(AppStatus.IDLE);
  };

  // --- Views ---

  if (!isLoggedIn) {
    return <LandingPage onLogin={() => setIsLoggedIn(true)} logoUrl={doctorLogo} />;
  }

  const renderHeader = () => (
    <header className="sticky top-0 z-50 bg-[#FBFBFD]/80 backdrop-blur-xl border-b border-gray-200/50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {doctorLogo ? (
            <img src={doctorLogo} alt="Logo" className="w-8 h-8 rounded-lg shadow-sm object-cover" />
          ) : (
            <div className="w-8 h-8 bg-gradient-to-br from-[#0071e3] to-[#0077ED] rounded-lg flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20 text-sm">
              M
            </div>
          )}
          <h1 className="text-[17px] font-semibold text-gray-900 tracking-tight">MediVision</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 text-[10px] font-bold">
              DS
            </div>
            <span className="text-[13px] font-medium text-gray-600">Dr. Smith</span>
          </div>
          <button 
            onClick={() => setIsLoggedIn(false)}
            className="text-[13px] text-gray-500 hover:text-gray-900 font-medium transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );

  const renderHero = () => (
    <div className="text-center py-16 animate-fade-in">
      <h2 className="text-4xl sm:text-[44px] font-bold text-[#1D1D1F] mb-4 tracking-tight leading-tight">
        Medication Reconciliation <br/>
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0071e3] to-[#40C8E0]">Simplified.</span>
      </h2>
      <p className="text-[17px] text-[#86868b] max-w-2xl mx-auto leading-relaxed font-normal">
        Upload hospital discharge summaries and photos of home medication bottles.
        Our AI extracts instructions to generate a unified schedule.
      </p>
    </div>
  );

  const renderUploadSection = () => (
    <div className="max-w-2xl mx-auto animate-fade-in delay-100 pb-20">
      <Card className={`mb-8 border-dashed border-2 transition-all duration-300 group shadow-none 
        ${isDragging 
          ? 'border-[#0071e3] bg-blue-50/50 scale-[1.02]' 
          : 'border-gray-300 bg-white/50 hover:bg-white hover:border-[#0071e3]/50 hover:shadow-lg hover:shadow-blue-500/5'
        }`}>
        <div 
          className="flex flex-col items-center justify-center py-12 cursor-pointer relative"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isDragging && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm rounded-[24px] z-10">
              <p className="text-lg font-bold text-[#0071e3]">Drop to upload</p>
            </div>
          )}
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 group-hover:bg-blue-100">
            <svg className="w-8 h-8 text-[#0071e3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-gray-900">Drag & Drop or Click to Upload</p>
          <p className="text-sm text-gray-500 mt-2">Documents & Bottles (JPG, PNG)</p>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            multiple 
            accept="image/*" 
            onChange={handleImageUpload} 
          />
        </div>
        
        {images.length > 0 && (
          <div className="border-t border-gray-100 pt-6 mt-2">
            <div className="flex gap-4 overflow-x-auto pb-4 px-2">
              {images.map((img, idx) => (
                <div key={idx} className="flex-shrink-0 w-20 h-20 rounded-xl bg-gray-100 overflow-hidden relative border border-gray-200 shadow-sm">
                  <img 
                    src={URL.createObjectURL(img)} 
                    alt="preview" 
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="flex-shrink-0 flex flex-col items-center justify-center w-20 h-20 rounded-xl border border-gray-200 bg-gray-50 text-gray-400 hover:bg-gray-100 cursor-pointer transition-colors"
              >
                 <span className="text-2xl mb-1 font-light">+</span>
              </div>
            </div>
            <div className="flex justify-center mt-6">
              <Button 
                onClick={startAnalysis} 
                isLoading={status === AppStatus.ANALYZING}
                className="w-full sm:w-auto min-w-[200px]"
              >
                Analyze & Generate
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );

  const renderReviewSection = () => {
    if (!data) return null;
    return (
      <div className="space-y-8 animate-fade-in pb-20">
        
        {/* Status Bar */}
        <div className="glass-panel rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 sticky top-20 z-40 bg-white/80">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Review Schedule</h3>
              <p className="text-gray-500 text-xs mt-0.5">Please verify instructions extracted from bottles.</p>
            </div>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
             <Button variant="secondary" onClick={resetFlow} className="flex-1 md:flex-none text-sm">
               Cancel
             </Button>
             <Button onClick={handleApproval} className="flex-1 md:flex-none text-sm shadow-lg shadow-blue-500/20">
               Approve Schedule
             </Button>
          </div>
        </div>

        {/* Warnings */}
        {data.warnings.length > 0 && (
          <div className="bg-red-50/50 border border-red-100 rounded-2xl p-6">
            <h4 className="text-sm font-bold text-red-600 uppercase tracking-wide mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Clinical Alerts
            </h4>
            <ul className="space-y-2">
              {data.warnings.map((w, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-700 text-sm">
                  <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-1.5 flex-shrink-0"></span>
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MedicationList medications={data.medications} />
          <ScheduleTimeline schedule={data.schedule} medications={data.medications} />
        </div>
      </div>
    );
  };

  const renderApprovedView = () => {
    if (!data) return null;
    return (
      <div className="space-y-8 animate-fade-in pb-20">
        <div className="bg-gradient-to-b from-[#34C759]/5 to-transparent border border-[#34C759]/20 rounded-3xl p-12 text-center relative overflow-hidden no-print">
          <div className="relative z-10">
            <div className="w-16 h-16 bg-[#34C759] text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-500/30">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Reconciliation Complete</h2>
            <p className="text-gray-500 mt-2 text-base">The reconciled medication plan has been approved.</p>
            
            <div className="mt-8 flex justify-center gap-4">
              <Button variant="secondary" onClick={handleDownloadPDF}>Download PDF</Button>
              <Button variant="primary" onClick={resetFlow}>New Patient</Button>
            </div>
          </div>
        </div>

        <div id="report-content" className="bg-white p-8 rounded-xl">
          <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-100">
             {doctorLogo && <img src={doctorLogo} className="w-10 h-10 rounded-lg"/>}
             <div>
               <h2 className="text-xl font-bold text-gray-900">Daily Medication Schedule</h2>
               <p className="text-sm text-gray-500">Generated by MediVision</p>
             </div>
          </div>
          <ScheduleTimeline schedule={data.schedule} medications={data.medications} />
          
          <div className="mt-8 pt-8 border-t border-gray-100 text-xs text-gray-400">
             <p>Disclaimer: This schedule is generated by AI and approved by a healthcare professional. Please consult your doctor for any questions.</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#FBFBFD]">
      {renderHeader()}
      
      <main className="max-w-6xl mx-auto px-6 pt-12">
        
        {(status === AppStatus.IDLE || status === AppStatus.ANALYZING) && (
          <>
            {renderHero()}
            {errorMsg && (
              <div className="max-w-xl mx-auto bg-red-50 text-red-600 p-4 rounded-xl mb-8 flex items-center gap-3 border border-red-100 text-sm justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {errorMsg}
              </div>
            )}
            {renderUploadSection()}
          </>
        )}

        {status === AppStatus.REVIEW_PENDING && renderReviewSection()}

        {status === AppStatus.APPROVED && renderApprovedView()}

      </main>
    </div>
  );
}