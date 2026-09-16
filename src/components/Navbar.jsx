import React from 'react';
import { Plus, RefreshCw, Cpu, FolderGit2, Terminal, Code2 } from 'lucide-react';

export default function Navbar({ onNewProject, onOpenSystem, onRefresh, loading, systemInfo }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#090d16]/80 backdrop-blur-md px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo & Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-0.5 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-[#0d131f] rounded-[10px] flex items-center justify-center">
              <Code2 className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                DevHub
              </span>
              <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Programmes
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block truncate max-w-md">
              {systemInfo?.rootDir || 'C:\\Users\\kuchp\\Programmes'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onRefresh}
            disabled={loading}
            title="Rafraîchir la liste"
            className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-800/80 text-slate-300 hover:text-white transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          <button
            onClick={onOpenSystem}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-800/80 text-slate-300 hover:text-white text-xs font-medium transition"
          >
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span className="hidden md:inline">Outils Système</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
          </button>

          <button
            onClick={onNewProject}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm font-semibold shadow-lg shadow-cyan-500/25 transition transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Projet</span>
          </button>
        </div>
      </div>
    </header>
  );
}
