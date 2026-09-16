import React from 'react';
import { 
  X, 
  Terminal, 
  CheckCircle2, 
  AlertCircle, 
  UploadCloud, 
  DownloadCloud, 
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';

export default function GitActionLogModal({ 
  isOpen, 
  onClose, 
  actionType = 'push',
  projectName = '', 
  success = true, 
  message = '', 
  output = '', 
  branch = '', 
  githubUrl = null 
}) {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isPush = actionType === 'push';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="relative w-full max-w-2xl bg-[#0d1322] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800/80 bg-[#090d16] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              success 
                ? (isPush ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400')
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}>
              {isPush ? <UploadCloud className="w-5 h-5" /> : <DownloadCloud className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  {isPush ? 'Rapport Git Push' : 'Rapport Git Pull'}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700">
                  {projectName}
                </span>
                {branch && (
                  <span className="text-[11px] px-2 py-0.5 rounded-md font-mono bg-cyan-950/40 text-cyan-300 border border-cyan-800/40">
                    branch: {branch}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {success ? 'Opération terminée avec succès' : 'Une erreur est survenue lors de l\'opération'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Status Message Banner */}
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${
            success 
              ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/25 text-rose-300'
          }`}>
            {success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="text-xs font-medium space-y-1">
              <div>{message || (success ? 'Opération effectuée' : 'Échec de la commande Git')}</div>
              {githubUrl && (
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 hover:underline pt-1"
                >
                  <span>Voir le dépôt sur GitHub</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>

          {/* Terminal Logs Output */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                <span>Sortie détaillée de la console Git</span>
              </div>
              {output && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 bg-slate-800/80 px-2 py-1 rounded-md transition"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copié</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copier le log</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="p-4 rounded-xl bg-[#060a12] border border-slate-800/90 font-mono text-xs text-slate-300 overflow-x-auto max-h-64 whitespace-pre-wrap leading-relaxed selection:bg-cyan-500/30">
              {output ? (
                output
              ) : (
                <span className="text-slate-500 italic">Aucune sortie de commande retournée.</span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800/80 bg-[#090d16] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
