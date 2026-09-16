import React from 'react';
import { X, Cpu, CheckCircle2, AlertCircle, HardDrive, Terminal, Code, Folder } from 'lucide-react';

export default function SystemInfoModal({ isOpen, onClose, systemInfo }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-[#0f1626] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-[#0d1322] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Environnement Système</h2>
              <p className="text-xs text-slate-400">Runtimes et intégrations détectés sur votre machine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info list */}
        <div className="p-6 space-y-3.5">
          {/* Working dir */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
            <Folder className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Dossier Racine Géré
              </span>
              <span className="text-xs font-mono text-slate-200 break-all select-all font-semibold">
                {systemInfo?.rootDir}
              </span>
            </div>
          </div>

          {/* Node.js */}
          <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span className="text-sm font-semibold text-slate-200">Node.js Runtime</span>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-800 text-emerald-400 font-bold">
              {systemInfo?.nodeVersion || 'Détecté'}
            </span>
          </div>

          {/* Python */}
          <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              <span className="text-sm font-semibold text-slate-200">Python Runtime</span>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-800 text-amber-400 font-bold">
              {systemInfo?.pythonVersion || 'Non détecté'}
            </span>
          </div>

          {/* Git */}
          <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
              <span className="text-sm font-semibold text-slate-200">Git SCM</span>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-800 text-cyan-400 font-bold">
              {systemInfo?.gitVersion || 'Non détecté'}
            </span>
          </div>

          {/* VS Code */}
          <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Code className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-semibold text-slate-200">Visual Studio Code</span>
            </div>
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Commande "code" prête</span>
            </span>
          </div>

          {/* Terminal */}
          <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-semibold text-slate-200">Terminal Windows</span>
            </div>
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Prêt</span>
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-[#0d1322] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
