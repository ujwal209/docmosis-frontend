import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileOutput, FileImage, Layers, Scissors, Minimize2, 
  ArrowLeft, HardDrive, Loader2, CheckCircle2, X, File as FileIcon, ArrowRight, Search, Lock, Unlock, UploadCloud
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { fetchAPI } from '@/lib/api';
import { toast } from "sonner";

// Safely grab the API URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// --- CONVERSION TOOLS DATA (PDF to Word removed) ---
const CONVERSION_TOOLS = [
  {
    id: 'word-to-pdf', label: 'Word to PDF', desc: 'Lock formatting and secure your Word files as PDFs.',
    icon: FileOutput, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'hover:border-emerald-300 dark:hover:border-emerald-700/50'
  },
  {
    id: 'image-to-pdf', label: 'Images to PDF', desc: 'Combine PNGs or JPEGs into a single organized PDF.',
    icon: FileImage, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'hover:border-amber-300 dark:hover:border-amber-700/50'
  },
  {
    id: 'merge-pdf', label: 'Merge PDFs', desc: 'Combine multiple PDF files into one continuous document.',
    icon: Layers, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/10', border: 'hover:border-purple-300 dark:hover:border-purple-700/50'
  },
  {
    id: 'split-pdf', label: 'Split PDF', desc: 'Extract specific pages or separate large PDFs.',
    icon: Scissors, color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-500/10', border: 'hover:border-cyan-300 dark:hover:border-cyan-700/50'
  },
  {
    id: 'compress-pdf', label: 'Compress PDF', desc: 'Reduce file size heavily while maintaining visual quality.',
    icon: Minimize2, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-500/10', border: 'hover:border-rose-300 dark:hover:border-rose-700/50'
  },
  {
    id: 'lock-pdf', label: 'Lock PDF', desc: 'Secure your PDF document with a strong password.',
    icon: Lock, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-500/10', border: 'hover:border-indigo-300 dark:hover:border-indigo-700/50'
  },
  {
    id: 'unlock-pdf', label: 'Unlock PDF', desc: 'Remove password protection and permissions from a PDF.',
    icon: Unlock, color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-500/10', border: 'hover:border-slate-300 dark:hover:border-slate-700/50'
  }
];

