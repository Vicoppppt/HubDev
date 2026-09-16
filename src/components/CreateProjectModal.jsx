import React, { useState, useEffect } from 'react';
import { 
  X, 
  FolderPlus, 
  GitBranch, 
  KeyRound, 
  Server, 
  Terminal, 
  Zap, 
  Layout, 
  Globe, 
  Folder,
  Check,
  AlertCircle
} from 'lucide-react';

export default function CreateProjectModal({ isOpen, onClose, onCreate, templates }) {
  const [name, setName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('node-express');
  const [initGit, setInitGit] = useState(true);
  const [includeEnv, setIncludeEnv] = useState(true);
  const [port, setPort] = useState('3000');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setSelectedTemplate('node-express');
      setInitGit(true);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Veuillez spécifier un nom de projet');
      return;
    }

    setLoading(true);
    setError(null);

    const customEnv = {};
    if (includeEnv && port) {
      customEnv.PORT = port;
    }

    try {
      await onCreate({
        name: name.trim(),
        templateId: selectedTemplate,
        initGit,
        customEnv,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Erreur lors de la création du projet');
    } finally {
      setLoading(false);
    }
  };

  const getTemplateIcon = (iconName) => {
    switch (iconName) {
      case 'Server': return <Server className="w-5 h-5 text-emerald-400" />;
      case 'Terminal': return <Terminal className="w-5 h-5 text-amber-400" />;
      case 'Zap': return <Zap className="w-5 h-5 text-yellow-400" />;
      case 'Layout': return <Layout className="w-5 h-5 text-cyan-400" />;
      case 'Globe': return <Globe className="w-5 h-5 text-blue-400" />;
      default: return <Folder className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-[#0f1626] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Créer un nouveau projet</h2>
              <p className="text-xs text-slate-400">Ajouter un programme dans votre répertoire de travail</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Project Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Nom du projet / dossier
            </label>
            <input
              type="text"
              required
              placeholder="ex: mon-super-projet, api-backend, automation-script"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#090d16] border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono text-sm transition"
              autoFocus
            />
            <p className="text-xs text-slate-500 mt-1.5">
              Le dossier sera créé dans : <span className="text-slate-300 font-mono">Programmes\{name || 'nom-du-projet'}</span>
            </p>
          </div>

          {/* Template Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2.5">
              Choisir un Template
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {templates.map((tpl) => {
                const isSelected = selectedTemplate === tpl.id;
                return (
                  <div
                    key={tpl.id}
                    onClick={() => setSelectedTemplate(tpl.id)}
                    className={`relative p-3.5 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                      isSelected
                        ? 'bg-cyan-950/20 border-cyan-500 ring-1 ring-cyan-500/50'
                        : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-slate-800/80 shrink-0 mt-0.5">
                      {getTemplateIcon(tpl.icon)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-sm text-slate-200 truncate">
                          {tpl.name}
                        </span>
                        {isSelected && (
                          <span className="w-4 h-4 rounded-full bg-cyan-500 text-[#090d16] flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
                        {tpl.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Configuration Options */}
          <div className="pt-2 border-t border-slate-800/80 space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Options d'initialisation
            </label>

            {/* Git Init */}
            <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/40 border border-slate-800/60 cursor-pointer hover:bg-slate-900/80 transition">
              <input
                type="checkbox"
                checked={initGit}
                onChange={(e) => setInitGit(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500"
              />
              <div className="flex items-center gap-2 text-sm text-slate-200">
                <GitBranch className="w-4 h-4 text-cyan-400" />
                <span>Initialiser un dépôt Git local (<code className="text-xs text-slate-400">git init</code>)</span>
              </div>
            </label>

            {/* .env pre-configuration */}
            <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/40 border border-slate-800/60 cursor-pointer hover:bg-slate-900/80 transition">
              <input
                type="checkbox"
                checked={includeEnv}
                onChange={(e) => setIncludeEnv(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500"
              />
              <div className="flex items-center gap-2 text-sm text-slate-200">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span>Générer automatiquement les fichiers <code className="text-xs text-slate-400">.env</code> & <code className="text-xs text-slate-400">.env.example</code></span>
              </div>
            </label>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-[#0b101c] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !name.trim()}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-sm shadow-lg shadow-cyan-500/25 transition disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Création en cours...</span>
              </>
            ) : (
              <span>Créer le Projet</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
