import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Send, Globe, BrainCircuit, MoreVertical, 
  Trash2, Archive, ArchiveRestore, Edit2, Copy, ThumbsUp, ThumbsDown, 
  Plus, MessageSquare, Share2, Loader2, Check, ArrowLeft, History, Sparkles
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { fetchAPI } from '@/lib/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function Assistant() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // --- STATE ---
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Feature Toggles
  const [useWebSearch, setUseWebSearch] = useState(false);
  const [useDeepThink, setUseDeepThink] = useState(false);
  
  // Mobile Sheet State
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // --- DERIVED STATE ---
  const activeSessions = sessions.filter(s => !s.is_archived);
  const archivedSessions = sessions.filter(s => s.is_archived);

  // --- INITIALIZATION ---
  useEffect(() => {
    loadSessions();
    if (searchParams.get('share_id')) handleSharedSession(searchParams.get('share_id')!);
  }, []);

  useEffect(() => {
    if (activeSessionId) loadMessages(activeSessionId);
  }, [activeSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '50px'; 
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  // --- API HANDLERS ---
  const loadSessions = async () => {
    try {
      const data = await fetchAPI('/assistant/sessions');
      setSessions(data);
      if (data.length > 0 && !activeSessionId && !searchParams.get('share_id')) {
        const firstActive = data.find(s => !s.is_archived);
        if (firstActive) setActiveSessionId(firstActive.id);
      }
    } catch (err) {
      console.error("Failed to load sessions", err);
    }
  };

  const loadMessages = async (sessionId: string) => {
    try {
      const data = await fetchAPI(`/assistant/sessions/${sessionId}/messages`);
      setMessages(data);
    } catch (err) { console.error("Failed to load messages", err); }
  };

  const handleSharedSession = async (sharedId: string) => {
    try {
      const newSession = await fetchAPI('/assistant/sessions', { 
        method: 'POST', body: JSON.stringify({ title: "Imported Session" }) 
      });
      setActiveSessionId(newSession.id);
      navigate('/dashboard/assistant', { replace: true });
      loadSessions();
    } catch (err) { console.error("Failed to load shared session", err); }
  };

  const createNewSession = async () => {
    try {
      const session = await fetchAPI('/assistant/sessions', {
        method: 'POST', body: JSON.stringify({ title: "New Conversation" })
      });
      setSessions([session, ...sessions]);
      setActiveSessionId(session.id);
      setMessages([]);
      setInput('');
      setIsHistoryOpen(false); 
    } catch (err) { console.error("Failed to create session", err); }
  };

  // --- MESSAGE ACTIONS ---
  const handleSend = async (contentOverride?: string) => {
    const textToSend = contentOverride || input;
    if (!textToSend.trim()) return;

    const isFirstMessage = messages.length === 0;
    let targetSessionId = activeSessionId;
    
    // Create session if none exists
    if (!targetSessionId) {
      try {
        const newSession = await fetchAPI('/assistant/sessions', {
          method: 'POST', body: JSON.stringify({ title: "New Conversation" })
        });
        setSessions(prev => [newSession, ...prev]);
        setActiveSessionId(newSession.id);
        targetSessionId = newSession.id;
      } catch (err) { return console.error("Failed to start session", err); }
    }

    const tempId = `temp-${Date.now()}`;
    setMessages(prev => [...prev, { id: tempId, role: 'user', content: textToSend }]);
    setInput('');
    setIsGenerating(true);

    try {
      // 1. Send the message
      await fetchAPI('/assistant/chat', {
        method: 'POST',
        body: JSON.stringify({
          content: textToSend, session_id: targetSessionId,
          use_web_search: useWebSearch, use_deep_think: useDeepThink, document_id: null 
        })
      });
      
      // 2. Fetch the updated messages to get the AI response
      const updatedMessages = await fetchAPI(`/assistant/sessions/${targetSessionId}/messages`);
      setMessages(updatedMessages);
      
      // 3. Auto-Rename Session based on AI's first response
      if (isFirstMessage) {
          const aiResponse = updatedMessages.find((m: any) => m.role === 'assistant');
          if (aiResponse) {
              // Clean Markdown characters and grab the first ~35 characters
              let cleanText = aiResponse.content.replace(/[*#_`~]/g, '').replace(/\n/g, ' ').trim();
              let generatedTitle = cleanText.substring(0, 35);
              if (cleanText.length > 35) generatedTitle += "...";
              
              await fetchAPI(`/assistant/sessions/${targetSessionId}/rename`, { 
                  method: 'PATCH', 
                  body: JSON.stringify({ title: generatedTitle }) 
              });
              loadSessions(); // Refresh sidebar to show new title
          }
      }

    } catch (err: any) {
      console.error(err.message || "Failed to generate response");
      setMessages(prev => prev.filter(m => m.id !== tempId)); 
    } finally { setIsGenerating(false); }
  };

  const handleRegenerate = async (messageId: string, oldContent: string) => {
    setEditingMessageId(messageId);
    setEditInput(oldContent);
  };

  const confirmRegenerate = async () => {
    if (!editingMessageId || !activeSessionId) return;
    setEditingMessageId(null);
    handleSend(editInput);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFeedback = async (messageId: string, value: number) => {
    try {
      await fetchAPI(`/assistant/messages/${messageId}/feedback`, { method: 'PATCH', body: JSON.stringify({ feedback: value }) });
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, feedback: value } : m));
    } catch (err) { console.error("Failed to record feedback", err); }
  };

  // --- SESSION MANAGEMENT ---
  const renameSession = async (id: string, currentTitle: string) => {
    const newTitle = window.prompt("Rename session:", currentTitle);
    if (!newTitle || newTitle === currentTitle) return;
    try {
      await fetchAPI(`/assistant/sessions/${id}/rename`, { method: 'PATCH', body: JSON.stringify({ title: newTitle }) });
      loadSessions();
    } catch (err) { console.error("Failed to rename", err); }
  };

  const archiveSession = async (id: string) => {
    try {
      await fetchAPI(`/assistant/sessions/${id}/archive`, { method: 'PATCH' });
      if (activeSessionId === id) setActiveSessionId(null);
      loadSessions();
    } catch (err) { console.error("Failed to archive", err); }
  };

  const unarchiveSession = async (id: string) => {
    try {
      await fetchAPI(`/assistant/sessions/${id}/unarchive`, { method: 'PATCH' });
      loadSessions();
    } catch (err) { console.error("Failed to restore", err); }
  };

  // REMOVED WINDOW.CONFIRM FROM DELETE SESSION
  const deleteSession = async (id: string) => {
    try {
      await fetchAPI(`/assistant/sessions/${id}`, { method: 'DELETE' });
      if (activeSessionId === id) setActiveSessionId(null);
      loadSessions();
    } catch (err) { console.error("Failed to delete", err); }
  };

  const shareSession = (id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/dashboard/assistant?share_id=${id}`);
  };

  // --- SHARED HISTORY LIST COMPONENT ---
  const HistoryList = () => (
    <div className="flex-1 overflow-y-auto mt-4 pr-2 custom-scrollbar space-y-6 pb-20">
      {/* ARCHIVED SESSIONS */}
      {archivedSessions.length > 0 && (
        <div>
          <h3 className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-3 px-2">Archived</h3>
          <div className="space-y-1 opacity-70 hover:opacity-100 transition-opacity">
            {archivedSessions.map(session => (
              <div key={session.id} onClick={() => { setActiveSessionId(session.id); setIsHistoryOpen(false); }} className={`group flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors ${activeSessionId === session.id ? 'bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white' : 'hover:bg-neutral-50 dark:hover:bg-neutral-900 text-neutral-500'}`}>
                <div className="flex items-center gap-2.5 overflow-hidden w-full">
                  <Archive className="h-4 w-4 shrink-0 opacity-40" />
                  <span className="truncate text-[13px] font-medium">{session.title}</span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0 text-neutral-400"><MoreVertical className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40 rounded-xl dark:bg-[#111] border-neutral-200 dark:border-neutral-800">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); unarchiveSession(session.id); }} className="cursor-pointer dark:hover:bg-neutral-800"><ArchiveRestore className="h-4 w-4 mr-2" /> Restore</DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-neutral-200 dark:bg-neutral-800" />
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }} className="text-red-600 cursor-pointer focus:bg-red-50 dark:focus:bg-red-950/50"><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ACTIVE SESSIONS */}
      <div>
        <h3 className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-3 px-2">Conversations</h3>
        {activeSessions.length === 0 ? (
          <p className="text-sm text-neutral-400 px-2 italic">No active sessions.</p>
        ) : (
          <div className="space-y-1">
            {activeSessions.map(session => (
              <div key={session.id} onClick={() => { setActiveSessionId(session.id); setIsHistoryOpen(false); }} className={`group flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors ${activeSessionId === session.id ? 'bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white font-medium' : 'hover:bg-neutral-50 dark:hover:bg-neutral-900/50 text-neutral-600 dark:text-neutral-400'}`}>
                <div className="flex items-center gap-2.5 overflow-hidden w-full">
                  <MessageSquare className="h-4 w-4 shrink-0 opacity-50" />
                  <span className="truncate text-[13px]">{session.title}</span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0 text-neutral-400 hover:text-black dark:hover:text-white"><MoreVertical className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40 rounded-xl dark:bg-[#111] border-neutral-200 dark:border-neutral-800">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); renameSession(session.id, session.title); }} className="cursor-pointer dark:hover:bg-neutral-800"><Edit2 className="h-4 w-4 mr-2" /> Rename</DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); shareSession(session.id); }} className="cursor-pointer dark:hover:bg-neutral-800"><Share2 className="h-4 w-4 mr-2" /> Share</DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); archiveSession(session.id); }} className="cursor-pointer dark:hover:bg-neutral-800"><Archive className="h-4 w-4 mr-2" /> Archive</DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-neutral-200 dark:bg-neutral-800" />
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }} className="text-red-600 cursor-pointer focus:bg-red-50 dark:focus:bg-red-950/50"><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 h-[100dvh] z-50 flex flex-col bg-white dark:bg-[#0A0A0A] overflow-hidden font-sans text-neutral-900 dark:text-neutral-100">
      
      {/* --- TOP HEADER --- */}
      <header className="h-14 shrink-0 bg-white dark:bg-[#0A0A0A] border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-3 sm:px-6 z-30">
        <div className="flex items-center gap-2 sm:gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white px-2 sm:px-3 transition-colors">
            <ArrowLeft className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Dashboard</span>
          </Button>
          <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-800 hidden sm:block"></div>
          <span className="font-semibold text-sm text-black dark:text-white hidden sm:inline-block tracking-wide">Docmosiss Intelligence</span>
        </div>
        
        {/* Mobile History Toggle */}
        <div className="flex items-center gap-2">
          <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="flex sm:hidden border-neutral-200 dark:border-neutral-800 text-black dark:text-white dark:bg-[#0A0A0A]">
                <History className="h-4 w-4 mr-2" /> History
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[80%] sm:w-80 p-4 flex flex-col bg-white dark:bg-[#0A0A0A] border-r border-neutral-200 dark:border-neutral-800">
              <SheetHeader className="text-left mb-4">
                <SheetTitle className="text-black dark:text-white">Chat History</SheetTitle>
              </SheetHeader>
              <Button onClick={createNewSession} className="w-full bg-black hover:bg-neutral-800 text-white dark:bg-white dark:text-black dark:hover:bg-neutral-200 transition-all font-medium">
                <Plus className="h-4 w-4 mr-2" /> Start New Chat
              </Button>
              <HistoryList />
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* --- MAIN LAYOUT --- */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* DESKTOP SIDEBAR */}
        <div className="w-64 shrink-0 flex-col hidden sm:flex border-r border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-[#0A0A0A] p-4">
          <Button onClick={createNewSession} className="w-full bg-black hover:bg-neutral-800 text-white dark:bg-white dark:text-black dark:hover:bg-neutral-200 h-11 rounded-xl font-medium justify-center transition-all duration-300">
            <Plus className="h-5 w-5 mr-2" /> Start New Chat
          </Button>
          <HistoryList />
        </div>

        {/* CHAT WORKSPACE */}
        <div className="flex-1 flex flex-col h-full relative bg-transparent">
          
          <div className="flex-1 overflow-y-auto pb-[calc(10rem+env(safe-area-inset-bottom))] sm:pb-40 custom-scrollbar relative">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 sm:p-8 relative z-10 animate-in fade-in duration-700">
                <div className="h-16 w-16 bg-neutral-100 dark:bg-neutral-900 rounded-2xl flex items-center justify-center mb-6 border border-neutral-200 dark:border-neutral-800">
                   <BrainCircuit className="h-8 w-8 text-black dark:text-white" />
                </div>
                <h2 className="text-3xl font-display font-bold text-black dark:text-white mb-3 tracking-tight">
                  Global Workspace Intelligence
                </h2>
                <p className="max-w-md text-base text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  I am connected to all your documents. Ask complex questions, activate live web search, or engage deep reasoning across your entire vector database.
                </p>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto w-full py-8 px-4 sm:px-6 space-y-8 relative z-10">
                {messages.map((msg, idx) => (
                  <div key={msg.id || idx} className={`flex gap-3 sm:gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group animate-in slide-in-from-bottom-2 duration-300`}>
                    
                    {msg.role === 'assistant' && (
                      <div className="h-8 w-8 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                        <Sparkles className="h-4 w-4 text-black dark:text-white" />
                      </div>
                    )}

                    <div className={`max-w-[95%] md:max-w-[95%] lg:max-w-[90%] flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      
                      {editingMessageId === msg.id && msg.role === 'user' ? (
                        <div className="w-full min-w-[280px] sm:min-w-[400px] bg-white dark:bg-[#111] p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-lg space-y-3">
                          <textarea 
                            value={editInput} 
                            onChange={(e) => setEditInput(e.target.value)}
                            className="w-full bg-transparent border-0 focus:ring-0 resize-none outline-none text-black dark:text-white text-[15px]" 
                            rows={3}
                            autoFocus
                          />
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setEditingMessageId(null)} className="text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800">Cancel</Button>
                            <Button size="sm" className="bg-black text-white dark:bg-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 shadow-sm" onClick={confirmRegenerate}>Save & Submit</Button>
                          </div>
                        </div>
                      ) : (
                        <div className={`px-5 py-3.5 text-[15px] leading-relaxed overflow-hidden ${
                          msg.role === 'user' 
                            ? 'bg-black text-white dark:bg-white dark:text-black rounded-3xl rounded-tr-sm shadow-sm font-medium whitespace-pre-wrap' 
                            : 'bg-transparent text-neutral-900 dark:text-neutral-100 w-full'
                        }`}>
                          {msg.role === 'assistant' ? (
                            <div className="prose prose-neutral dark:prose-invert max-w-none">
                              <ReactMarkdown 
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  h1: ({node, ...props}) => <h1 className="text-2xl font-bold mt-6 mb-4 text-black dark:text-white tracking-tight border-b border-neutral-200 dark:border-neutral-800 pb-2" {...props} />,
                                  h2: ({node, ...props}) => <h2 className="text-xl font-semibold mt-5 mb-3 text-black dark:text-white tracking-tight" {...props} />,
                                  h3: ({node, ...props}) => <h3 className="text-lg font-medium mt-4 mb-2 text-neutral-800 dark:text-neutral-200" {...props} />,
                                  p: ({node, ...props}) => <p className="leading-relaxed mb-4 last:mb-0" {...props} />,
                                  strong: ({node, ...props}) => <strong className="font-semibold text-black dark:text-white" {...props} />,
                                  a: ({node, ...props}) => <a className="text-blue-600 dark:text-blue-400 font-medium hover:underline underline-offset-2" {...props} />,
                                  ul: ({node, ...props}) => <ul className="list-disc list-outside ml-5 space-y-1.5 mb-4 text-neutral-700 dark:text-neutral-300 marker:text-neutral-400" {...props} />,
                                  ol: ({node, ...props}) => <ol className="list-decimal list-outside ml-5 space-y-1.5 mb-4 text-neutral-700 dark:text-neutral-300 marker:text-neutral-400 font-medium" {...props} />,
                                  li: ({node, ...props}) => <li className="pl-1" {...props} />,
                                  blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-neutral-300 dark:border-neutral-700 pl-4 py-1 italic text-neutral-500 dark:text-neutral-400 my-5 bg-neutral-50 dark:bg-neutral-900/50 rounded-r-lg" {...props} />,
                                  pre: ({node, ...props}) => <pre className="p-4 rounded-xl bg-neutral-900 dark:bg-[#111] text-neutral-100 border border-neutral-800 overflow-x-auto my-5 shadow-sm custom-scrollbar" {...props} />,
                                  code: ({node, inline, ...props}: any) => 
                                    inline 
                                      ? <code className="bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white px-1.5 py-0.5 rounded-md text-[13px] font-mono border border-neutral-200 dark:border-neutral-700" {...props} /> 
                                      : <code className="text-[13px] font-mono leading-relaxed" {...props} />,
                                  table: ({node, ...props}) => (
                                    <div className="w-full overflow-x-auto my-6 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm bg-white dark:bg-[#0A0A0A]">
                                      <table className="w-full text-sm text-left border-collapse" {...props} />
                                    </div>
                                  ),
                                  thead: ({node, ...props}) => <thead className="text-xs uppercase bg-neutral-50 dark:bg-[#111] text-neutral-500 dark:text-neutral-400 font-semibold tracking-wider border-b border-neutral-200 dark:border-neutral-800" {...props} />,
                                  th: ({node, ...props}) => <th className="px-5 py-4 font-semibold whitespace-nowrap" {...props} />,
                                  td: ({node, ...props}) => <td className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 text-neutral-700 dark:text-neutral-300" {...props} />,
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
                      )}

                      {!editingMessageId && (
                        <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all ${msg.role === 'user' ? 'mr-1' : 'ml-1'}`}>
                          {msg.role === 'user' ? (
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-neutral-400 hover:text-black dark:hover:text-white" onClick={() => handleRegenerate(msg.id, msg.content)}>
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                          ) : (
                            <>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-neutral-400 hover:text-black dark:hover:text-white" onClick={() => copyToClipboard(msg.content, msg.id)}>
                                {copiedId === msg.id ? <Check className="h-3.5 w-3.5 text-black dark:text-white" /> : <Copy className="h-3.5 w-3.5" />}
                              </Button>
                              <Button variant="ghost" size="icon" className={`h-7 w-7 ${msg.feedback === 1 ? 'text-black dark:text-white bg-neutral-100 dark:bg-neutral-800' : 'text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-900'}`} onClick={() => handleFeedback(msg.id, 1)}>
                                <ThumbsUp className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className={`h-7 w-7 ${msg.feedback === -1 ? 'text-black dark:text-white bg-neutral-100 dark:bg-neutral-800' : 'text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-900'}`} onClick={() => handleFeedback(msg.id, -1)}>
                                <ThumbsDown className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {isGenerating && (
                  <div className="flex gap-3 sm:gap-4 animate-in fade-in duration-300">
                    <div className="h-8 w-8 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="h-4 w-4 text-black dark:text-white animate-pulse" />
                    </div>
                    <div className="px-4 py-2 text-[15px] text-neutral-600 dark:text-neutral-400 font-medium flex items-center gap-3">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {useDeepThink ? 'Engaging deep reasoning...' : useWebSearch ? 'Searching web sources...' : 'Analyzing vectors...'}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} className="h-2" />
              </div>
            )}
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:p-6 sm:pb-8 bg-gradient-to-t from-white via-white/90 to-transparent dark:from-[#0A0A0A] dark:via-[#0A0A0A]/90 dark:to-transparent pointer-events-none z-20">
            <div className="max-w-3xl mx-auto pointer-events-auto">
              <div className="relative bg-white dark:bg-[#111] border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-lg dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] focus-within:ring-1 focus-within:ring-black dark:focus-within:ring-neutral-600 transition-all duration-300 flex flex-col overflow-hidden group">
                
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { 
                    if (e.key === 'Enter' && !e.shiftKey) { 
                      e.preventDefault(); 
                      handleSend(); 
                    } 
                  }}
                  placeholder="Ask Docmosiss anything..."
                  className="w-full bg-transparent border-0 focus:ring-0 resize-none outline-none px-6 pt-5 pb-2 text-[16px] text-black dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-600 overflow-y-auto custom-scrollbar"
                />
                
                <div className="flex items-center justify-between px-3 pb-3 pt-1">
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setUseWebSearch(!useWebSearch)}
                      className={`h-9 px-3 rounded-full text-xs font-semibold transition-all duration-300 ${
                        useWebSearch 
                          ? 'bg-neutral-100 text-black dark:bg-neutral-800 dark:text-white shadow-sm border border-neutral-200 dark:border-neutral-700' 
                          : 'text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800 border border-transparent dark:text-neutral-400'
                      }`}
                    >
                      <Globe className={`h-4 w-4 mr-1.5 ${useWebSearch ? 'animate-pulse' : ''}`} /> 
                      Web Search {useWebSearch && <span className="ml-1 h-1.5 w-1.5 rounded-full bg-black dark:bg-white"></span>}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setUseDeepThink(!useDeepThink)}
                      className={`h-9 px-3 rounded-full text-xs font-semibold transition-all duration-300 ${
                        useDeepThink 
                          ? 'bg-neutral-100 text-black dark:bg-neutral-800 dark:text-white shadow-sm border border-neutral-200 dark:border-neutral-700' 
                          : 'text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800 border border-transparent dark:text-neutral-400'
                      }`}
                    >
                      <BrainCircuit className={`h-4 w-4 mr-1.5 ${useDeepThink ? 'animate-pulse' : ''}`} /> 
                      Reasoning {useDeepThink && <span className="ml-1 h-1.5 w-1.5 rounded-full bg-black dark:bg-white"></span>}
                    </Button>
                  </div>
                  
                  <Button 
                    onClick={() => handleSend()} 
                    disabled={!input.trim() || isGenerating}
                    className={`h-10 w-10 p-0 shrink-0 rounded-full transition-all duration-300 ${
                      input.trim() && !isGenerating 
                        ? 'bg-black hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-black scale-100 hover:scale-105' 
                        : 'bg-neutral-100 dark:bg-[#1A1A1A] text-neutral-400 dark:text-neutral-600 scale-95 border border-transparent dark:border-neutral-800'
                    }`}
                  >
                    <Send className="h-4 w-4 ml-0.5" />
                  </Button>
                </div>
              </div>
              
              <div className="text-center mt-3 opacity-70">
                <span className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 tracking-widest uppercase">
                  Docmosiss Intelligence • Enterprise Grade
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}