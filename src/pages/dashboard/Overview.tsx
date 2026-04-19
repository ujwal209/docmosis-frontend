import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, MoreVertical, Loader2, Image as ImageIcon, 
  File as FileIcon, ArrowRight, Layers, Minimize2, FileOutput, Scissors
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchAPI } from '@/lib/api';
import { toast } from "sonner";

// --- HELPERS ---
function formatDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.abs(now.getTime() - date.getTime()) / 36e5;
  if (diffInHours < 24) {
    if (diffInHours < 1) return 'Just now';
    return `${Math.floor(diffInHours)} hours ago`;
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const getFileIcon = (ext: string) => {
  if (['png', 'jpg', 'jpeg', 'gif'].includes(ext)) return ImageIcon;
  if (['pdf', 'docx', 'txt'].includes(ext)) return FileText;
  return FileIcon;
};

// --- CONVERSION TYPES DATA ---
// Designed with distinct, professional colors (not "vibe coded")
const CONVERSION_TOOLS = [
  {
    id: 'pdf-to-word',
    title: 'PDF to Word',
    desc: 'Convert PDF documents to editable Word files with perfect formatting.',
    icon: FileText,
    accent: 'bg-blue-500',
    iconBg: 'bg-blue-50 dark:bg-blue-500/10',
    iconColor: 'text-blue-600 dark:text-blue-400',
    hoverBorder: 'hover:border-blue-300 dark:hover:border-blue-700/50'
  },
  {
    id: 'word-to-pdf',
    title: 'Word to PDF',
    desc: 'Securely convert your Word documents into universally readable PDF files.',
    icon: FileOutput,
    accent: 'bg-emerald-500',
    iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    hoverBorder: 'hover:border-emerald-300 dark:hover:border-emerald-700/50'
  },
  {
    id: 'image-to-pdf',
    title: 'Images to PDF',
    desc: 'Combine multiple PNG or JPEG images into a single, organized PDF document.',
    icon: ImageIcon,
    accent: 'bg-amber-500',
    iconBg: 'bg-amber-50 dark:bg-amber-500/10',
    iconColor: 'text-amber-600 dark:text-amber-400',
    hoverBorder: 'hover:border-amber-300 dark:hover:border-amber-700/50'
  },
  {
    id: 'merge-pdf',
    title: 'Merge PDFs',
    desc: 'Combine multiple PDF files into one continuous document in seconds.',
    icon: Layers,
    accent: 'bg-purple-500',
    iconBg: 'bg-purple-50 dark:bg-purple-500/10',
    iconColor: 'text-purple-600 dark:text-purple-400',
    hoverBorder: 'hover:border-purple-300 dark:hover:border-purple-700/50'
  },
  {
    id: 'split-pdf',
    title: 'Split PDF',
    desc: 'Extract pages or split a large PDF into multiple smaller documents.',
    icon: Scissors,
    accent: 'bg-cyan-500',
    iconBg: 'bg-cyan-50 dark:bg-cyan-500/10',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
    hoverBorder: 'hover:border-cyan-300 dark:hover:border-cyan-700/50'
  },
  {
    id: 'compress-pdf',
    title: 'Compress PDF',
    desc: 'Reduce the file size of your PDFs while maintaining visual quality.',
    icon: Minimize2,
    accent: 'bg-rose-500',
    iconBg: 'bg-rose-50 dark:bg-rose-500/10',
    iconColor: 'text-rose-600 dark:text-rose-400',
    hoverBorder: 'hover:border-rose-300 dark:hover:border-rose-700/50'
  }
];

export default function Overview() {
  const navigate = useNavigate();
  const [recentFiles, setRecentFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const data = await fetchAPI('/drive/contents');
      const files = data.files || [];
      setRecentFiles(files.slice(0, 4)); // Show top 4 recent files
    } catch (error) {
      toast.error("Failed to load recent files");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 p-4 sm:p-8 mt-4">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-semibold tracking-tight text-zinc-900 dark:text-white">
          Document Conversion Engine
        </h1>
        <p className="text-base text-zinc-500 dark:text-zinc-400 mt-2 max-w-2xl">
          Select a tool below to start processing your files. All conversions maintain original formatting and are securely processed.
        </p>
      </div>

      {/* Conversion Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {CONVERSION_TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <div 
              key={tool.id}
              onClick={() => navigate(`/dashboard/convert`)}
              className={`relative overflow-hidden cursor-pointer bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 transition-all duration-200 shadow-sm hover:shadow-md group ${tool.hoverBorder}`}
            >
              {/* Top Accent Line */}
              <div className={`absolute top-0 left-0 w-full h-1 opacity-80 ${tool.accent}`} />
              
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg shrink-0 transition-colors ${tool.iconBg} ${tool.iconColor}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                    {tool.title}
                    <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 transition-all duration-300 text-zinc-400 group-hover:opacity-100 group-hover:translate-x-0" />
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
                    {tool.desc}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Files List */}
      <div className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Recent Documents</h2>
          <Button variant="ghost" className="text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400" onClick={() => navigate('/dashboard/drive')}>
            View Drive &rarr;
          </Button>
        </div>
        
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 flex flex-col justify-center items-center gap-4 text-zinc-500">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
          ) : recentFiles.length === 0 ? (
            <div className="p-12 text-center border-t border-zinc-100 dark:border-zinc-800/50">
              <FileIcon className="h-10 w-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-900 dark:text-white font-medium">No recent documents</p>
              <p className="text-sm text-zinc-500 mt-1">Upload files in your Drive to see them here.</p>
            </div>
          ) : (
            recentFiles.map((file, idx) => {
              const Icon = getFileIcon(file.extension);
              return (
                <div 
                  key={file.id} 
                  onClick={() => navigate(`/dashboard/drive/${file.id}`)}
                  className={`flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors ${idx !== recentFiles.length - 1 ? 'border-b border-zinc-100 dark:border-zinc-800/50' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-500 dark:text-zinc-400 shrink-0 border border-zinc-200/50 dark:border-zinc-800">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-white truncate max-w-[200px] sm:max-w-sm md:max-w-md" title={file.original_name}>
                        {file.original_name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{file.extension || 'FILE'}</span>
                        <span className="text-xs text-zinc-500">• {formatDate(file.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary" className="hidden sm:flex bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 font-medium shadow-none">
                      {file.status}
                    </Badge>
                    <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      
    </div>
  );
}