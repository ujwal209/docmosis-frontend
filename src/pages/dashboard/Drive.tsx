import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Folder, FileText, Image as ImageIcon, MoreVertical, UploadCloud, 
  Plus, Search, ChevronRight, HardDrive, File as FileIcon, 
  Loader2, Trash2, Edit2, Move, ChevronLeft
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { fetchAPI } from '@/lib/api';

// --- HELPERS ---
function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const getFileIcon = (ext: string) => {
  if (['png', 'jpg', 'jpeg', 'gif'].includes(ext)) return ImageIcon;
  if (['pdf', 'docx', 'txt'].includes(ext)) return FileText;
  return FileIcon;
};

// --- SUB-COMPONENTS ---

// 1. Folder Component
const FolderCard = ({ folder, onClick, setRenameTarget, setNewName, setIsRenameModalOpen, handleDelete, handleMoveClick }: any) => {
  return (
    <div className="relative group h-full transition-opacity">
      <button 
        onClick={onClick} 
        className="w-full h-full flex flex-col p-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 dark:hover:border-emerald-500/50 hover:shadow-md rounded-xl shadow-sm transition-all text-left"
      >
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-900">
            <Folder className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
          </div>
        </div>
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm truncate w-full pr-8">{folder.name}</h3>
      </button>
      
      {/* Folder Three Dots */}
      <div className="absolute top-4 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => { setRenameTarget({id: folder.id, name: folder.name, type: 'folder'}); setNewName(folder.name); setIsRenameModalOpen(true); }}>
              <Edit2 className="h-4 w-4 mr-2" /> Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleMoveClick({id: folder.id, name: folder.name, type: 'folder'})}>
              <Move className="h-4 w-4 mr-2" /> Move
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleDelete(folder.id, 'folder')} className="text-red-600 focus:bg-red-50 focus:text-red-700 dark:focus:bg-red-950">
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

// 2. File Row Component
const FileRow = ({ file, onClick, setRenameTarget, setNewName, setIsRenameModalOpen, handleDelete, handleMoveClick }: any) => {
  const Icon = getFileIcon(file.extension);

  return (
    <tr 
      onDoubleClick={onClick} 
      className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors group cursor-pointer"
    >
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 shrink-0">
            <Icon className="h-4 w-4" />
          </div>
          <div className="truncate max-w-[150px] sm:max-w-xs md:max-w-md">
            <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate" title={file.original_name}>{file.original_name}</p>
            <p className="text-xs text-zinc-500 sm:hidden mt-0.5">{formatBytes(file.file_size)} • {formatDate(file.created_at)}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400 hidden md:table-cell whitespace-nowrap">{formatDate(file.created_at)}</td>
      <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400 hidden sm:table-cell whitespace-nowrap">{formatBytes(file.file_size)}</td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 font-medium shadow-none">
          {file.status}
        </Badge>
      </td>
      <td className="px-6 py-4 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={onClick}>View Details</DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setRenameTarget({id: file.id, name: file.original_name, type: 'file'}); setNewName(file.original_name); setIsRenameModalOpen(true); }}>
              <Edit2 className="h-4 w-4 mr-2" /> Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleMoveClick({id: file.id, name: file.original_name, type: 'file'}); }}>
              <Move className="h-4 w-4 mr-2" /> Move
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDelete(file.id, 'file'); }} className="text-red-600 focus:bg-red-50 focus:text-red-700 dark:focus:bg-red-950">
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
};

