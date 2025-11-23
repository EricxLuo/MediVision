
import React, { useState, useRef, useEffect } from 'react';
import { Button } from './components/Button';
import { Card } from './components/Card';
import { MedicationList } from './components/MedicationList';
import { ScheduleTimeline } from './components/ScheduleTimeline';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { CameraModal } from './components/CameraModal';
import { analyzeMedicationImages, generateDoctorIcon } from './services/geminiService';
import { AnalysisResult, AppStatus, Medication, TimeSlot, User, HistoryRecord } from './types';
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

// Opening Blur Effect Component
const BlurOverlay = () => {
  const [visible, setVisible] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      className={`fixed inset-0 z-[100] bg-white/20 backdrop-blur-[40px] transition-opacity duration-[1500ms] pointer-events-none flex items-center justify-center ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
      <div className="text-gray-400 font-light tracking-widest text-sm animate-pulse">INITIALIZING VISION...</div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [images, setImages] = useState<File[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  
  const [data, setData] = useState<AnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [doctorLogo, setDoctorLogo] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [scheduleName, setScheduleName] = useState<string>('');
  
  // Highlighting state for warnings
  const [highlightedMedIds, setHighlightedMedIds] = useState<string[]>([]);

  // Generate logo on mount
  useEffect(() => {
    const fetchLogo = async () => {
      const logo = await generateDoctorIcon();
      if (logo) setDoctorLogo(logo);
    };
    fetchLogo();
  }, []);

  const handleLogin = (username: string) => {
    setUser({ name: username, id: 'u1' });
    setStatus(AppStatus.DASHBOARD);
  };

  const handleSignOut = () => {
    setUser(null);
    setStatus(AppStatus.IDLE);
    setImages([]);
    setData(null);
    setScheduleName('');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setImages(prev => [...prev, ...newFiles]);
    }
    // Critical: Reset value to allow selecting the same file again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCameraCapture = (files: File[]) => {
    setImages(prev => [...prev, ...files]);
  };

  // Drag and Drop handlers for file upload
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
      const validFiles = Array.from(e.dataTransfer.files).filter((file: File) => 
        file.type.startsWith('image/')
      );
      if (validFiles.length > 0) {
        setImages(prev => [...prev, ...validFiles]);
      }
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const startAnalysis = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (images.length === 0) {
      setErrorMsg("Please upload images or take photos of your medications.");
      return;
    }

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

  const handleMedicationUpdate = (id: string, field: keyof Medication, value: string) => {
    if (!data) return;
    const updatedMeds = data.medications.map(med => 
      med.id === id ? { ...med, [field]: value } : med
    );
    setData({ ...data, medications: updatedMeds });
  };

  const handleMoveMedication = (medId: string, fromSlot: TimeSlot, toSlot: TimeSlot) => {
    if (!data) return;
    const newSchedule = { ...data.schedule };
    
    // Remove from old
    newSchedule[fromSlot] = newSchedule[fromSlot].filter(id => id !== medId);
    
    // Add to new if not there
    if (!newSchedule[toSlot].includes(medId)) {
       newSchedule[toSlot].push(medId);
    }
    
    setData({ ...data, schedule: newSchedule });
  };

  const handleApproval = () => {
    if (data) {
      const finalName = scheduleName.trim() || `Schedule ${history.length + 1}`;
      // Save to history
      const newRecord: HistoryRecord = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        scheduleName: finalName,
        data: { ...data } // Copy data
      };
      setHistory([newRecord, ...history]);
      
      // Update scheduleName if it was empty so it shows in print view
      if (!scheduleName.trim()) {
        setScheduleName(finalName);
      }
    }
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
      
      const finalHeight = (imgHeight * pdfWidth) / imgWidth;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, finalHeight);
      pdf.save(`medivision-${scheduleName.replace(/\s+/g, '-').toLowerCase() || 'schedule'}.pdf`);
    } catch (err) {
      console.error("PDF generation failed", err);
    }
  };

  const resetFlow = () => {
    setImages([]);
    setData(null);
    setScheduleName('');
    setStatus(AppStatus.DASHBOARD);
  };
  
  const goToDashboard = () => {
    resetFlow();
  };

  // --- Views ---

  if (!user) {
    return (
      <>
        <BlurOverlay />
        <LandingPage onLogin={handleLogin} logoUrl={doctorLogo} />
      </>
    );
  }

  const renderHeader = () => (
    <header className="sticky top-0 z-50 bg-[#FBFBFD]/80 backdrop-blur-xl border-b border-gray-200/50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div 
          className="flex items-center gap-3 cursor-pointer"
          onClick={goToDashboard}
        >
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
              {user.name.charAt(0).toUpperCase()}{user.name.charAt(1).toUpperCase()}
            </div>
            <span className="text-[13px] font-medium text-gray-600">{user.name}</span>
          </div>
          <button 
            onClick={handleSignOut}
            className="text-[13px] text-gray-500 hover:text-gray-900 font-medium transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );

  const renderHero = () => (
    <div className="text-center py-20 animate-fade-in relative z-10">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-100/50 blur-[100px] rounded-full -z-10 mix-blend-multiply opacity-50"></div>
      
      <span className="inline-block py-1.5 px-4 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[11px] font-bold uppercase tracking-widest mb-6 shadow-sm">
        AI-Powered Pharmacy Assistant
      </span>
      <h2 className="text-5xl sm:text-6xl font-bold text-[#1D1D1F] mb-6 tracking-tight leading-[1.1]">
        Seamless Medication<br/>
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0071e3] to-[#40C8E0]">Reconciliation.</span>
      </h2>
      <p className="text-lg text-[#86868b] max-w-2xl mx-auto leading-relaxed font-normal">
        MediVision analyzes discharge summaries and pill bottles to generate a unified, conflict-free schedule, ensuring patient safety during care transitions.
      </p>
    </div>
  );

  const renderUploadSection = () => (
    <div className="max-w-2xl mx-auto animate-fade-in delay-100 pb-20">
      <div className="mb-6">
        <Button variant="ghost" onClick={goToDashboard} className="pl-0 hover:bg-transparent text-gray-500 hover:text-gray-900">
           ← Back to Dashboard
        </Button>
      </div>
      
      <Card className={`mb-8 border-2 transition-all duration-500 group shadow-none overflow-visible relative
        ${isDragging 
          ? 'border-[#0071e3] bg-blue-50/50 scale-[1.02] shadow-xl shadow-blue-500/10' 
          : 'border-dashed border-gray-300 bg-white/50 hover:bg-white hover:border-[#0071e3]/50 hover:shadow-2xl hover:shadow-blue-500/10'
        }`}>
        
        {/* Animated background element */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-blue-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-[24px]"></div>

        <div 
          className="flex flex-col items-center justify-center py-16 cursor-pointer relative z-10 rounded-[24px]"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isDragging && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-md z-20 transition-all duration-300 rounded-[24px]">
              <div className="transform scale-110 text-[#0071e3] font-bold text-xl">Drop files to analyze</div>
            </div>
          )}
          
          <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 group-hover:scale-110 group-hover:-rotate-2 transition-all duration-500">
             <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-[#0071e3]">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
             </div>
          </div>
          
          <p className="text-xl font-semibold text-gray-900 mb-2">Upload Documents & Bottles</p>
          <p className="text-sm text-gray-500 max-w-sm text-center leading-relaxed mb-6">
            Drag and drop discharge summaries or photos of medication labels here.
          </p>

          {/* Camera Button Inline */}
          <button
            onClick={(e) => { e.stopPropagation(); setShowCamera(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-all shadow-lg shadow-gray-200"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Take Photo
          </button>
        </div>
        
        {/* Input placed here, logically associated but hidden */}
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          multiple 
          accept="image/*" 
          onChange={handleImageUpload} 
        />
        
        {/* Images Preview Bar - Docked to bottom with negative margins to counteract Card padding */}
        {images.length > 0 && (
          <div className="border-t border-gray-100 bg-gray-50/90 p-6 -mx-8 -mb-8 rounded-b-[24px] backdrop-blur-xl relative z-30 animate-fade-in shadow-inner">
            <div className="flex items-center justify-between mb-4 px-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Selected ({images.length})</span>
              <button 
                onClick={(e) => { e.stopPropagation(); setImages([]); }}
                className="text-xs text-red-500 hover:text-red-600 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
              >
                Clear All
              </button>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide items-start">
              {images.map((img, idx) => (
                <div key={`img-${idx}`} className="flex-shrink-0 w-24 h-24 rounded-xl bg-white overflow-hidden relative border border-gray-200 shadow-sm group/preview">
                  <img 
                    src={URL.createObjectURL(img)} 
                    alt="preview" 
                    className="w-full h-full object-cover"
                  />
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                    className="absolute top-1 right-1 w-6 h-6 bg-white text-gray-500 hover:text-red-500 hover:bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 transition-all duration-200 hover:scale-110 z-10"
                  >
                     <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}

              {/* Add File Button - Re-triggers input */}
              <div 
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                className="flex-shrink-0 flex flex-col items-center justify-center w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 bg-white text-gray-400 hover:border-[#0071e3] hover:text-[#0071e3] cursor-pointer transition-all group/add"
                title="Add more images"
              >
                 <span className="text-2xl font-light group-hover/add:scale-110 transition-transform">+</span>
              </div>
            </div>

            <div className="flex justify-center mt-6">
              <Button 
                onClick={startAnalysis} 
                isLoading={status === AppStatus.ANALYZING}
                className="w-full sm:w-auto min-w-[240px] shadow-xl shadow-blue-500/20 relative z-30"
              >
                Start Analysis
              </Button>
            </div>
          </div>
        )}
      </Card>
      
      {showCamera && (
        <CameraModal 
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );

  const renderReviewSection = () => {
    if (!data) return null;
    return (
      <div className="space-y-8 animate-fade-in pb-20">
        
        {/* Status Bar */}
        <div className="glass-panel rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-6 sticky top-20 z-40 bg-white/90 shadow-xl shadow-gray-200/50 backdrop-blur-xl transition-all duration-300">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Review Schedule</h3>
              <p className="text-gray-500 text-xs mt-0.5 hidden sm:block">Verify detected medications. Drag items to reschedule.</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-stretch">
             {/* Schedule Name Input */}
             <input 
               type="text" 
               placeholder="Enter Schedule Name (e.g. Patient Name)" 
               value={scheduleName}
               onChange={(e) => setScheduleName(e.target.value)}
               className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-full focus:ring-blue-500 focus:border-blue-500 block px-4 py-2 outline-none w-full sm:w-64 transition-all"
             />

             <div className="flex gap-2">
               <Button variant="secondary" onClick={goToDashboard} className="flex-1 md:flex-none text-sm py-2">
                 Cancel
               </Button>
               <Button onClick={handleApproval} className="flex-1 md:flex-none text-sm shadow-lg shadow-blue-500/20 py-2">
                 Approve
               </Button>
             </div>
          </div>
        </div>

        {/* Warnings with Highlighting */}
        {data.warnings.length > 0 && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6 shadow-sm">
            <h4 className="text-sm font-bold text-red-600 uppercase tracking-wide mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Clinical Alerts
            </h4>
            <div className="space-y-2">
              {data.warnings.map((w, i) => (
                <div 
                  key={i} 
                  className="flex items-start gap-3 text-gray-700 text-sm p-3 rounded-xl bg-white/50 border border-red-100 hover:bg-red-100/50 transition-colors cursor-pointer"
                  onMouseEnter={() => setHighlightedMedIds(w.relatedMedicationIds)}
                  onMouseLeave={() => setHighlightedMedIds([])}
                >
                  <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-1.5 flex-shrink-0"></span>
                  <span>{w.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MedicationList 
            medications={data.medications} 
            onUpdate={handleMedicationUpdate}
            highlightedIds={highlightedMedIds}
          />
          <ScheduleTimeline 
            schedule={data.schedule} 
            medications={data.medications} 
            isEditable={true}
            onMove={handleMoveMedication}
          />
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
            <p className="text-gray-500 mt-2 text-base">The reconciled medication plan for <strong>{scheduleName}</strong> has been approved.</p>
            
            <div className="mt-8 flex justify-center gap-4">
              <Button variant="secondary" onClick={handleDownloadPDF}>Download PDF</Button>
              <Button variant="primary" onClick={goToDashboard}>Back to Dashboard</Button>
            </div>
          </div>
        </div>

        <div id="report-content" className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <ScheduleTimeline 
            schedule={data.schedule} 
            medications={data.medications} 
            warnings={data.warnings}
            mode="print"
            scheduleName={scheduleName}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#FBFBFD]">
      {renderHeader()}
      
      <main className="max-w-6xl mx-auto px-6 pt-12">
        
        {status === AppStatus.DASHBOARD && (
          <Dashboard 
            user={user} 
            history={history} 
            onNewScan={() => setStatus(AppStatus.IDLE)}
            onViewRecord={(record) => {
              setData(record.data);
              setScheduleName(record.scheduleName);
              setStatus(AppStatus.APPROVED);
            }} 
          />
        )}

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