export default function Convert() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // App State
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data State
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isUploadingLocal, setIsUploadingLocal] = useState(false);
  
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [filePassword, setFilePassword] = useState(''); 
  
  // Modal State
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);

  const activeTool = CONVERSION_TOOLS.find(t => t.id === selectedToolId);
  const filteredTools = CONVERSION_TOOLS.filter(t => t.label.toLowerCase().includes(searchQuery.toLowerCase()) || t.desc.toLowerCase().includes(searchQuery.toLowerCase()));

  useEffect(() => {
    if (isDriveModalOpen && driveFiles.length === 0) fetchDriveFiles();
  }, [isDriveModalOpen]);

  const fetchDriveFiles = async () => {
    setIsLoadingFiles(true);
    try {
      const data = await fetchAPI('/drive/contents');
      setDriveFiles(data.files || []);
    } catch (err) {
      toast.error("Failed to load files from Drive.");
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleSelectTool = (id: string) => {
    setSelectedToolId(id);
    setStep(2);
  };

  const handleBackToTools = () => {
    setStep(1);
    setSelectedToolId(null);
    setSelectedFiles([]); 
    setFilePassword('');
  };

  const toggleFileInModal = (file: any) => {
    setSelectedFiles(prev => prev.some(f => f.id === file.id) ? prev.filter(f => f.id !== file.id) : [...prev, file]);
  };

  // MANUAL LOCAL UPLOAD LOGIC
  const handleLocalUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLocal(true);
    toast.info(`Uploading ${file.name} to Drive...`);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('docmosiss_token');
      // DYNAMIC URL - NO HARDCODING
      const res = await fetch(`${API_URL}/drive/files/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!res.ok) throw new Error("Upload failed");
      
      const data = await res.json();
      const newFile = data.file;

      toast.success(`${file.name} uploaded!`);
      
      setSelectedFiles(prev => [...prev, newFile]);
      fetchDriveFiles(); 

    } catch (err) {
      toast.error("Upload failed. Please try again.");
    } finally {
      setIsUploadingLocal(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleConvert = async () => {
    if (!activeTool || selectedFiles.length === 0) return;

    if (activeTool.id === 'merge-pdf' && selectedFiles.length < 2) {
      return toast.error("You need at least two files to merge them!");
    }

    if (['lock-pdf', 'unlock-pdf'].includes(activeTool.id) && !filePassword) {
      return toast.error(`Please enter a password to ${activeTool.id.split('-')[0]} the PDF.`);
    }

    setIsConverting(true);
    toast.info(`Engine started: ${activeTool.label}. This may take a moment...`);

    try {
      const payload = {
        tool: activeTool.id,
        file_ids: selectedFiles.map(f => f.id),
        target_folder_id: null,
        password: filePassword || null
      };

      const response = await fetchAPI('/convert/', { method: 'POST', body: JSON.stringify(payload) });

      toast.success(response.message || "Conversion complete!");
      handleBackToTools();
      navigate('/dashboard/drive'); 
      
    } catch (err: any) {
      toast.error(err.message || "Engine failed to process the document.");
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8 mt-4 space-y-10">
      
      <input type="file" ref={fileInputRef} onChange={handleLocalUpload} className="hidden" />

      {/* DRIVE MODAL */}
      <Dialog open={isDriveModalOpen} onOpenChange={setIsDriveModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-emerald-500" /> Select Files from Drive
            </DialogTitle>
          </DialogHeader>
          <div className="min-h-[300px] max-h-[500px] overflow-y-auto bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 mt-4">
            {isLoadingFiles ? (
              <div className="flex flex-col items-center justify-center h-64 text-zinc-500"><Loader2 className="h-8 w-8 animate-spin mb-2" />Fetching your drive...</div>
            ) : driveFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-zinc-500 text-center px-4">
                <HardDrive className="h-10 w-10 mb-3 opacity-20" />
                <p className="font-medium text-zinc-900 dark:text-zinc-200">Your Drive is empty</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-2">
                {driveFiles.map(file => {
                  const isSelected = selectedFiles.some(f => f.id === file.id);
                  return (
                    <div key={file.id} onClick={() => toggleFileInModal(file)} className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-all ${isSelected ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'}`}>
                      <div className={`w-5 h-5 shrink-0 rounded border flex items-center justify-center ${isSelected ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-zinc-300 dark:border-zinc-700'}`}>{isSelected && <CheckCircle2 className="h-3.5 w-3.5" />}</div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{file.original_name}</p>
                        <p className="text-xs text-zinc-500 uppercase">{file.extension}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <DialogFooter className="mt-4 flex justify-between items-center">
            <span className="text-sm font-medium text-zinc-500">{selectedFiles.length} file(s) selected</span>
            <Button onClick={() => setIsDriveModalOpen(false)} className="bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900">Confirm Selection</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- STEP 1: CLEAN PROFESSIONAL HERO & CENTERED GRID --- */}
      {step === 1 && (
        <div className="animate-in fade-in zoom-in-95 duration-500">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-10 sm:p-16 text-center shadow-sm mb-12">
            <div className="max-w-2xl mx-auto space-y-6">
              <Badge variant="secondary" className="bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">Processing Engine v1.0</Badge>
              <h1 className="text-3xl sm:text-4xl font-display font-semibold text-zinc-900 dark:text-white tracking-tight">
                Document Conversion Tools
              </h1>
              <p className="text-zinc-500 dark:text-zinc-400 text-base">
                Search and select a tool below to process your documents securely.
              </p>
              <div className="relative max-w-md mx-auto mt-8">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-zinc-400" />
                </div>
                <Input 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tools (e.g. 'merge', 'lock')..." 
                  className="pl-10 h-12 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-base focus-visible:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
              {filteredTools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <div 
                    key={tool.id} onClick={() => handleSelectTool(tool.id)}
                    className={`group cursor-pointer bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 transition-all duration-300 shadow-sm hover:shadow-md ${tool.border}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-4 rounded-xl shrink-0 transition-colors ${tool.bg} ${tool.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-zinc-900 dark:text-white">{tool.label}</h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5 leading-snug">{tool.desc}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredTools.length === 0 && (
                <div className="col-span-full text-center py-12 text-zinc-500">No tools found matching "{searchQuery}"</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- STEP 2: TOOL WORKSPACE --- */}
      {step === 2 && activeTool && (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
          
          <div className="flex items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
            <Button variant="outline" size="icon" onClick={handleBackToTools} className="shrink-0 h-10 w-10 rounded-full">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${activeTool.bg} ${activeTool.color}`}><activeTool.icon className="h-6 w-6" /></div>
              <div>
                <h1 className="text-2xl font-display font-semibold tracking-tight text-zinc-900 dark:text-white">{activeTool.label}</h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Configure your process</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-10 shadow-sm">
            <div className="flex flex-col md:flex-row gap-8">
              
              {/* Left Side: Selected Files */}
              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-zinc-900 dark:text-white">Selected Documents</h3>
                  <Badge variant="secondary" className="bg-zinc-100 dark:bg-zinc-900">{selectedFiles.length} files</Badge>
                </div>

                {selectedFiles.length === 0 ? (
                  <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl p-10 flex flex-col items-center text-center bg-zinc-50/50 dark:bg-zinc-900/20">
                    <FileIcon className="h-10 w-10 text-zinc-400 mb-3" />
                    <p className="font-medium text-zinc-900 dark:text-zinc-200 mb-1">No files selected</p>
                    <p className="text-sm text-zinc-500 mb-6 max-w-xs">Upload from your computer or pick files already in your Drive.</p>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <Button 
                        onClick={() => fileInputRef.current?.click()} 
                        disabled={isUploadingLocal}
                        className="bg-emerald-600 text-white hover:bg-emerald-700 w-44"
                      >
                        {isUploadingLocal ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UploadCloud className="h-4 w-4 mr-2" />}
                        Upload Computer
                      </Button>
                      <span className="text-xs font-medium text-zinc-400 uppercase">OR</span>
                      <Button 
                        onClick={() => setIsDriveModalOpen(true)} 
                        variant="outline"
                        className="w-44"
                      >
                        <HardDrive className="h-4 w-4 mr-2 text-zinc-500" /> Browse Drive
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedFiles.map(file => (
                      <div key={file.id} className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 bg-white dark:bg-zinc-950 rounded border border-zinc-200 dark:border-zinc-800 text-zinc-500"><FileIcon className="h-4 w-4" /></div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{file.original_name}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setSelectedFiles(prev => prev.filter(f => f.id !== file.id))} className="text-zinc-400 hover:text-red-500"><X className="h-4 w-4" /></Button>
                      </div>
                    ))}
                    
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <Button variant="outline" className="border-dashed" onClick={() => setIsDriveModalOpen(true)}>
                        <HardDrive className="h-4 w-4 mr-2 text-zinc-500" /> Add from Drive
                      </Button>
                      <Button variant="outline" className="border-dashed" onClick={() => fileInputRef.current?.click()} disabled={isUploadingLocal}>
                        {isUploadingLocal ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UploadCloud className="h-4 w-4 mr-2 text-emerald-500" />} 
                        Upload More
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Side: Action Panel */}
              <div className="w-full md:w-72 space-y-6">
                <div className="bg-zinc-50 dark:bg-zinc-900/50 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <h4 className="font-medium text-zinc-900 dark:text-zinc-100 mb-4">Process Configuration</h4>
                  
                  {['lock-pdf', 'unlock-pdf'].includes(activeTool.id) && (
                    <div className="mb-6 space-y-2 border-b border-zinc-200 dark:border-zinc-800 pb-6">
                      <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        {activeTool.id === 'lock-pdf' ? 'Encryption Password' : 'Current Password'}
                      </label>
                      <Input 
                        type="password" 
                        placeholder={activeTool.id === 'lock-pdf' ? "Create a password..." : "Enter file password..."} 
                        value={filePassword}
                        onChange={(e) => setFilePassword(e.target.value)}
                        className="bg-white dark:bg-zinc-950"
                      />
                      <p className="text-xs text-zinc-500">
                        {activeTool.id === 'lock-pdf' ? 'This password will be required to open the PDF.' : 'Required to unlock and remove permissions.'}
                      </p>
                    </div>
                  )}

                  <ul className="text-sm text-zinc-500 dark:text-zinc-400 space-y-2 mb-6">
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" /> Original files remain intact</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" /> Saved directly to Drive</li>
                  </ul>
                  
                  <Button onClick={handleConvert} disabled={isConverting || selectedFiles.length === 0} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm h-12">
                    {isConverting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</> : <>Run Engine <ArrowRight className="h-4 w-4 ml-2" /></>}
                  </Button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}