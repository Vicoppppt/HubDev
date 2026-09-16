import React, { useState, useEffect } from 'react';
import { 
  X, 
  GitBranch, 
  UploadCloud, 
  DownloadCloud, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Link2, 
  RefreshCw, 
  ShieldCheck,
  PlusCircle,
  Key,
  Lock,
  Globe2,
  Trash2,
  Sparkles,
  UserCheck
} from 'lucide-react';

export default function GitModal({ isOpen, onClose, projectName, onPushSuccess }) {
  const [gitData, setGitData] = useState(null);
  const [githubConfig, setGithubConfig] = useState(null);
  const [remoteInput, setRemoteInput] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);

  // New repo creation form
  const [repoName, setRepoName] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);
  const [repoDesc, setRepoDesc] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(false);

  const fetchStatusAndConfig = async () => {
    if (!projectName) return;
    setLoading(true);
    setError(null);

    try {
      const [gitRes, cfgRes] = await Promise.all([
        fetch(`/api/projects/${encodeURIComponent(projectName)}/git/status`),
        fetch('/api/github/config'),
      ]);

      const git = await gitRes.json();
      const cfg = await cfgRes.json();

      setGitData(git);
      setGithubConfig(cfg);
      setRepoName(projectName);
      setRepoDesc(`Projet ${projectName} créé avec DevHub`);

      if (git.remoteUrl) {
        setRemoteInput(git.remoteUrl);
      } else {
        setRemoteInput('');
      }

      const now = new Date();
      const dateStr = now.toLocaleDateString('fr-FR');
      const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      setCommitMessage(`Mise à jour du ${dateStr} à ${timeStr}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && projectName) {
      setFeedback(null);
      setError(null);
      fetchStatusAndConfig();
    }
  }, [isOpen, projectName]);

  if (!isOpen) return null;

  // Save Token
  const handleSaveToken = async () => {
    if (!tokenInput.trim()) return;
    setActionLoading(true);
    setError(null);
    setFeedback(null);

    try {
      const res = await fetch('/api/github/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setGithubConfig({ hasToken: true, username: data.username, avatarUrl: data.avatarUrl });
      setShowTokenInput(false);
      setTokenInput('');
      setFeedback({ type: 'success', text: `Connecté à GitHub en tant que @${data.username} !` });
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // 1-Click Create Repo on GitHub & Push
  const handleCreateRepoAndPush = async () => {
    setActionLoading(true);
    setError(null);
    setFeedback(null);

    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectName)}/git/create-github-repo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoName: repoName.trim() || projectName,
          isPrivate,
          description: repoDesc.trim(),
          token: tokenInput.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.needToken) {
          setShowTokenInput(true);
        }
        throw new Error(data.error || 'Erreur lors de la création du dépôt GitHub');
      }

      setFeedback({ type: 'success', text: data.message });
      if (onPushSuccess) onPushSuccess(projectName);
      await fetchStatusAndConfig();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Remove remote
  const handleRemoveRemote = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectName)}/git/remove-remote`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setRemoteInput('');
      setFeedback({ type: 'success', text: 'Lien GitHub dissocié. Vous pouvez le recréer proprement.' });
      await fetchStatusAndConfig();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Set manual remote
  const handleSaveRemote = async () => {
    if (!remoteInput.trim()) return;
    setActionLoading(true);
    setError(null);
    setFeedback(null);

    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectName)}/git/set-remote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remoteUrl: remoteInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setFeedback({ type: 'success', text: 'Dépôt GitHub configuré avec succès !' });
      await fetchStatusAndConfig();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Standard Push
  const handlePush = async () => {
    setActionLoading(true);
    setError(null);
    setFeedback(null);

    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectName)}/git/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: commitMessage.trim(),
          remoteUrl: remoteInput.trim() || undefined
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.notFound || data.needCreation) {
          setError('Le dépôt distant n\'existe pas encore sur votre compte GitHub. Utilisez le bouton ci-dessous pour le créer automatiquement.');
          return;
        }
        if (data.needRemote) {
          setError(data.message);
          return;
        }
        throw new Error(data.error || 'Erreur lors du push GitHub');
      }

      setFeedback({ 
        type: 'success', 
        text: data.message,
        details: data.output 
      });

      if (onPushSuccess) onPushSuccess(projectName);
      await fetchStatusAndConfig();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Pull
  const handlePull = async () => {
    setActionLoading(true);
    setError(null);
    setFeedback(null);

    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectName)}/git/pull`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setFeedback({ type: 'success', text: 'Pull terminé avec succès !' });
      await fetchStatusAndConfig();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-[#0f1626] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-[#0d1322] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">Synchronisation GitHub</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 font-mono font-semibold">
                  {projectName}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  main
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {gitData?.hasRemote ? 'Gérez et poussez vos modifications vers GitHub' : 'Créez ou reliez votre dépôt GitHub'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {gitData?.githubUrl && (
              <a
                href={gitData.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                title="Ouvrir le dépôt sur GitHub.com"
              >
                <span>GitHub.com</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Notifications */}
          {feedback && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{feedback.text}</span>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Creation of Repo on GitHub (if no remote or if remote was not found) */}
          {!gitData?.hasRemote ? (
            <div className="p-5 rounded-2xl bg-gradient-to-b from-cyan-950/20 to-slate-900/60 border border-cyan-500/30 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Créer le dépôt directement sur GitHub</h3>
                    <p className="text-xs text-slate-400">DevHub crée le dépôt sur votre compte GitHub et pousse le code en 1 clic</p>
                  </div>
                </div>

                {githubConfig?.hasToken && (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>@{githubConfig.username}</span>
                  </span>
                )}
              </div>

              {/* Token Setup form if not saved */}
              {(!githubConfig?.hasToken || showTokenInput) && (
                <div className="p-3.5 rounded-xl bg-[#090d16] border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-amber-400" />
                      <span>Votre Personal Access Token GitHub (PAT)</span>
                    </label>
                    <a
                      href="https://github.com/settings/tokens/new?scopes=repo&description=DevHub"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      <span>Générer un token sur GitHub</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      type="button"
                      onClick={handleSaveToken}
                      disabled={actionLoading || !tokenInput.trim()}
                      className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition disabled:opacity-50"
                    >
                      Enregistrer
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Nécessite la coche <code className="text-slate-300 font-mono">repo</code> pour créer des dépôts publics ou privés en votre nom.
                  </p>
                </div>
              )}

              {/* Repo Details Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nom du repository sur GitHub
                  </label>
                  <input
                    type="text"
                    value={repoName}
                    onChange={(e) => setRepoName(e.target.value)}
                    placeholder={projectName}
                    className="w-full px-3 py-2 rounded-xl bg-[#090d16] border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Visibilité
                  </label>
                  <div className="flex items-center gap-2 bg-[#090d16] p-1 rounded-xl border border-slate-700">
                    <button
                      type="button"
                      onClick={() => setIsPrivate(true)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1 rounded-lg text-xs font-semibold transition ${
                        isPrivate ? 'bg-slate-800 text-cyan-300 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Privé (recommandé)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPrivate(false)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1 rounded-lg text-xs font-semibold transition ${
                        !isPrivate ? 'bg-slate-800 text-cyan-300 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Globe2 className="w-3.5 h-3.5" />
                      <span>Public</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Create & Push Big Button */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5 justify-between">
                <button
                  type="button"
                  onClick={handleCreateRepoAndPush}
                  disabled={actionLoading}
                  className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/25 transition disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Créer le Dépôt sur GitHub & Pusher Tout (main)</span>
                </button>

                <a
                  href={`https://github.com/new?name=${encodeURIComponent(projectName)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition flex items-center gap-1.5 shrink-0"
                  title="Ouvrir GitHub pour créer le dépôt manuellement"
                >
                  <span>Créer manuellement sur GitHub.com</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ) : (
            /* If remote is already linked */
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Dépôt GitHub Lié (Remote Origin)</span>
                </label>

                <button
                  type="button"
                  onClick={handleRemoveRemote}
                  disabled={actionLoading}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 hover:underline"
                  title="Dissocier pour recréer ou changer l'adresse"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Dissocier ce dépôt</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={remoteInput}
                  onChange={(e) => setRemoteInput(e.target.value)}
                  className="flex-1 px-3.5 py-2 rounded-xl bg-[#090d16] border border-slate-700/80 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={handleSaveRemote}
                  disabled={actionLoading || !remoteInput.trim()}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition disabled:opacity-50 shrink-0"
                >
                  Mettre à jour
                </button>
              </div>
            </div>
          )}

          {/* Modified Files Summary */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Fichiers modifiés ({gitData?.changes?.length || 0})
              </span>
              <button
                onClick={fetchStatusAndConfig}
                className="text-xs text-slate-500 hover:text-slate-300 transition flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                <span>Rafraîchir</span>
              </button>
            </div>

            {gitData?.changes?.length > 0 ? (
              <div className="max-h-36 overflow-y-auto rounded-xl border border-slate-800 bg-[#090d16] p-2 divide-y divide-slate-800/60 font-mono text-xs">
                {gitData.changes.map((item, idx) => (
                  <div key={idx} className="py-1.5 px-2 flex items-center justify-between">
                    <span className="text-slate-300 truncate">{item.file}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {item.state || 'modifié'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-slate-800 bg-slate-900/20 text-center text-xs text-slate-400">
                ✅ Répertoire propre. Aucun fichier en attente de commit.
              </div>
            )}
          </div>

          {/* Commit Message Box */}
          {gitData?.hasRemote && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Message du commit
              </label>
              <input
                type="text"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="Description de vos modifications..."
                className="w-full px-4 py-2.5 rounded-xl bg-[#090d16] border border-slate-700/80 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          )}

          {/* Security alert */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Sécurité active : vos fichiers <code className="text-emerald-300">.env</code>, mots de passe et clés secrètes sont automatiquement exclus et jamais envoyés sur GitHub.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-[#0d1322] flex items-center justify-between gap-3">
          {gitData?.hasRemote ? (
            <button
              type="button"
              onClick={handlePull}
              disabled={actionLoading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition"
              title="Récupérer les derniers changements depuis GitHub"
            >
              <DownloadCloud className="w-4 h-4 text-cyan-400" />
              <span>Pull (Récupérer)</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition"
            >
              Fermer
            </button>

            {gitData?.hasRemote && (
              <button
                type="button"
                onClick={handlePush}
                disabled={actionLoading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/25 transition disabled:opacity-50"
              >
                {actionLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Push en cours...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>🚀 Push sur GitHub (main)</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
