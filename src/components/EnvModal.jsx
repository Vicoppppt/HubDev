import React, { useState, useEffect } from 'react';
import { 
  X, 
  KeyRound, 
  FileText, 
  Save, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  Sparkles, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2,
  FileCode,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';

export default function EnvModal({ isOpen, onClose, projectName }) {
  const [selectedFile, setSelectedFile] = useState('.env');
  const [allFiles, setAllFiles] = useState(['.env']);
  const [mode, setMode] = useState('table'); // 'table' or 'raw'
  const [rawText, setRawText] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [revealAll, setRevealAll] = useState(false);
  const [revealedKeys, setRevealedKeys] = useState({});
  const [copiedKey, setCopiedKey] = useState(null);
  const [newFileName, setNewFileName] = useState('');
  const [showAddFile, setShowAddFile] = useState(false);

  // Load env data whenever modal opens or file changes
  useEffect(() => {
    if (isOpen && projectName) {
      loadEnvData(selectedFile);
    }
  }, [isOpen, projectName, selectedFile]);

  const loadEnvData = async (fileToLoad) => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectName)}/env?file=${encodeURIComponent(fileToLoad)}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Erreur de chargement');

      setRawText(data.raw || '');
      setItems(data.parsed || []);
      setAllFiles(data.allEnvFiles?.length > 0 ? data.allEnvFiles : ['.env']);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Toggle secret visibility for a specific row
  const toggleReveal = (index) => {
    setRevealedKeys(prev => ({ ...prev, [index]: !prev[index] }));
  };

  // Copy to clipboard
  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  // Update a key or value in the items array
  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  // Add new empty key-value variable
  const handleAddVariable = () => {
    setItems([
      ...items,
      {
        type: 'pair',
        key: '',
        value: '',
        isSecret: false,
      }
    ]);
  };

  // Remove a variable
  const handleRemoveVariable = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Save changes
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const payload = {
        filename: selectedFile,
        mode: mode === 'table' ? 'parsed' : 'raw',
        raw: rawText,
        items: items,
      };

      const res = await fetch(`/api/projects/${encodeURIComponent(projectName)}/env`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la sauvegarde');

      setRawText(data.raw);
      setItems(data.parsed);
      setMessage({ type: 'success', text: `Enregistré avec succès dans ${selectedFile} (backup automatique créé)` });
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Generate .env.example
  const handleGenerateExample = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectName)}/env/generate-example`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: selectedFile, target: '.env.example' }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur de génération');

      if (!allFiles.includes('.env.example')) {
        setAllFiles([...allFiles, '.env.example']);
      }

      setMessage({ type: 'success', text: '✨ Fichier .env.example généré sans vos données secrètes !' });
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Create new .env.* file variant
  const handleCreateNewFile = () => {
    if (!newFileName.trim()) return;
    let clean = newFileName.trim();
    if (!clean.startsWith('.env')) {
      clean = '.env.' + clean;
    }

    if (!allFiles.includes(clean)) {
      setAllFiles([...allFiles, clean]);
    }
    setSelectedFile(clean);
    setShowAddFile(false);
    setNewFileName('');
    setRawText('# Nouveau fichier ' + clean + '\n');
    setItems([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl bg-[#0f1626] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-[#0d1322] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">Variables d'environnement</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {projectName}
                </span>
              </div>
              <p className="text-xs text-slate-400">Gérez vos clés d'API, configurations et secrets en toute sécurité</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: File selector & view mode */}
        <div className="px-6 py-3 border-b border-slate-800/80 bg-[#0b101c] flex flex-wrap items-center justify-between gap-3">
          {/* File selector pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {allFiles.map((file) => (
              <button
                key={file}
                onClick={() => setSelectedFile(file)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition flex items-center gap-1.5 border ${
                  selectedFile === file
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm shadow-amber-500/10'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>{file}</span>
              </button>
            ))}

            {!showAddFile ? (
              <button
                onClick={() => setShowAddFile(true)}
                className="px-2.5 py-1.5 rounded-lg border border-dashed border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white text-xs transition flex items-center gap-1"
                title="Créer un nouveau fichier .env"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Fichier</span>
              </button>
            ) : (
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg p-1">
                <input
                  type="text"
                  placeholder=".env.local"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className="bg-transparent text-xs text-white px-2 py-0.5 focus:outline-none w-28 font-mono"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateNewFile()}
                />
                <button
                  onClick={handleCreateNewFile}
                  className="px-2 py-0.5 bg-amber-500 hover:bg-amber-400 text-[#090d16] rounded font-bold text-xs"
                >
                  OK
                </button>
                <button
                  onClick={() => setShowAddFile(false)}
                  className="px-1.5 py-0.5 text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Controls: Mode switcher & Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateExample}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-semibold transition"
              title="Générer un .env.example avec secrets masqués"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Générer .env.example</span>
            </button>

            {/* Mode toggle */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => setMode('table')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                  mode === 'table' ? 'bg-slate-800 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Clé-Valeur
              </button>
              <button
                onClick={() => setMode('raw')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                  mode === 'raw' ? 'bg-slate-800 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Texte Brut
              </button>
            </div>
          </div>
        </div>

        {/* Status / Notifications */}
        {message && (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{message.text}</span>
          </div>
        )}

        {error && (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="h-full flex items-center justify-center text-slate-500 text-sm gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
              <span>Chargement du fichier d'environnement...</span>
            </div>
          ) : mode === 'table' ? (
            /* Table Mode */
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Variables détectées ({items.filter(i => i.type === 'pair').length})
                </span>
                <button
                  type="button"
                  onClick={() => setRevealAll(!revealAll)}
                  className="text-xs text-slate-400 hover:text-amber-400 transition flex items-center gap-1"
                >
                  {revealAll ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{revealAll ? 'Masquer les secrets' : 'Tout afficher'}</span>
                </button>
              </div>

              {items.filter(i => i.type === 'pair').length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl bg-slate-900/20">
                  <KeyRound className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm font-medium">Aucune variable d'environnement trouvée</p>
                  <p className="text-slate-500 text-xs mt-1">Commencez par en ajouter une ci-dessous</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {items.map((item, idx) => {
                    if (item.type !== 'pair') return null;
                    const isVisible = revealAll || revealedKeys[idx] || !item.isSecret;

                    return (
                      <div
                        key={idx}
                        className="group flex items-center gap-2 p-2 rounded-xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700 transition"
                      >
                        {/* Key */}
                        <div className="w-2/5 min-w-[160px]">
                          <input
                            type="text"
                            value={item.key}
                            onChange={(e) => handleItemChange(idx, 'key', e.target.value)}
                            placeholder="CLE_VARIABLE"
                            className="w-full bg-[#090d16] border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono font-semibold text-amber-300 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        <span className="text-slate-600 font-mono font-bold">=</span>

                        {/* Value */}
                        <div className="flex-1 relative">
                          <input
                            type={isVisible ? 'text' : 'password'}
                            value={item.value || ''}
                            onChange={(e) => handleItemChange(idx, 'value', e.target.value)}
                            placeholder="valeur"
                            className="w-full bg-[#090d16] border border-slate-800 rounded-lg pl-3 pr-16 py-2 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                          />

                          {/* Reveal / Copy Icons inside input */}
                          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                            {item.isSecret && (
                              <button
                                type="button"
                                onClick={() => toggleReveal(idx)}
                                title={isVisible ? 'Masquer la valeur' : 'Révéler la valeur'}
                                className="p-1 rounded text-slate-400 hover:text-white transition"
                              >
                                {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => copyToClipboard(item.value || '', item.key)}
                              title="Copier la valeur"
                              className="p-1 rounded text-slate-400 hover:text-cyan-400 transition"
                            >
                              {copiedKey === item.key ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Remove */}
                        <button
                          type="button"
                          onClick={() => handleRemoveVariable(idx)}
                          title="Supprimer cette variable"
                          className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add row button */}
              <button
                type="button"
                onClick={handleAddVariable}
                className="w-full py-2.5 rounded-xl border border-dashed border-slate-800 hover:border-amber-500/50 hover:bg-amber-500/5 text-slate-400 hover:text-amber-400 text-xs font-semibold transition flex items-center justify-center gap-2 mt-3"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter une variable</span>
              </button>
            </div>
          ) : (
            /* Raw Text Mode */
            <div className="h-full flex flex-col">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Éditeur de fichier brut ({selectedFile})
              </label>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="# Commentaires supportés&#10;CLE=valeur&#10;AUTRE_CLE=123"
                className="w-full flex-1 min-h-[360px] p-4 rounded-xl bg-[#090d16] border border-slate-800 text-slate-200 font-mono text-xs leading-relaxed focus:outline-none focus:border-amber-500 resize-none selection:bg-amber-500/30"
                spellCheck={false}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-[#0d1322] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Sauvegarde automatique (.env.backup) créée à chaque enregistrement</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition"
            >
              Fermer
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-[#090d16] font-bold text-xs shadow-lg shadow-amber-500/20 transition flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4 stroke-[2.5]" />
              <span>{saving ? 'Enregistrement...' : 'Enregistrer'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
