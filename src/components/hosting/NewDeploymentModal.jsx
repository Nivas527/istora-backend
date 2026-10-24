import React, { useState } from 'react';
import { deploymentTemplates } from '../../data/initialDeployments';
import { extractDistZip, createSampleDistZip } from '../../services/zipExtractor';
import {
  X,
  UploadCloud,
  FileCode,
  Sparkles,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Terminal,
  FileArchive,
  Download,
  FolderOpen
} from 'lucide-react';

export default function NewDeploymentModal({ onClose, onDeploy }) {
  // Default to 'zip' method so deploying dist.zip is the primary workflow!
  const [deployMethod, setDeployMethod] = useState('zip'); // 'zip' | 'template' | 'custom'
  const [appName, setAppName] = useState('my-dist-app');
  const [environment, setEnvironment] = useState('production');
  const [envVars, setEnvVars] = useState([{ key: 'NEXT_PUBLIC_STOREFRONT_ENV', value: 'production' }]);

  // Zip extraction state
  const [extractedData, setExtractedData] = useState(null);
  const [isExtractingZip, setIsExtractingZip] = useState(false);
  const [zipFileName, setZipFileName] = useState('');
  const [zipError, setZipError] = useState('');

  // Template / custom code state
  const [selectedTemplateId, setSelectedTemplateId] = useState(deploymentTemplates[0].id);
  const [customCode, setCustomCode] = useState(deploymentTemplates[0].defaultFiles['App.jsx']);

  // Deployment progress
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployProgress, setDeployProgress] = useState(0);
  const [deployStepMessage, setDeployStepMessage] = useState('');

  // Handle dist.zip File Drop or Input
  const handleZipFile = async (file) => {
    if (!file) return;
    setZipFileName(file.name);
    setZipError('');
    setIsExtractingZip(true);

    try {
      const data = await extractDistZip(file);
      setExtractedData(data);

      // Auto-suggest app name from zip
      const baseName = file.name.replace(/\.zip$/i, '').toLowerCase().replace(/[^a-z0-9-]/g, '-');
      const suggestedName = (baseName === 'dist' || baseName === 'build') 
        ? 'react-store-' + Math.floor(Math.random() * 899 + 100) 
        : baseName;
      setAppName(suggestedName);
    } catch (err) {
      console.error('Zip extraction error:', err);
      setZipError(err.message || 'Failed to extract dist.zip');
    } finally {
      setIsExtractingZip(false);
    }
  };

  // 1-Click Demo dist.zip Generator
  const handleGenerateSampleZip = async () => {
    setIsExtractingZip(true);
    setZipError('');
    try {
      const blob = await createSampleDistZip();
      setZipFileName('sample-apex-dist.zip');
      const data = await extractDistZip(blob);
      setExtractedData(data);
      setAppName('apex-dist-release-' + Math.floor(Math.random() * 899 + 100));
    } catch (err) {
      setZipError('Failed to generate sample zip: ' + err.message);
    } finally {
      setIsExtractingZip(false);
    }
  };

  // Download the sample dist.zip
  const handleDownloadSampleZip = async (e) => {
    e.stopPropagation();
    try {
      const blob = await createSampleDistZip();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'dist.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Error downloading sample: ' + err.message);
    }
  };

  const handleSelectTemplate = (tpl) => {
    setSelectedTemplateId(tpl.id);
    setAppName(tpl.id.replace('tpl_', '').replace('_', '-') + '-' + Math.floor(Math.random() * 899 + 100));
    setCustomCode(tpl.defaultFiles['App.jsx']);
  };

  const addEnvVar = () => {
    setEnvVars([...envVars, { key: '', value: '' }]);
  };

  const removeEnvVar = (index) => {
    setEnvVars(envVars.filter((_, i) => i !== index));
  };

  const updateEnvVar = (index, field, val) => {
    setEnvVars(envVars.map((item, i) => (i === index ? { ...item, [field]: val } : item)));
  };

  const handleStartDeploy = async () => {
    if (deployMethod === 'zip' && !extractedData) {
      setZipError('Please upload or generate a dist.zip file first.');
      return;
    }

    setIsDeploying(true);

    const steps = [
      { progress: 20, msg: 'Validating static artifacts and entry points...' },
      { progress: 45, msg: 'Hashing asset chunks and compiling edge route manifest...' },
      { progress: 70, msg: 'Injecting Storefront Context & SPA routing rewrites...' },
      { progress: 90, msg: 'Distributing dist assets across 32 worldwide edge nodes...' },
      { progress: 100, msg: 'Deployment live! Edge CDN operational.' }
    ];

    for (const step of steps) {
      setDeployProgress(step.progress);
      setDeployStepMessage(step.msg);
      await new Promise((r) => setTimeout(r, 350));
    }

    const finalEnv = {};
    envVars.forEach((ev) => {
      if (ev.key.trim()) finalEnv[ev.key.trim()] = ev.value;
    });

    const slug = appName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const deploymentId = `dep_dist_${Date.now()}`;

    const files = deployMethod === 'zip' && extractedData
      ? extractedData.files
      : { 'App.jsx': customCode };

    const totalKb = deployMethod === 'zip' && extractedData
      ? Math.round(extractedData.totalSizeBytes / 1024)
      : Math.floor(Math.random() * 40 + 35);

    const fileCount = deployMethod === 'zip' && extractedData
      ? extractedData.fileCount
      : 1;

    const newDeployment = {
      id: deploymentId,
      name: slug,
      project: slug,
      subdomain: `${slug}.vercel.app`,
      liveUrl: `https://${slug}.vercel.app`,
      status: 'READY',
      environment,
      isDistZip: deployMethod === 'zip',
      commit: {
        hash: Math.random().toString(16).substring(2, 9),
        message: deployMethod === 'zip'
          ? `deploy: dist.zip bundle (${fileCount} static assets, ${totalKb} kB)`
          : `deploy: source React component (${deployMethod})`,
        author: 'developer',
        branch: environment === 'production' ? 'main' : 'release/dist'
      },
      framework: deployMethod === 'zip' ? 'React 19 (Extracted dist.zip)' : 'React 19 (Zero-Config JSX)',
      nodeVersion: '20.x',
      region: 'iad1 (Washington, D.C.)',
      createdAt: new Date().toISOString(),
      buildDurationMs: 1120,
      bundleSizeKb: totalKb,
      envVars: finalEnv,
      files,
      logs: [
        { timestamp: '00:00.010', level: 'info', message: `Build initialized for ${slug}` },
        { timestamp: '00:00.120', level: 'info', message: deployMethod === 'zip' ? `Unpacked dist.zip archive (${fileCount} files)` : 'Parsed React 19 component source' },
        { timestamp: '00:00.320', level: 'info', message: 'Injected SPA fallback routing: /* -> /index.html' },
        { timestamp: '00:00.680', level: 'info', message: `Static bundle generated: ${totalKb} kB` },
        { timestamp: '00:01.120', level: 'success', message: `Deployment live: https://${slug}.vercel.app` }
      ]
    };

    // Synchronously sync with server cache so /hosted/:id and assets are ready immediately
    try {
      await fetch('/api/deployments/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deployment: newDeployment })
      });
    } catch (e) {
      console.warn('Server save warning:', e);
    }

    onDeploy(newDeployment);
    setIsDeploying(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl text-zinc-100 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white text-zinc-950 font-black flex items-center justify-center text-sm shadow-md">
              ▲
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <span>Deploy React Application</span>
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-mono px-2 py-0.5 rounded-full border border-emerald-500/30">
                  dist.zip Engine
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Drop your built <code className="text-emerald-400 font-mono">dist.zip</code> and host it directly like Vercel
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isDeploying}
            className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {isDeploying ? (
            <div className="py-12 space-y-6 text-center">
              <div className="w-16 h-16 mx-auto rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white">Deploying to Global Edge...</h3>
                <p className="text-xs text-zinc-400 font-mono">{deployStepMessage}</p>
              </div>
              <div className="w-full max-w-md mx-auto bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full transition-all duration-300"
                  style={{ width: `${deployProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <>
              {/* Method Switcher */}
              <div className="grid grid-cols-3 gap-2 bg-zinc-950 p-1.5 rounded-xl border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setDeployMethod('zip')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                    deployMethod === 'zip' ? 'bg-emerald-500 text-zinc-950 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <FileArchive className="w-4 h-4" />
                  <span>Deploy dist.zip</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeployMethod('template')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                    deployMethod === 'template' ? 'bg-zinc-800 text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>From Template</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeployMethod('custom')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                    deployMethod === 'custom' ? 'bg-zinc-800 text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                  <span>JSX Source</span>
                </button>
              </div>

              {/* METHOD 1: DIST.ZIP UPLOADER & EXTRACTOR */}
              {deployMethod === 'zip' && (
                <div className="space-y-4">
                  {/* Dropzone */}
                  <label
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (e.dataTransfer.files?.[0]) handleZipFile(e.dataTransfer.files[0]);
                    }}
                    className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${
                      extractedData
                        ? 'border-emerald-500/80 bg-emerald-500/5'
                        : 'border-zinc-750 hover:border-emerald-500 bg-zinc-950/60'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-emerald-400 mb-3 shadow-md">
                      <FileArchive className="w-6 h-6" />
                    </div>

                    <span className="text-sm font-bold text-white text-center">
                      {zipFileName ? `Selected: ${zipFileName}` : 'Drop dist.zip file here, or click to browse'}
                    </span>
                    <p className="text-xs text-zinc-400 mt-1 text-center">
                      Accepts standard production build zip files (<code className="text-zinc-300 font-mono">npm run build</code> output)
                    </p>

                    <input
                      type="file"
                      accept=".zip,application/zip"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleZipFile(e.target.files[0]);
                      }}
                      className="hidden"
                    />

                    {/* Quick Demo Button inside Dropzone */}
                    <div className="mt-4 flex flex-wrap gap-2 items-center justify-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={handleGenerateSampleZip}
                        disabled={isExtractingZip}
                        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-emerald-400 text-xs font-bold rounded-lg border border-emerald-500/30 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>⚡ 1-Click: Load Sample dist.zip</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleDownloadSampleZip}
                        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-lg border border-zinc-700 flex items-center gap-1.5 transition-all cursor-pointer"
                        title="Download sample dist.zip to your computer to test drag and drop"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download dist.zip</span>
                      </button>
                    </div>
                  </label>

                  {/* Extracting Spinner */}
                  {isExtractingZip && (
                    <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center gap-3">
                      <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs text-zinc-300 font-mono">
                        Extracting and validating dist.zip archive...
                      </span>
                    </div>
                  )}

                  {/* Extraction Error */}
                  {zipError && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-400 text-xs">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{zipError}</span>
                    </div>
                  )}

                  {/* Extracted Asset Manifest Preview */}
                  {extractedData && (
                    <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-bold text-white">
                            Successfully Unpacked ({extractedData.fileCount} Assets)
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-emerald-400 font-bold">
                          Total: {(extractedData.totalSizeBytes / 1024).toFixed(1)} kB
                        </span>
                      </div>

                      {/* Immediate Launch Card */}
                      <div className="bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-teal-500/10 border border-emerald-500/50 p-3.5 rounded-xl flex items-center justify-between shadow-lg">
                        <div>
                          <p className="text-xs font-black text-white flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            Assets Ready to Host Live
                          </p>
                          <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                            Entry: {extractedData.entryPoint} • Target: {appName}.vercel.app
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleStartDeploy}
                          className="px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95 animate-pulse"
                        >
                          <span>🚀 Launch & Deploy Now</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* File Manifest List */}
                      <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 divide-y divide-zinc-900 font-mono text-xs">
                        {extractedData.manifest.slice(0, 8).map((file) => (
                          <div key={file.path} className="pt-1.5 flex items-center justify-between text-zinc-400">
                            <span className="text-zinc-200 truncate max-w-sm flex items-center gap-1.5">
                              <FileCode className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                              {file.path}
                            </span>
                            <span className="text-[10px] text-zinc-500 shrink-0">
                              {(file.size / 1024).toFixed(1)} kB
                            </span>
                          </div>
                        ))}
                        {extractedData.manifest.length > 8 && (
                          <div className="pt-1 text-[11px] text-zinc-500 font-mono">
                            + {extractedData.manifest.length - 8} more asset files
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* METHOD 2: TEMPLATES */}
              {deployMethod === 'template' && (
                <div className="space-y-3">
                  <label className="text-xs font-bold text-zinc-300">Select Starter Template</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {deploymentTemplates.map((tpl) => (
                      <div
                        key={tpl.id}
                        onClick={() => handleSelectTemplate(tpl)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                          selectedTemplateId === tpl.id
                            ? 'bg-zinc-800/80 border-emerald-500 shadow-md ring-1 ring-emerald-500/50'
                            : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-white">{tpl.title}</span>
                          <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-mono">
                            {tpl.tag}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                          {tpl.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* METHOD 3: RAW JSX */}
              {deployMethod === 'custom' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-300">App.jsx Code</label>
                    <span className="text-[11px] text-zinc-500 font-mono">React 19 + Tailwind</span>
                  </div>
                  <textarea
                    rows={8}
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs font-mono text-zinc-200 focus:outline-none focus:border-emerald-500 selection:bg-zinc-800"
                    placeholder="function App() { return <h1>Hello</h1>; }"
                  />
                </div>
              )}

              {/* General Project Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-zinc-800">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300">Deployment Slug / Name</label>
                  <input
                    type="text"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    placeholder="my-dist-app"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-zinc-500 font-mono">
                    Live URL: {appName.toLowerCase().replace(/[^a-z0-9-]/g, '-') || 'app'}.vercel.app
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300">Environment Target</label>
                  <select
                    value={environment}
                    onChange={(e) => setEnvironment(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="production">Production (Main Branch)</option>
                    <option value="preview">Preview (Release Branch)</option>
                  </select>
                </div>
              </div>

              {/* Environment Variables */}
              <div className="space-y-3 pt-2 border-t border-zinc-800/80">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-300">Environment Variables</h4>
                    <p className="text-[11px] text-zinc-500">Injected into window.process.env</p>
                  </div>
                  <button
                    type="button"
                    onClick={addEnvVar}
                    className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Variable</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {envVars.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={item.key}
                        onChange={(e) => updateEnvVar(idx, 'key', e.target.value)}
                        placeholder="KEY (e.g. API_URL)"
                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                      />
                      <input
                        type="text"
                        value={item.value}
                        onChange={(e) => updateEnvVar(idx, 'value', e.target.value)}
                        placeholder="VALUE"
                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                      />
                      {envVars.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeEnvVar(idx)}
                          className="p-1.5 text-zinc-500 hover:text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!isDeploying && (
          <div className="p-4 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-between">
            <span className="text-[11px] text-zinc-500 font-mono">
              {deployMethod === 'zip' && extractedData
                ? `Ready to host ${extractedData.fileCount} extracted assets`
                : 'Zero-config Vercel edge deployment'}
            </span>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartDeploy}
                className="px-5 py-2 bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-black rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <span>Deploy to Vercel</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
