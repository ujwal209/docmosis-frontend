import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Download, Trash2, FileText, 
  Loader2, Send, Sparkles, X, Maximize2, Minimize2, Plus, History, MessageSquare
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { fetchAPI } from '@/lib/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Helper to format bytes
function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

// Helper to format date
function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function DocumentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Document State
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Chat State
  const [docSessions, setDocSessions] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  // Layout State
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [isMobileFullscreen, setIsMobileFullscreen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(420);
  const [isResizing, setIsResizing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // --- 1. RESIZE LOGIC (WITH IFRAME SHIELD) ---
  const startResizing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      if (!isResizing) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const newWidth = document.body.clientWidth - clientX;
      if (newWidth > 300 && newWidth < 800) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => setIsResizing(false);

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleMouseMove);
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isResizing]);

  // --- 2. FETCH DATA ---
  useEffect(() => {
    const loadWorkspace = async () => {
      try {
        const docData = await fetchAPI(`/drive/files/${id}`);
        setDoc(docData);

        const allSessions = await fetchAPI('/assistant/sessions');
        const filteredSessions = allSessions.filter((s: any) => s.document_id === id && !s.is_archived);
        setDocSessions(filteredSessions);
        
        if (filteredSessions.length > 0) {
          setSessionId(filteredSessions[0].id);
          const msgs = await fetchAPI(`/assistant/sessions/${filteredSessions[0].id}/messages`);
          setChatMessages(msgs);
        }
      } catch (err) {
        toast.error("Failed to load document workspace.");
        navigate('/dashboard/drive');
      } finally {
        setLoading(false);
      }
    };
    if (id) loadWorkspace();
  }, [id, navigate]);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isGenerating]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '44px'; 
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [chatInput]);

  const handleDelete = async () => {
    if (!window.confirm("Move document to trash?")) return;
    try {
      await fetchAPI(`/drive/files/${id}`, { method: 'DELETE' });
      toast.success("Document moved to trash.");
      navigate('/dashboard/drive');
    } catch (err) {
      toast.error("Failed to delete document.");
    }
  };

  // --- 3. SESSION MANAGEMENT ---
  const createNewSession = async () => {
    if (!doc) return;
    try {
      const newSession = await fetchAPI('/assistant/sessions', {
        method: 'POST', 
        body: JSON.stringify({ 
          title: `New Conversation`, 
          document_id: doc.id 
        })
      });
      setDocSessions(prev => [newSession, ...prev]);
      setSessionId(newSession.id);
      setChatMessages([]);
      setChatInput('');
    } catch (err) {
      toast.error("Failed to start a new conversation.");
    }
  };

  const switchSession = async (targetSessionId: string) => {
    if (targetSessionId === sessionId) return;
    setSessionId(targetSessionId);
    setChatMessages([]); 
    try {
      const msgs = await fetchAPI(`/assistant/sessions/${targetSessionId}/messages`);
      setChatMessages(msgs);
    } catch (err) {
      toast.error("Failed to load session history.");
    }
  };

  // --- 4. SEND MESSAGE ---
  const handleSendMessage = async () => {
    if (!chatInput.trim() || isGenerating) return;
    
    const textToSend = chatInput;
    setChatInput('');
    setIsGenerating(true);

    let targetSessionId = sessionId;
    const isFirstMessage = chatMessages.length === 0;
    
    try {
      if (!targetSessionId) {
        const newSession = await fetchAPI('/assistant/sessions', {
          method: 'POST', 
          body: JSON.stringify({ 
            title: `New Conversation`, 
            document_id: doc.id 
          })
        });
        targetSessionId = newSession.id;
        setSessionId(targetSessionId);
        setDocSessions(prev => [newSession, ...prev]);
      }

      const tempId = `temp-${Date.now()}`;
      setChatMessages(prev => [...prev, { id: tempId, role: 'user', content: textToSend }]);

      await fetchAPI('/assistant/chat', {
        method: 'POST',
        body: JSON.stringify({
          content: textToSend, 
          session_id: targetSessionId,
          document_id: doc.id,
          use_web_search: false,
          use_deep_think: false
        })
      });
      
      const updatedMessages = await fetchAPI(`/assistant/sessions/${targetSessionId}/messages`);
      setChatMessages(updatedMessages);

      if (isFirstMessage) {
        const aiResponse = updatedMessages.find((m: any) => m.role === 'assistant');
        if (aiResponse) {
          let cleanText = aiResponse.content.replace(/[*#_`~]/g, '').replace(/\n/g, ' ').trim();
          let generatedTitle = cleanText.substring(0, 35);
          if (cleanText.length > 35) generatedTitle += "...";
          
          await fetchAPI(`/assistant/sessions/${targetSessionId}/rename`, { 
              method: 'PATCH', body: JSON.stringify({ title: generatedTitle }) 
          });
          
          const updatedSessions = await fetchAPI('/assistant/sessions');
          setDocSessions(updatedSessions.filter((s: any) => s.document_id === doc.id && !s.is_archived));
        }
      }

    } catch (err: any) {
      toast.error("Failed to generate AI response.");
      setChatMessages(prev => prev.filter(m => !m.id.toString().startsWith('temp-')));
    } finally {
      setIsGenerating(false);
    }
  };

  // --- REUSABLE CHAT WORKSPACE (BULLETPROOF RESPONSIVE) ---
  const renderChatWorkspace = () => (
    <div className="flex flex-col flex-1 h-full bg-white dark:bg-[#050505] overflow-hidden min-w-0 min-h-0 w-full">
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6 sleek-scrollbar min-h-0 min-w-0 w-full">
        {chatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
            <div className="h-12 w-12 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center mb-4">
              <Sparkles className="h-6 w-6 text-black dark:text-white" />
            </div>
            <p className="text-sm font-semibold text-black dark:text-white">Docmosiss Intelligence</p>
            <p className="text-xs text-neutral-500 max-w-[220px] mt-1.5 leading-relaxed">
              Ask any question. The AI will strictly reference the contents of this document.
            </p>
          </div>
        ) : (
          <div className="w-full space-y-6 min-w-0">
            {chatMessages.map((msg, idx) => (
              <div key={msg.id || idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300 min-w-0 w-full`}>
                {msg.role === 'assistant' && (
                  <div className="h-7 w-7 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="h-3.5 w-3.5 text-black dark:text-white" />
                  </div>
                )}
                <div className={`max-w-[92%] sm:max-w-[88%] flex flex-col gap-1 min-w-0 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`px-4 py-3 text-[14px] leading-relaxed overflow-hidden break-words w-full ${
                    msg.role === 'user' 
                      ? 'bg-black text-white dark:bg-white dark:text-black rounded-2xl rounded-tr-sm font-medium whitespace-pre-wrap shadow-sm' 
                      : 'bg-transparent text-neutral-900 dark:text-neutral-100'
                  }`}>
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none break-words w-full overflow-hidden">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            h1: ({node, ...props}) => <h1 className="text-lg font-bold mt-4 mb-2 text-black dark:text-white tracking-tight border-b border-neutral-200 dark:border-neutral-800 pb-1" {...props} />,
                            h2: ({node, ...props}) => <h2 className="text-md font-semibold mt-3 mb-2 text-black dark:text-white tracking-tight" {...props} />,
                            h3: ({node, ...props}) => <h3 className="text-[15px] font-medium mt-3 mb-1 text-neutral-800 dark:text-neutral-200" {...props} />,
                            p: ({node, ...props}) => <p className="leading-relaxed mb-3 last:mb-0" {...props} />,
                            strong: ({node, ...props}) => <strong className="font-semibold text-black dark:text-white" {...props} />,
                            a: ({node, ...props}) => <a className="text-purple-600 dark:text-purple-400 font-medium hover:underline underline-offset-2 break-all" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc list-outside ml-4 space-y-1 mb-3 text-neutral-700 dark:text-neutral-300 marker:text-neutral-400" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal list-outside ml-4 space-y-1 mb-3 text-neutral-700 dark:text-neutral-300 marker:text-neutral-400 font-medium" {...props} />,
                            li: ({node, ...props}) => <li className="pl-1" {...props} />,
                            blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-neutral-300 dark:border-neutral-700 pl-3 py-0.5 italic text-neutral-500 dark:text-neutral-400 my-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-r-lg" {...props} />,
                            pre: ({node, ...props}) => (
                              <div className="w-full max-w-full overflow-x-auto my-3 rounded-xl border border-neutral-800 shadow-sm sleek-scrollbar bg-neutral-900 dark:bg-[#111]">
                                <pre className="p-3 text-neutral-100 text-[12px] sm:text-[13px] bg-transparent m-0 w-max min-w-full" {...props} />
                              </div>
                            ),
                            code: ({node, inline, ...props}: any) => 
                              inline 
                                ? <code className="bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white px-1.5 py-0.5 rounded-md text-[12px] sm:text-[13px] font-mono border border-neutral-200 dark:border-neutral-700 break-words" {...props} /> 
                                : <code className="text-[12px] sm:text-[13px] font-mono leading-relaxed" {...props} />,
                            table: ({node, ...props}) => (
                              <div className="w-full max-w-full overflow-x-auto my-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm bg-white dark:bg-[#0A0A0A]">
                                <table className="w-full text-sm text-left border-collapse min-w-max" {...props} />
                              </div>
                            ),
                            thead: ({node, ...props}) => <thead className="text-xs uppercase bg-neutral-50 dark:bg-[#111] text-neutral-500 dark:text-neutral-400 font-semibold tracking-wider border-b border-neutral-200 dark:border-neutral-800" {...props} />,
                            th: ({node, ...props}) => <th className="px-4 py-3 font-semibold whitespace-nowrap" {...props} />,
                            td: ({node, ...props}) => <td className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 text-neutral-700 dark:text-neutral-300" {...props} />,
                            tr: ({node, ...props}) => <tr className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/50 transition-colors" {...props} />,
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {isGenerating && (
          <div className="flex gap-3 animate-in fade-in duration-300 min-w-0 w-full">
            <div className="h-7 w-7 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="h-3.5 w-3.5 text-black dark:text-white animate-pulse" />
            </div>
            <div className="px-4 py-2.5 text-[14px] text-neutral-500 font-medium flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Scanning vectors...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-2" />
      </div>

      <div className="shrink-0 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] lg:pb-4 border-t border-neutral-200 dark:border-neutral-800/60 bg-white dark:bg-[#050505] min-w-0 w-full z-10">
        <div className="relative flex items-end bg-neutral-50 dark:bg-[#111] border border-neutral-200 dark:border-neutral-800 rounded-2xl focus-within:border-neutral-400 dark:focus-within:border-neutral-600 focus-within:ring-1 focus-within:ring-neutral-400 dark:focus-within:ring-neutral-600 transition-all overflow-hidden p-1.5 shadow-sm">
          <textarea
            ref={textareaRef}
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => { 
              if (e.key === 'Enter' && !e.shiftKey) { 
                e.preventDefault(); 
                handleSendMessage(); 
              } 
            }}
            placeholder="Ask about this document..."
            className="flex-1 bg-transparent border-0 focus:ring-0 outline-none px-3 py-2 text-[14px] text-black dark:text-white placeholder:text-neutral-500 resize-none sleek-scrollbar"
            rows={1}
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={!chatInput.trim() || isGenerating}
            size="icon"
            className={`h-8 w-8 shrink-0 mb-0.5 mr-0.5 rounded-xl transition-all ${
              chatInput.trim() && !isGenerating 
                ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600'
            }`}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );


  if (loading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-white dark:bg-black z-50">
        <Loader2 className="h-8 w-8 animate-spin text-black dark:text-white" />
        <p className="mt-4 text-neutral-500 font-medium">Loading workspace...</p>
      </div>
    );
  }

  if (!doc) return null;

  return (
    <>
      <style>{`
        .sleek-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .sleek-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .sleek-scrollbar::-webkit-scrollbar-thumb { background: rgba(156, 163, 175, 0.4); border-radius: 10px; }
        .sleek-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(156, 163, 175, 0.7); }
        .dark .sleek-scrollbar::-webkit-scrollbar-thumb { background: rgba(82, 82, 91, 0.4); }
        .dark .sleek-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(82, 82, 91, 0.7); }
      `}</style>

      <div className="fixed inset-0 flex flex-col w-full bg-neutral-50 dark:bg-black overflow-hidden overscroll-none font-sans z-50">
        
        {isResizing && <div className="absolute inset-0 z-50 cursor-col-resize bg-transparent" />}

        {/* --- HEADER --- */}
        <div className="shrink-0 h-14 px-3 sm:px-6 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0A] flex items-center justify-between z-20">
          <div className="flex items-center gap-3 overflow-hidden min-w-0">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/drive')} className="shrink-0 h-8 w-8 text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-800 hidden sm:block shrink-0"></div>
            <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
              <div className="p-1.5 rounded bg-neutral-100 dark:bg-neutral-900 text-neutral-500 shrink-0">
                <FileText className="h-4 w-4" />
              </div>
              <h1 className="text-[14px] sm:text-[15px] font-semibold tracking-tight text-black dark:text-white truncate max-w-[160px] sm:max-w-md" title={doc.original_name}>
                {doc.original_name}
              </h1>
              <Badge variant="secondary" className="hidden sm:inline-flex shrink-0 bg-neutral-100 text-neutral-600 dark:bg-neutral-900 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800 uppercase tracking-wider text-[10px] font-bold">
                {doc.extension}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 shrink-0">
            <Button variant="outline" size="sm" className="hidden sm:flex h-8 text-xs font-medium border-neutral-200 dark:border-neutral-800 dark:bg-black" onClick={() => window.open(doc.secure_url, '_blank')}>
              <Download className="h-3.5 w-3.5 mr-1.5" /> Download
            </Button>
            <Button variant="ghost" size="icon" onClick={handleDelete} className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* --- CONTENT SPLIT --- */}
        <div className="flex-1 flex w-full min-h-0 min-w-0 overflow-hidden relative">
          
          {/* LEFT: THE VIEWER */}
          <div className={`flex-1 bg-neutral-100 dark:bg-[#020202] relative min-w-0 h-full ${isFullscreen ? 'hidden' : 'block'}`}>
            {['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(doc.extension.toLowerCase()) ? (
              <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-8 overflow-auto">
                <img src={doc.secure_url} alt={doc.original_name} className="max-w-full max-h-full object-contain shadow-md border border-neutral-200 dark:border-neutral-800 rounded-lg bg-white dark:bg-black" />
              </div>
            ) : (
              <div className="absolute inset-0 w-full h-full overflow-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
                <iframe 
                  src={doc.secure_url} 
                  className="w-full h-full block border-none"
                  style={{ minWidth: '100%', minHeight: '100%' }}
                  title={doc.original_name}
                />
              </div>
            )}
          </div>

          {/* RIGHT: DESKTOP RESIZABLE SIDEBAR */}
          <div 
            style={{ width: isFullscreen ? '100%' : `${sidebarWidth}px` }}
            className="shrink-0 border-l border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#050505] flex-col hidden lg:flex shadow-[-4px_0_24px_rgba(0,0,0,0.02)] z-10 h-full overflow-hidden relative transition-[width] duration-75 min-w-0"
          >
            {/* DRAG HANDLE */}
            {!isFullscreen && (
              <div 
                onMouseDown={startResizing}
                onTouchStart={startResizing}
                className="absolute left-0 top-0 bottom-0 w-3 -ml-1.5 cursor-col-resize z-50 flex items-center justify-center group"
              >
                <div className="w-1 h-12 rounded-full bg-neutral-300 dark:bg-neutral-700 opacity-0 group-hover:opacity-100 group-active:bg-purple-500 transition-all" />
              </div>
            )}

            {/* Sidebar Header */}
            <div className="shrink-0 p-5 border-b border-neutral-200 dark:border-neutral-800/60 bg-white dark:bg-[#0A0A0A]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-black dark:text-white text-[13px] uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-neutral-500" /> Intelligence
                </h3>
                <div className="flex items-center gap-1">
                  
                  {/* DROPDOWN FOR CHAT HISTORY */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" title="Chat History" className="h-7 w-7 text-neutral-500 hover:text-black dark:hover:text-white bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-900 dark:hover:bg-neutral-800 transition-colors">
                        <History className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 dark:bg-[#111] border-neutral-200 dark:border-neutral-800 rounded-xl">
                      <div className="px-2 py-1.5 text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
                        Past Conversations
                      </div>
                      {docSessions.length === 0 ? (
                        <div className="p-3 text-xs text-neutral-500 text-center italic">No history found.</div>
                      ) : (
                        docSessions.map(s => (
                          <DropdownMenuItem 
                            key={s.id} 
                            onClick={() => switchSession(s.id)}
                            className={`cursor-pointer rounded-lg mx-1 my-0.5 ${sessionId === s.id ? 'bg-neutral-100 dark:bg-neutral-800 font-medium' : 'text-neutral-600 dark:text-neutral-400'}`}
                          >
                            <MessageSquare className="h-3.5 w-3.5 mr-2 opacity-70" />
                            <span className="truncate">{s.title}</span>
                          </DropdownMenuItem>
                        ))
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* NEW CHAT BUTTON */}
                  <Button variant="ghost" size="icon" onClick={createNewSession} title="New Chat" className="h-7 w-7 text-neutral-500 hover:text-black dark:hover:text-white bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-900 dark:hover:bg-neutral-800 transition-colors">
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                  
                  {/* FULLSCREEN BUTTON */}
                  <Button variant="ghost" size="icon" onClick={() => setIsFullscreen(!isFullscreen)} title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Chat"} className="h-7 w-7 text-neutral-500 hover:text-black dark:hover:text-white bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-900 dark:hover:bg-neutral-800 transition-colors">
                    {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-[13px]">
                <div className="flex flex-col gap-1">
                  <span className="text-neutral-400 font-medium">Size</span>
                  <span className="text-black dark:text-neutral-200 font-mono tracking-tight">{formatBytes(doc.file_size)}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-neutral-400 font-medium">Indexed</span>
                  <span className="text-black dark:text-neutral-200 font-mono tracking-tight">{formatDate(doc.created_at)}</span>
                </div>
              </div>
            </div>
            
            {/* Chat Area */}
            <div className="flex-1 overflow-hidden min-w-0 min-h-0 w-full flex flex-col">
              {renderChatWorkspace()}
            </div>
          </div>

          {/* MOBILE FLOATING ACTION BUTTON */}
          {/* FIX: Moved FAB to top right corner, perfectly clearing the header and bottom URL bars */}
          <div className="lg:hidden absolute top-20 right-4 z-30">
            <Sheet open={isMobileChatOpen} onOpenChange={setIsMobileChatOpen}>
              <SheetTrigger asChild>
                <Button className="h-14 pl-5 pr-6 rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow-[0_8px_30px_rgb(147,51,234,0.4)] hover:scale-105 transition-transform flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  <span className="font-semibold text-base">Ask AI</span>
                </Button>
              </SheetTrigger>
              <SheetContent 
                side="bottom" 
                className={`${isMobileFullscreen ? 'h-[100dvh] max-h-[100dvh] rounded-none' : 'h-[85dvh] max-h-[85dvh] rounded-t-2xl'} p-0 flex flex-col bg-white dark:bg-[#050505] border-t border-neutral-200 dark:border-neutral-800 outline-none transition-all duration-300 w-full !max-w-full [&>button]:hidden min-w-0 min-h-0`}
              >
                <SheetHeader className="p-4 border-b border-neutral-200 dark:border-neutral-800 text-left shrink-0 flex flex-row items-center justify-between min-w-0">
                  <SheetTitle className="text-black dark:text-white flex items-center gap-2 text-[15px] m-0 min-w-0">
                    <Sparkles className="h-4 w-4 text-purple-600 shrink-0" /> 
                    <span className="truncate">Docmosiss</span>
                  </SheetTitle>
                  <div className="flex items-center gap-1 shrink-0">
                    
                    {/* MOBILE HISTORY DROPDOWN */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-neutral-500">
                          <History className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 dark:bg-[#111] border-neutral-200 dark:border-neutral-800 rounded-xl z-[100]">
                        <div className="px-2 py-1.5 text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">Past Conversations</div>
                        {docSessions.length === 0 ? (
                          <div className="p-3 text-xs text-neutral-500 text-center italic">No history found.</div>
                        ) : (
                          docSessions.map(s => (
                            <DropdownMenuItem 
                              key={s.id} 
                              onClick={() => switchSession(s.id)}
                              className={`cursor-pointer rounded-lg mx-1 my-0.5 ${sessionId === s.id ? 'bg-neutral-100 dark:bg-neutral-800 font-medium' : 'text-neutral-600 dark:text-neutral-400'}`}
                            >
                              <MessageSquare className="h-3.5 w-3.5 mr-2 opacity-70" />
                              <span className="truncate">{s.title}</span>
                            </DropdownMenuItem>
                          ))
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-neutral-500" onClick={createNewSession}>
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-neutral-500" onClick={() => setIsMobileFullscreen(!isMobileFullscreen)}>
                      {isMobileFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-neutral-500" onClick={() => setIsMobileChatOpen(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </SheetHeader>
                <div className="flex-1 overflow-hidden min-w-0 min-h-0 w-full flex flex-col">
                  {renderChatWorkspace()}
                </div>
              </SheetContent>
            </Sheet>
          </div>

        </div>
      </div>
    </>
  );
}