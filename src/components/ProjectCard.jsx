import React, { useState } from 'react';
import { 
  Folder, 
  Code, 
  Terminal, 
  FolderOpen, 
  KeyRound, 
  GitBranch, 
  Clock, 
  Trash2, 
  ExternalLink,
  Play,
  Square,
  FileText,
  Globe,
  Loader2,
  UploadCloud,
  DownloadCloud,
  Link2,
  Database,
  HelpCircle,
  BookOpen
} from 'lucide-react';

export default function ProjectCard({ 
  project, 
  onOpenEnv, 
  onDelete, 
  onAction, 
  onToggleProcess, 
  onOpenLogs,
  onOpenGit,
  onQuickPush,
  onQuickPull
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [processLoading, setProcessLoading] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [pulling, setPulling] = useState(false);

  const isRunning = project.process?.running;
  const isDatabaseStack = Boolean(project.isDbProject || project.hasPsql || project.hasMongosh);
  const webUrl = (!isDatabaseStack && isRunning && project.process?.url) ? project.process.url : 
    (!isDatabaseStack && project.configuredPort && isRunning ? `http://localhost:${project.configuredPort}` : null);

  const handleAction = async (actionType) => {
    setActionLoading(actionType);
    try {
      await onAction(project.name, actionType);
    } finally {
      setTimeout(() => setActionLoading(null), 500);
    }
  };

  const handleToggle = async () => {
    setProcessLoading(true);
    try {
      await onToggleProcess(project.name);
    } finally {
      setProcessLoading(false);
    }
  };

  const handlePushClick = async () => {
    if (!project.git?.hasRemote) {
      onOpenGit(project.name);
      return;
    }

    setPushing(true);
    try {
      await onQuickPush(project.name);
    } finally {
      setPushing(false);
    }
  };

  const handlePullClick = async () => {
    if (!project.git?.hasRemote) {
      onOpenGit(project.name);
      return;
    }

    setPulling(true);
    try {
      if (onQuickPull) {
        await onQuickPull(project.name);
      }
    } finally {
      setPulling(false);
    }
  };

  const formatDate = (isoStr) => {
    try {
      const d = new Date(isoStr);
      return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      }).format(d);
    } catch {
      return 'Récemment';
    }
  };

  const getBadgeStyle = (type) => {
    switch (type.toLowerCase()) {
      case 'node.js':
      case 'express':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'python':
      case 'fastapi':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'react':
      case 'vite':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'next.js':
        return 'bg-slate-100/10 text-white border-slate-100/20';
      case 'rust':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'jupyter':
        return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
      case 'ai':
        return 'bg-purple-600/15 text-purple-300 border-purple-500/30';
      case 'postgresql':
        return 'bg-blue-600/15 text-blue-300 border-blue-500/30';
      case 'mongodb':
        return 'bg-emerald-600/15 text-emerald-300 border-emerald-500/30';
      case 'go':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      case 'qcm':
        return 'bg-pink-500/15 text-pink-300 border-pink-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className={`group relative rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-xl ${
      isRunning 
        ? 'bg-[#111a2f]/80 border-cyan-500/50 hover:border-cyan-400 hover:shadow-cyan-950/30' 
        : 'bg-[#111726]/60 border-slate-800/80 hover:bg-[#131b2e] hover:border-slate-700 hover:shadow-cyan-950/10'
    }`}>
      {/* Card Header & Metadata */}
      <div className="p-5 pb-3">
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`p-2 rounded-xl border transition ${
              isRunning 
                ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 shadow-sm shadow-cyan-500/20' 
                : 'bg-slate-800/60 border-slate-700/60 text-cyan-400 group-hover:text-cyan-300'
            }`}>
              <Folder className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-base text-slate-100 group-hover:text-cyan-300 transition truncate">
                {project.name}
              </h3>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Clock className="w-3 h-3 text-slate-500" />
                <span>{formatDate(project.updatedAt)}</span>
              </p>
            </div>
          </div>

          {/* Delete action */}
          <div>
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                title="Supprimer le projet"
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex items-center gap-1 bg-rose-950/90 border border-rose-800/80 rounded-lg p-1 text-xs">
                <span className="text-[11px] text-rose-300 px-1 font-medium">Sûr ?</span>
                <button
                  onClick={() => onDelete(project.name)}
                  className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded font-semibold text-[10px]"
                >
                  Oui
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px]"
                >
                  Non
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tech Badges */}
        <div className="flex flex-wrap items-center gap-1.5 my-2.5">
          {project.types.map((type, idx) => (
            <span
              key={idx}
              className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-md border ${getBadgeStyle(type)}`}
            >
              {type}
            </span>
          ))}

          {/* Git Branch Badge & Quick Git Sync Button */}
          {project.git?.initialized && (
            <button
              onClick={() => onOpenGit(project.name)}
              className={`text-[11px] font-medium px-2 py-0.5 rounded-md border transition flex items-center gap-1.5 ${
                project.git?.hasRemote 
                  ? 'border-cyan-500/30 bg-cyan-950/20 text-cyan-300 hover:bg-cyan-900/30' 
                  : 'border-slate-700/80 bg-slate-800/40 text-slate-300 hover:bg-slate-800'
              }`}
              title="Gérer la synchronisation Git / GitHub"
            >
              <GitBranch className="w-3 h-3 text-cyan-400" />
              <span className="truncate max-w-[80px] font-mono">{project.git.branch || 'main'}</span>
              
              {project.git.changesCount > 0 ? (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30" title={`${project.git.changesCount} modifications`}>
                  {project.git.changesCount}
                </span>
              ) : (
                <span 
                  className="w-1.5 h-1.5 rounded-full bg-emerald-400" 
                  title="À jour"
                />
              )}
            </button>
          )}

          {/* GitHub Repo Link Badge */}
          {project.git?.githubUrl && (
            <a
              href={project.git.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] font-medium px-2 py-0.5 rounded-md border border-slate-700/60 bg-slate-800/40 text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center gap-1"
              title="Ouvrir le dépôt sur GitHub"
            >
              <ExternalLink className="w-3 h-3 text-slate-400" />
              <span>GitHub</span>
            </a>
          )}
        </div>

        {/* .env Info Pill & 1-Click Push Button */}
        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2">
          <button
            onClick={() => onOpenEnv(project.name)}
            className="group/env flex items-center gap-1.5 text-xs text-slate-300 hover:text-cyan-400 transition"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-400 group-hover/env:rotate-12 transition-transform" />
            <span className="font-medium truncate max-w-[150px]">
              {project.envFiles?.length > 0 ? (
                <span className="text-slate-200 group-hover/env:text-cyan-300">
                  {project.envFiles.join(', ')}
                </span>
              ) : (
                <span className="text-slate-400 italic">Gérer .env</span>
              )}
            </span>
          </button>

          {/* GIT ACTIONS (PULL & PUSH) */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* 1-CLICK PULL GITHUB BUTTON */}
            <button
              onClick={handlePullClick}
              disabled={pulling}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition border bg-slate-800/70 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700/60"
              title={project.git?.hasRemote ? "Récupérer les mises à jour depuis GitHub (Pull)" : "Lier à GitHub"}
            >
              {pulling ? (
                <Loader2 className="w-3 h-3 animate-spin text-blue-400" />
              ) : (
                <DownloadCloud className="w-3.5 h-3.5 text-blue-400" />
              )}
              <span>Pull</span>
            </button>

            {/* 1-CLICK PUSH GITHUB BUTTON */}
            <button
              onClick={handlePushClick}
              disabled={pushing}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition border ${
                project.git?.changesCount > 0
                  ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-950/30'
                  : 'bg-slate-800/70 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700/60'
              }`}
              title={project.git?.hasRemote ? "Pousser en 1 clic sur GitHub" : "Lier à GitHub et pusher"}
            >
              {pushing ? (
                <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />
              ) : (
                <UploadCloud className="w-3.5 h-3.5 text-cyan-400" />
              )}
              <span>Push</span>
              {project.git?.changesCount > 0 && (
                <span className="text-[10px] font-bold px-1 rounded bg-amber-500 text-[#090d16]">
                  {project.git.changesCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Execution / Server Controls Banner */}
      <div className="px-4 py-2.5 bg-[#0e1526]/80 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {project.canStartServer ? (
            <>
              {/* Start / Stop Button */}
              <button
                onClick={handleToggle}
                disabled={processLoading}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  isRunning
                    ? 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30'
                    : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-950/20'
                }`}
                title={isRunning ? 'Arrêter le serveur' : 'Démarrer le serveur'}
              >
                {processLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : isRunning ? (
                  <Square className="w-3.5 h-3.5 fill-current" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current" />
                )}
                <span>{isRunning ? 'Arrêter' : 'Démarrer'}</span>
              </button>

              {/* Status Pill */}
              <span className={`text-[11px] font-medium flex items-center gap-1.5 px-2 py-0.5 rounded-md ${
                isRunning ? 'text-emerald-400 font-semibold' : 'text-slate-500'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                <span>{isRunning ? 'Actif' : 'Arrêté'}</span>
              </span>
            </>
          ) : project.isStaticWeb ? (
            <span className="text-[11px] font-medium text-blue-400 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              <span>Site Statique</span>
            </span>
          ) : (
            <span className="text-[11px] text-slate-500">
              Projet script
            </span>
          )}
        </div>

        {/* Right side of execution banner: Web Access & Logs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Logs Button */}
          {project.canStartServer && (
            <button
              onClick={() => onOpenLogs(project.name)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-medium transition"
              title="Voir les logs de sortie console"
            >
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span>Logs</span>
            </button>
          )}

          {/* Action buttons: DB CLI (psql / mongosh) vs Web Access */}
          {isDatabaseStack ? (
            <div className="flex flex-wrap items-center gap-1.5">
              {(project.hasPsql !== false) && (
                <button
                  onClick={() => handleAction('launch-psql')}
                  disabled={!isRunning || actionLoading !== null}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition transform active:scale-95 ${
                    isRunning
                      ? 'bg-blue-600/25 hover:bg-blue-600/40 text-blue-300 border border-blue-500/50 shadow-sm shadow-blue-900/30 hover:shadow-blue-500/20'
                      : 'bg-slate-800/40 text-slate-500 border border-slate-800 cursor-not-allowed opacity-50'
                  }`}
                  title={isRunning ? "Ouvrir la console interactive PostgreSQL (psql)" : "Démarrez d'abord la base pour ouvrir psql"}
                >
                  <Database className="w-3.5 h-3.5 text-blue-400" />
                  <span>psql</span>
                </button>
              )}

              {project.hasDbeaver && (
                <button
                  onClick={() => handleAction('launch-dbeaver')}
                  disabled={actionLoading !== null}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-md shadow-orange-950/30 transition transform active:scale-95"
                  title="Ouvrir l'interface graphique DBeaver Community (espace isolé)"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-white" />
                  <span>DBeaver</span>
                </button>
              )}

              {(project.hasMongosh !== false) && (
                <button
                  onClick={() => handleAction('launch-mongosh')}
                  disabled={!isRunning || actionLoading !== null}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition transform active:scale-95 ${
                    isRunning
                      ? 'bg-emerald-600/25 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/50 shadow-sm shadow-emerald-900/30 hover:shadow-emerald-500/20'
                      : 'bg-slate-800/40 text-slate-500 border border-slate-800 cursor-not-allowed opacity-50'
                  }`}
                  title={isRunning ? "Ouvrir le shell interactif MongoDB (mongosh)" : "Démarrez d'abord la base pour ouvrir mongosh"}
                >
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  <span>mongosh</span>
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Web Access Button */}
              {webUrl ? (
                <a
                  href={webUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-bold shadow-md transition transform active:scale-95 animate-in fade-in ${
                    project.types?.includes('Jupyter')
                      ? 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 shadow-orange-500/20'
                      : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-cyan-500/20'
                  }`}
                  title={`Ouvrir dans le navigateur (${webUrl})`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>{project.types?.includes('Jupyter') ? 'Ouvrir Jupyter' : 'Ouvrir Web'}</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </a>
              ) : project.previewUrl ? (
                <a
                  href={project.previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 text-xs font-semibold transition"
                  title="Prévisualiser la page HTML"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Voir la page</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </a>
              ) : (
                <div className="flex items-center gap-1.5">
                  {/* Interactive QCM Button */}
                  {project.hasQuiz && (
                    <button
                      onClick={() => handleAction('launch-quiz')}
                      disabled={actionLoading !== null}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 text-white text-xs font-bold shadow-md shadow-pink-950/30 transition transform active:scale-95"
                      title="Lancer le QCM interactif des leçons dans un terminal"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Lancer QCM</span>
                    </button>
                  )}

                  {/* JupyterLab Quick Launcher for Notebook projects without local server */}
                  {project.hasNotebooks && !project.canStartServer && (
                    <button
                      onClick={() => handleAction('launch-jupyter')}
                      disabled={actionLoading !== null}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-orange-500/15 hover:bg-orange-500/25 text-orange-300 border border-orange-500/30 text-xs font-semibold transition transform active:scale-95"
                      title="Ouvrir les notebooks (.ipynb) avec JupyterLab"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-orange-400" />
                      <span>Jupyter</span>
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Card Footer: IDE & Folder Actions */}
      <div className="bg-[#090d16] px-4 py-2 border-t border-slate-800/80 flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5">
          {/* VS Code */}
          <button
            onClick={() => handleAction('open-code')}
            disabled={actionLoading !== null}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-blue-950/40 text-slate-300 hover:text-blue-400 border border-slate-800 hover:border-blue-800/50 text-xs font-medium transition"
            title="Ouvrir dans VS Code"
          >
            <Code className="w-3.5 h-3.5 text-blue-400" />
            <span>VS Code</span>
          </button>

          {/* Terminal */}
          <button
            onClick={() => handleAction('open-terminal')}
            disabled={actionLoading !== null}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium transition"
            title="Ouvrir dans le Terminal Windows"
          >
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Terminal</span>
          </button>

          {/* Explorer */}
          <button
            onClick={() => handleAction('open-explorer')}
            disabled={actionLoading !== null}
            className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition"
            title="Ouvrir dans l'Explorateur Windows"
          >
            <FolderOpen className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          {/* Git Modal Open button */}
          <button
            onClick={() => onOpenGit(project.name)}
            className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-cyan-950/30 text-slate-400 hover:text-cyan-400 border border-slate-800 transition"
            title="Détails & Configuration GitHub"
          >
            <GitBranch className="w-3.5 h-3.5" />
          </button>

          {/* Manage .env button */}
          <button
            onClick={() => onOpenEnv(project.name)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-amber-950/30 text-slate-300 hover:text-amber-400 border border-slate-800 hover:border-amber-800/50 text-xs font-medium transition"
            title="Éditer les variables .env"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            <span>.env</span>
          </button>
        </div>
      </div>
    </div>
  );
}
