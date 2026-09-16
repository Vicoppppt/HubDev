import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Terminal, 
  Play, 
  Square, 
  ExternalLink, 
  Copy, 
  Check, 
  Trash2, 
  ArrowDown, 
  RefreshCw 
} from 'lucide-react';

export default function LogsModal({ isOpen, onClose, projectName, onToggleProcess, isRunning, projectUrl, projectPort }) {
  const [logs, setLogs] = useState([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  const fetchLogs = async () => {
    if (!projectName) return;
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectName)}/process/logs`);
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err) {
      console.error('Erreur fetch logs:', err);
    }
  };

  useEffect(() => {
    if (!isOpen || !projectName) return;
    fetchLogs();

    // Poll every 1.2s when modal is open
    const timer = setInterval(fetchLogs, 1200);
    return () => clearInterval(timer);
  }, [isOpen, projectName]);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  if (!isOpen) return null;

  const handleCopy = () => {
    const text = logs.map(l => `[${l.time}] ${l.text}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl bg-[#0b0f19] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-[#0d1322] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-cyan-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">Console de logs</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-cyan-300 font-mono font-semibold">
                  {projectName}
                </span>
                {isRunning ? (
                  <span className="flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>En cours d'exécution</span>
                    {projectPort && <span className="font-mono">(: {projectPort})</span>}
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800/60 text-slate-400 font-medium">
                    Arrêté
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Sortie standard et flux d'erreurs en direct</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Start/Stop toggle button */}
            <button
              onClick={() => onToggleProcess(projectName)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                isRunning
                  ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20'
                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
              }`}
            >
              {isRunning ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Arrêter</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Démarrer</span>
                </>
              )}
            </button>

            {/* Open Web App if running and url available */}
            {projectUrl && (
              <a
                href={projectUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 text-xs font-semibold transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Ouvrir {projectPort ? `:${projectPort}` : 'Web'}</span>
              </a>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-2.5 border-b border-slate-800/80 bg-[#090d16] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span>Lignes capturées : <strong className="text-slate-200">{logs.length}</strong></span>
            <button
              onClick={fetchLogs}
              className="p-1 rounded hover:text-white transition flex items-center gap-1"
              title="Rafraîchir les logs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-200">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0 w-3.5 h-3.5"
              />
              <span className="flex items-center gap-1">
                <ArrowDown className="w-3 h-3" />
                <span>Défilement auto</span>
              </span>
            </label>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copié !' : 'Copier'}</span>
            </button>

            <button
              onClick={() => setLogs([])}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800/50 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 transition"
              title="Vider l'affichage local"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Effacer</span>
            </button>
          </div>
        </div>

        {/* Terminal logs body */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 font-['JetBrains_Mono',monospace] text-xs leading-relaxed space-y-1 select-text bg-[#070b13]"
        >
          {logs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2">
              <Terminal className="w-8 h-8 opacity-40" />
              <p>Aucun log pour le moment.</p>
              {!isRunning && (
                <p className="text-slate-500 text-[11px]">
                  Cliquez sur "Démarrer" pour lancer l'exécution et afficher les sorties en direct.
                </p>
              )}
            </div>
          ) : (
            logs.map((log, index) => {
              const isErr = log.type === 'stderr' || log.text.toLowerCase().includes('error');
              const isInfo = log.type === 'info';

              return (
                <div 
                  key={index}
                  className={`flex items-start gap-2.5 py-0.5 px-2 rounded hover:bg-slate-900/50 ${
                    isErr ? 'text-rose-300 bg-rose-950/10' : isInfo ? 'text-cyan-300' : 'text-slate-300'
                  }`}
                >
                  <span className="text-slate-600 select-none shrink-0 font-sans text-[10px] mt-0.5">
                    {log.time}
                  </span>
                  <span className="whitespace-pre-wrap break-all flex-1 font-mono">
                    {log.text}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
