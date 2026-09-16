import React, { useState, useEffect } from 'react';
import { 
  Search, 
  FolderPlus, 
  KeyRound, 
  GitBranch, 
  FolderCode, 
  Sparkles, 
  Filter,
  CheckCircle2,
  AlertCircle,
  Terminal,
  Code2,
  Layers,
  ArrowUpDown,
  PlayCircle,
  Activity,
  UploadCloud
} from 'lucide-react';

import Navbar from './components/Navbar';
import ProjectCard from './components/ProjectCard';
import CreateProjectModal from './components/CreateProjectModal';
import EnvModal from './components/EnvModal';
import SystemInfoModal from './components/SystemInfoModal';
import LogsModal from './components/LogsModal';
import GitModal from './components/GitModal';
import GitActionLogModal from './components/GitActionLogModal';

export default function App() {
  const [projects, setProjects] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [systemInfo, setSystemInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recent'); // 'recent', 'name'

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEnvOpen, setIsEnvOpen] = useState(false);
  const [activeProjectForEnv, setActiveProjectForEnv] = useState(null);
  const [isSystemOpen, setIsSystemOpen] = useState(false);

  // Logs modal
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [activeProjectForLogs, setActiveProjectForLogs] = useState(null);

  // Git modal
  const [isGitOpen, setIsGitOpen] = useState(false);
  const [activeProjectForGit, setActiveProjectForGit] = useState(null);

  // Git Action Log Modal (for 1-click push and pull logs pop-up)
  const [gitLogModal, setGitLogModal] = useState({
    isOpen: false,
    actionType: 'push',
    projectName: '',
    success: true,
    message: '',
    output: '',
    branch: '',
    githubUrl: null,
  });

  // Toast notification
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [projRes, sysRes, tplRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/system'),
        fetch('/api/templates'),
      ]);

      const [projData, sysData, tplData] = await Promise.all([
        projRes.json(),
        sysRes.json(),
        tplRes.json(),
      ]);

      setProjects(projData.projects || []);
      setSystemInfo(sysData);
      setTemplates(tplData.templates || []);
    } catch (err) {
      if (!silent) showToast('Erreur lors du chargement des données', 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadData();

    // Background sync of process states every 3 seconds
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/processes');
        if (res.ok) {
          const data = await res.json();
          setProjects(prev => prev.map(p => {
            const proc = data.processes[p.name];
            if (proc) {
              return {
                ...p,
                process: {
                  running: proc.running,
                  status: proc.status,
                  port: proc.port,
                  url: proc.url,
                  pid: proc.pid,
                }
              };
            } else {
              return {
                ...p,
                process: {
                  ...p.process,
                  running: false,
                  status: 'stopped',
                }
              };
            }
          }));
        }
      } catch {}
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Create Project handler
  const handleCreateProject = async (projectData) => {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(projectData),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Erreur création projet');
    }

    showToast(`🎉 Projet "${projectData.name}" créé avec succès !`);
    await loadData(true);
  };

  // Delete Project handler
  const handleDeleteProject = async (name) => {
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(name)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(`Projet "${name}" supprimé`);
      setProjects(prev => prev.filter(p => p.name !== name));
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Toggle server process start/stop
  const handleToggleProcess = async (projectName) => {
    const project = projects.find(p => p.name === projectName);
    const isRunning = project?.process?.running;

    try {
      if (isRunning) {
        const res = await fetch(`/api/projects/${encodeURIComponent(projectName)}/process/stop`, {
          method: 'POST',
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        showToast(`🛑 Serveur "${projectName}" arrêté`);
      } else {
        const res = await fetch(`/api/projects/${encodeURIComponent(projectName)}/process/start`, {
          method: 'POST',
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        showToast(`🚀 Serveur "${projectName}" démarré ! (Port ${data.port || 'détecté'})`);
      }
      await loadData(true);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // 1-Click Quick Push to GitHub
  const handleQuickPush = async (projectName) => {
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectName)}/git/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.needRemote) {
          setActiveProjectForGit(projectName);
          setIsGitOpen(true);
          return;
        }
        setGitLogModal({
          isOpen: true,
          actionType: 'push',
          projectName,
          success: false,
          message: data.error || data.message || 'Échec du push GitHub',
          output: data.output || data.error || 'Erreur lors du push.',
          branch: data.branch || '',
          githubUrl: data.githubUrl || null,
        });
        showToast(data.error || 'Échec du push GitHub', 'error');
        return;
      }

      setGitLogModal({
        isOpen: true,
        actionType: 'push',
        projectName,
        success: true,
        message: data.message || 'Push sur GitHub réussi !',
        output: data.output || 'Tout le code est à jour sur GitHub.',
        branch: data.branch || 'main',
        githubUrl: data.githubUrl || null,
      });

      showToast(`🚀 Pushé avec succès sur GitHub !`);
      await loadData(true);
    } catch (err) {
      setGitLogModal({
        isOpen: true,
        actionType: 'push',
        projectName,
        success: false,
        message: err.message,
        output: err.message,
        branch: '',
        githubUrl: null,
      });
      showToast(err.message, 'error');
    }
  };

  // 1-Click Quick Pull from GitHub
  const handleQuickPull = async (projectName) => {
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectName)}/git/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (!res.ok) {
        setGitLogModal({
          isOpen: true,
          actionType: 'pull',
          projectName,
          success: false,
          message: data.error || data.message || 'Échec de la récupération (Pull)',
          output: data.output || data.error || 'Erreur lors du pull.',
          branch: '',
          githubUrl: null,
        });
        showToast(data.error || 'Échec du pull GitHub', 'error');
        return;
      }

      setGitLogModal({
        isOpen: true,
        actionType: 'pull',
        projectName,
        success: true,
        message: data.message || 'Dépôt synchronisé depuis GitHub !',
        output: data.output || 'Already up to date.',
        branch: '',
        githubUrl: null,
      });

      showToast(`📥 Synchronisé avec GitHub avec succès !`);
      await loadData(true);
    } catch (err) {
      setGitLogModal({
        isOpen: true,
        actionType: 'pull',
        projectName,
        success: false,
        message: err.message,
        output: err.message,
        branch: '',
        githubUrl: null,
      });
      showToast(err.message, 'error');
    }
  };

  // Launch action (code, terminal, explorer)
  const handleAction = async (name, actionType) => {
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(name)}/actions/${actionType}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (actionType === 'open-code') showToast(`Ouverture de VS Code pour ${name}`);
      if (actionType === 'open-terminal') showToast(`Ouverture du Terminal pour ${name}`);
      if (actionType === 'open-explorer') showToast(`Ouverture de l'Explorateur pour ${name}`);
      if (actionType === 'launch-psql') showToast(`🐘 Console PostgreSQL (psql) ouverte pour ${name} !`);
      if (actionType === 'launch-mongosh') showToast(`🍃 Shell MongoDB (mongosh) ouvert pour ${name} !`);
      if (actionType === 'launch-dbeaver') showToast(`🦫 DBeaver Community lancé (environnement isolé) !`);
      if (actionType === 'launch-quiz') showToast(`🎯 QCM Python Scripting lancé dans un terminal !`);
      if (actionType === 'launch-jupyter') showToast(`🪐 JupyterLab lancé pour ${name} !`);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Open Env Modal for specific project
  const handleOpenEnv = (projectName) => {
    setActiveProjectForEnv(projectName);
    setIsEnvOpen(true);
  };

  // Open Logs Modal
  const handleOpenLogs = (projectName) => {
    setActiveProjectForLogs(projectName);
    setIsLogsOpen(true);
  };

  // Open Git Modal
  const handleOpenGit = (projectName) => {
    setActiveProjectForGit(projectName);
    setIsGitOpen(true);
  };

  // Filtering & Sorting
  const filteredProjects = projects.filter(proj => {
    const matchSearch = proj.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proj.types.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchSearch) return false;

    if (filterCategory === 'running') return proj.process?.running;
    if (filterCategory === 'git') return proj.git?.initialized;
    if (filterCategory === 'node') return proj.types.some(t => ['Node.js', 'Express', 'React', 'Vite', 'Next.js'].includes(t));
    if (filterCategory === 'python') return proj.types.some(t => ['Python', 'FastAPI'].includes(t));
    if (filterCategory === 'env') return proj.envFiles.length > 0;

    return true;
  }).sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });

  // Calculate statistics
  const totalProjects = projects.length;
  const runningCount = projects.filter(p => p.process?.running).length;
  const gitCount = projects.filter(p => p.git?.hasRemote).length;

  const currentLogProject = projects.find(p => p.name === activeProjectForLogs);

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100">
      {/* Top Navbar */}
      <Navbar
        onNewProject={() => setIsCreateOpen(true)}
        onOpenSystem={() => setIsSystemOpen(true)}
        onRefresh={() => loadData(false)}
        loading={loading}
        systemInfo={systemInfo}
      />

      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-200">
          <div className={`px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-sm font-medium border ${
            toast.type === 'error'
              ? 'bg-rose-950 border-rose-800 text-rose-200'
              : 'bg-[#0f172a] border-cyan-500/50 text-cyan-200 shadow-cyan-950/50'
          }`}>
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {/* Hub Banner & Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Card 1: Total */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-[#12192a] to-[#0c1220] border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Programmes Détectés
              </span>
              <span className="text-3xl font-extrabold text-white tracking-tight">
                {totalProjects}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <FolderCode className="w-6 h-6" />
            </div>
          </div>

          {/* Card 2: Running Servers */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-[#12192a] to-[#0c1220] border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Serveurs en Ligne
              </span>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-extrabold text-emerald-400 tracking-tight">
                  {runningCount}
                </span>
                {runningCount > 0 && (
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Activity className="w-6 h-6" />
            </div>
          </div>

          {/* Card 3: GitHub Connected */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-[#12192a] to-[#0c1220] border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Dépôts Liés à GitHub
              </span>
              <span className="text-3xl font-extrabold text-cyan-300 tracking-tight">
                {gitCount}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <UploadCloud className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Rechercher un projet, une techno..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#0e1424] border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
            />
          </div>

          {/* Category tabs & Sort */}
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
            <div className="flex items-center bg-[#0e1424] border border-slate-800 rounded-xl p-1 text-xs">
              <button
                onClick={() => setFilterCategory('all')}
                className={`px-3 py-1.5 rounded-lg transition font-medium ${
                  filterCategory === 'all' ? 'bg-slate-800 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Tous
              </button>

              <button
                onClick={() => setFilterCategory('running')}
                className={`px-3 py-1.5 rounded-lg transition font-medium flex items-center gap-1.5 ${
                  filterCategory === 'running' ? 'bg-emerald-500/20 text-emerald-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>En Ligne ({runningCount})</span>
              </button>

              <button
                onClick={() => setFilterCategory('git')}
                className={`px-3 py-1.5 rounded-lg transition font-medium ${
                  filterCategory === 'git' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Git / GitHub
              </button>

              <button
                onClick={() => setFilterCategory('node')}
                className={`px-3 py-1.5 rounded-lg transition font-medium ${
                  filterCategory === 'node' ? 'bg-emerald-500/20 text-emerald-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Node.js
              </button>

              <button
                onClick={() => setFilterCategory('python')}
                className={`px-3 py-1.5 rounded-lg transition font-medium ${
                  filterCategory === 'python' ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Python
              </button>

              <button
                onClick={() => setFilterCategory('env')}
                className={`px-3 py-1.5 rounded-lg transition font-medium ${
                  filterCategory === 'env' ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Avec .env
              </button>
            </div>

            {/* Sort Toggle */}
            <button
              onClick={() => setSortBy(sortBy === 'recent' ? 'name' : 'recent')}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-[#0e1424] border border-slate-800 text-xs font-medium text-slate-400 hover:text-slate-200 transition"
              title="Changer le tri"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>{sortBy === 'recent' ? 'Récents' : 'Nom A-Z'}</span>
            </button>
          </div>
        </div>

        {/* Project Grid or Empty State */}
        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 items-start gap-5">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.name}
                project={project}
                onOpenEnv={handleOpenEnv}
                onDelete={handleDeleteProject}
                onAction={handleAction}
                onToggleProcess={handleToggleProcess}
                onOpenLogs={handleOpenLogs}
                onOpenGit={handleOpenGit}
                onQuickPush={handleQuickPush}
                onQuickPull={handleQuickPull}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 px-6 rounded-3xl border border-dashed border-slate-800/80 bg-gradient-to-b from-[#0e1424]/40 to-transparent">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4 shadow-lg shadow-cyan-500/10">
              <FolderPlus className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-bold text-white mb-2">
              {searchQuery ? 'Aucun projet ne correspond à votre recherche' : 'Bienvenue dans votre DevHub !'}
            </h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
              {searchQuery
                ? 'Essayez de réinitialiser vos critères de recherche ou de filtre pour voir d\'autres projets.'
                : 'Commencez par créer votre premier projet ou installez un template prêt à l\'emploi en quelques clics.'}
            </p>

            {!searchQuery && (
              <button
                onClick={() => setIsCreateOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-sm shadow-lg shadow-cyan-500/20 transition hover:shadow-cyan-500/30"
              >
                <FolderPlus className="w-4 h-4" />
                <span>Créer un premier projet</span>
              </button>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      <CreateProjectModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={handleCreateProject}
        templates={templates}
      />

      <EnvModal
        isOpen={isEnvOpen}
        onClose={() => {
          setIsEnvOpen(false);
          setActiveProjectForEnv(null);
          loadData(true);
        }}
        projectName={activeProjectForEnv}
      />

      <LogsModal
        isOpen={isLogsOpen}
        onClose={() => {
          setIsLogsOpen(false);
          setActiveProjectForLogs(null);
        }}
        projectName={activeProjectForLogs}
        onToggleProcess={handleToggleProcess}
        isRunning={currentLogProject?.process?.running}
        projectUrl={currentLogProject?.process?.url}
        projectPort={currentLogProject?.process?.port}
      />

      <GitModal
        isOpen={isGitOpen}
        onClose={() => {
          setIsGitOpen(false);
          setActiveProjectForGit(null);
          loadData(true);
        }}
        projectName={activeProjectForGit}
        onPushSuccess={() => {
          showToast('🎉 Pushé sur GitHub avec succès !');
          loadData(true);
        }}
      />

      <GitActionLogModal
        isOpen={gitLogModal.isOpen}
        onClose={() => setGitLogModal(prev => ({ ...prev, isOpen: false }))}
        actionType={gitLogModal.actionType}
        projectName={gitLogModal.projectName}
        success={gitLogModal.success}
        message={gitLogModal.message}
        output={gitLogModal.output}
        branch={gitLogModal.branch}
        githubUrl={gitLogModal.githubUrl}
      />

      <SystemInfoModal
        isOpen={isSystemOpen}
        onClose={() => setIsSystemOpen(false)}
        systemInfo={systemInfo}
      />
    </div>
  );
}