// --- MAIN DRIVE COMPONENT ---
export default function Drive() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  
  // API State
  const [folders, setFolders] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  // Navigation State
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState([{ id: null as string | null, name: 'Home' }]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal States
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{id: string, name: string, type: 'file' | 'folder'} | null>(null);
  const [newName, setNewName] = useState('');

  // Move Modal States
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [moveTarget, setMoveTarget] = useState<{id: string, name: string, type: 'file' | 'folder'} | null>(null);
  const [moveCurrentFolderId, setMoveCurrentFolderId] = useState<string | null>(null);
  const [moveBreadcrumbs, setMoveBreadcrumbs] = useState([{ id: null as string | null, name: 'Home' }]);
  const [moveFolderList, setMoveFolderList] = useState<any[]>([]);
  const [isLoadingMoveFolders, setIsLoadingMoveFolders] = useState(false);

  // Fetch Data
  useEffect(() => { 
    fetchContents(currentFolderId); 
  }, [currentFolderId]);

  const fetchContents = async (folderId: string | null) => {
    setLoading(true);
    try {
      let url = '/drive/contents';
      if (folderId) url += `?folder_id=${folderId}`;
      const data = await fetchAPI(url);
      setFolders(data.folders || []);
      setFiles(data.files || []);
    } catch (err) {
      toast.error("Failed to load drive contents");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch folders for Move Modal Explorer
  useEffect(() => {
    if (isMoveModalOpen) {
      fetchMoveExplorerFolders(moveCurrentFolderId);
    }
  }, [moveCurrentFolderId, isMoveModalOpen]);

  const fetchMoveExplorerFolders = async (folderId: string | null) => {
    setIsLoadingMoveFolders(true);
    try {
      let url = '/drive/contents';
      if (folderId) url += `?folder_id=${folderId}`;
      const data = await fetchAPI(url);
      
      // Prevent a folder from being moved into itself
      const filteredFolders = (data.folders || []).filter((f: any) => f.id !== moveTarget?.id);
      setMoveFolderList(filteredFolders);
    } catch (err) {
      toast.error("Failed to fetch folders");
    } finally {
      setIsLoadingMoveFolders(false);
    }
  };

  // --- ACTIONS ---
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await fetchAPI('/drive/folders', {
        method: 'POST',
        body: JSON.stringify({ name: newFolderName, parent_folder_id: currentFolderId })
      });
      toast.success(`Folder "${newFolderName}" created`);
      setIsFolderModalOpen(false);
      setNewFolderName('');
      fetchContents(currentFolderId);
    } catch (err) {
      toast.error("Failed to create folder");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    toast.info(`Uploading ${file.name}...`);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (currentFolderId) formData.append('folder_id', currentFolderId);

      const token = localStorage.getItem('docmosiss_token');
      const res = await fetch('/drive/files/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!res.ok) throw new Error("Upload failed");
      toast.success(`${file.name} uploaded successfully!`);
      fetchContents(currentFolderId);
    } catch (err) {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string, type: 'file' | 'folder') => {
    try {
      await fetchAPI(`/drive/${type}s/${id}`, { method: 'DELETE' });
      toast.success(`${type === 'file' ? 'File' : 'Folder'} moved to trash.`);
      fetchContents(currentFolderId);
    } catch (err) {
      toast.error(`Failed to delete ${type}.`);
    }
  };

  const handleRename = async () => {
    if (!renameTarget || !newName.trim()) return;
    try {
      const payload = renameTarget.type === 'file' 
        ? { original_name: newName } 
        : { name: newName };

      await fetchAPI(`/drive/${renameTarget.type}s/${renameTarget.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
      
      toast.success(`${renameTarget.type === 'file' ? 'File' : 'Folder'} renamed successfully!`);
      setIsRenameModalOpen(false);
      fetchContents(currentFolderId);
    } catch (err) {
      toast.error(`Failed to rename ${renameTarget.type}.`);
    }
  };

  const initMoveSequence = (target: {id: string, name: string, type: 'file' | 'folder'}) => {
    setMoveTarget(target);
    setMoveCurrentFolderId(null); // Reset explorer to root
    setMoveBreadcrumbs([{ id: null, name: 'Home' }]);
    setIsMoveModalOpen(true);
  };

  const handleMoveConfirm = async () => {
    if (!moveTarget) return;
    try {
      // Backend expects "root" to set parent_id/folder_id to None
      const targetPayloadId = moveCurrentFolderId === null ? 'root' : moveCurrentFolderId;

      if (moveTarget.type === 'file') {
        await fetchAPI(`/drive/files/${moveTarget.id}`, { 
          method: 'PATCH', 
          body: JSON.stringify({ folder_id: targetPayloadId }) 
        });
      } else {
        await fetchAPI(`/drive/folders/${moveTarget.id}`, { 
          method: 'PATCH', 
          body: JSON.stringify({ parent_folder_id: targetPayloadId }) 
        });
      }
      
      toast.success(`${moveTarget.type === 'file' ? 'File' : 'Folder'} moved successfully!`);
      setIsMoveModalOpen(false);
      fetchContents(currentFolderId);
    } catch (err) {
      toast.error(`Failed to move ${moveTarget.type}.`);
    }
  };

  // --- NAVIGATION HELPERS ---
  const navigateToFolder = (folderId: string, folderName: string) => {
    setCurrentFolderId(folderId);
    setBreadcrumbs([...breadcrumbs, { id: folderId, name: folderName }]);
  };

  const navigateToBreadcrumb = (index: number) => {
    const target = breadcrumbs[index];
    setCurrentFolderId(target.id);
    setBreadcrumbs(breadcrumbs.slice(0, index + 1));
  };

  // --- MOVE MODAL NAVIGATION HELPERS ---
  const moveNavigateDown = (folderId: string, folderName: string) => {
    setMoveCurrentFolderId(folderId);
    setMoveBreadcrumbs([...moveBreadcrumbs, { id: folderId, name: folderName }]);
  };

  const moveNavigateUp = () => {
    if (moveBreadcrumbs.length <= 1) return;
    const newBreadcrumbs = [...moveBreadcrumbs];
    newBreadcrumbs.pop();
    const target = newBreadcrumbs[newBreadcrumbs.length - 1];
    setMoveCurrentFolderId(target.id);
    setMoveBreadcrumbs(newBreadcrumbs);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4 sm:p-8 mt-4">
      
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />

      {/* --- FOLDER CREATE MODAL --- */}
      <Dialog open={isFolderModalOpen} onOpenChange={setIsFolderModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Create New Folder</DialogTitle></DialogHeader>
          <Input 
            value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} 
            placeholder="e.g., Q4 Financials" className="mt-4" autoFocus
          />
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsFolderModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateFolder} className="bg-emerald-600 hover:bg-emerald-700 text-white">Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- RENAME MODAL --- */}
      <Dialog open={isRenameModalOpen} onOpenChange={setIsRenameModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Rename {renameTarget?.type}</DialogTitle></DialogHeader>
          <Input 
            value={newName} onChange={(e) => setNewName(e.target.value)} 
            className="mt-4" autoFocus
          />
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsRenameModalOpen(false)}>Cancel</Button>
            <Button onClick={handleRename} className="bg-emerald-600 hover:bg-emerald-700 text-white">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- MOVE MODAL --- */}
      <Dialog open={isMoveModalOpen} onOpenChange={setIsMoveModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Move "{moveTarget?.name}"</DialogTitle></DialogHeader>
          
          <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2 rounded-lg mt-2">
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8" 
              onClick={moveNavigateUp} 
              disabled={moveBreadcrumbs.length <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 flex-1 truncate">
              {moveBreadcrumbs[moveBreadcrumbs.length - 1]?.name}
            </span>
          </div>

          <div className="h-64 overflow-y-auto border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 mt-4 space-y-1 bg-white dark:bg-zinc-950">
            {isLoadingMoveFolders ? (
              <div className="flex justify-center items-center h-full"><Loader2 className="h-6 w-6 animate-spin text-zinc-400" /></div>
            ) : moveFolderList.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-zinc-500 text-sm">
                <Folder className="h-8 w-8 mb-2 opacity-20" />
                No subfolders here.
              </div>
            ) : (
              moveFolderList.map(f => (
                <div 
                  key={f.id} 
                  onClick={() => moveNavigateDown(f.id, f.name)}
                  className="flex justify-between items-center p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Folder className="h-5 w-5 text-zinc-400" />
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{f.name}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-zinc-400" />
                </div>
              ))
            )}
          </div>

          <DialogFooter className="mt-4 flex justify-between sm:justify-between">
            <Button variant="outline" onClick={() => setIsMoveModalOpen(false)}>Cancel</Button>
            <Button onClick={handleMoveConfirm} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Move Here
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-semibold tracking-tight text-zinc-900 dark:text-white flex items-center gap-3">
            <HardDrive className="h-7 w-7 text-emerald-500" /> My Drive
          </h1>
          <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400 mt-1">
            Manage your files, folders, and active workspace storage.
          </p>
        </div>
      </div>

      {/* --- ACTION BAR --- */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input 
            placeholder="Search files and folders..." 
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-sm"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button onClick={() => setIsFolderModalOpen(true)} variant="outline" className="flex-1 sm:flex-none bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">
            <Plus className="h-4 w-4 mr-2" /> New Folder
          </Button>
          <Button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm disabled:opacity-70">
            {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UploadCloud className="h-4 w-4 mr-2" />}
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
      </div>

      {/* --- BREADCRUMBS --- */}
      <div className="flex items-center gap-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
        <span className="text-zinc-400">Workspace</span>
        <ChevronRight className="h-4 w-4 text-zinc-400" />
        {breadcrumbs.map((crumb, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <button 
              onClick={() => navigateToBreadcrumb(idx)}
              className={`transition-colors hover:underline ${idx === breadcrumbs.length - 1 ? 'text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5 rounded-md no-underline hover:no-underline' : 'hover:text-zinc-900 dark:hover:text-zinc-100'}`}
            >
              {crumb.name}
            </button>
            {idx < breadcrumbs.length - 1 && <ChevronRight className="h-4 w-4 text-zinc-400" />}
          </div>
        ))}
      </div>

      {/* --- MAIN CONTENT --- */}
      {loading ? (
        <div className="flex justify-center items-center py-20 text-zinc-500"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : (
        <>
          {/* Folders */}
          {folders.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">Folders</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {folders.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase())).map((folder) => (
                  <FolderCard 
                    key={folder.id} 
                    folder={folder}
                    onClick={() => navigateToFolder(folder.id, folder.name)}
                    setRenameTarget={setRenameTarget}
                    setNewName={setNewName}
                    setIsRenameModalOpen={setIsRenameModalOpen}
                    handleDelete={handleDelete}
                    handleMoveClick={initMoveSequence}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Files */}
          {(files.length > 0 || folders.length === 0) && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">Files</h2>
              {files.length === 0 ? (
                <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 border-dashed rounded-xl p-12 text-center text-zinc-500 dark:text-zinc-400">
                  <p>No files in this folder.</p>
                </div>
              ) : (
                <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-zinc-500 dark:text-zinc-400 uppercase bg-zinc-50/50 dark:bg-zinc-900/20 border-b border-zinc-200 dark:border-zinc-800">
                        <tr>
                          <th className="px-6 py-4 font-semibold">Name</th>
                          <th className="px-6 py-4 font-semibold hidden md:table-cell">Date Modified</th>
                          <th className="px-6 py-4 font-semibold hidden sm:table-cell">Size</th>
                          <th className="px-6 py-4 font-semibold">Status</th>
                          <th className="px-6 py-4 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                        {files.filter(f => f.original_name.toLowerCase().includes(searchQuery.toLowerCase())).map((file) => (
                          <FileRow 
                            key={file.id} 
                            file={file} 
                            onClick={() => navigate(`/dashboard/drive/${file.id}`)}
                            setRenameTarget={setRenameTarget}
                            setNewName={setNewName}
                            setIsRenameModalOpen={setIsRenameModalOpen}
                            handleDelete={handleDelete}
                            handleMoveClick={initMoveSequence}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}