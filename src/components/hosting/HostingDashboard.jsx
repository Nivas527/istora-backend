import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import GlobalHeader from '../common/GlobalHeader';
import NewDeploymentModal from './NewDeploymentModal';
import HostedAppRunner from './HostedAppRunner';
import { buildHostedHtmlBundle } from '../../services/hostingCompiler';
import {
  Globe,
  Terminal,
  Layers,
  Settings,
  Activity,
  Plus,
  Play,
  RotateCw,
  ExternalLink,
  Copy,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Trash2,
  Monitor,
  Tablet,
  Smartphone,
  Eye,
  Edit3,
  ShieldCheck,
  Server,
  Cpu,
  Clock,
  ArrowUpRight,
  Save,
  Code,
  FileArchive
} from 'lucide-react';

export default function HostingDashboard() {
  const {
    deployments,
    activeDeploymentId,
    setActiveDeploymentId,
    createDeployment,
    deleteDeployment,
    updateDeploymentFiles,
    rebuildDeployment,
    setActiveMode,
    settings,
    products,
    cart,
    addToCart
  } = useStore();

  const [activeTab, setActiveTab] = useState('deployments'); // 'deployments' | 'studio' | 'logs' | 'domains' | 'env' | 'analytics'
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [previewDeployment, setPreviewDeployment] = useState(null);

  // Studio code editor state
  const selectedDeployment = useMemo(() => {
    return (
      (deployments || []).find((d) => d.id === activeDeploymentId) ||
      deployments?.[0] ||
      null
    );
  }, [deployments, activeDeploymentId]);

  const [editorFile, setEditorFile] = useState('App.jsx');
  const [editorCode, setEditorCode] = useState('');
  const [isSavedToast, setIsSavedToast] = useState(false);
  const [studioViewport, setStudioViewport] = useState('desktop');

  // Sync editor code when active deployment changes
  React.useEffect(() => {
    if (selectedDeployment?.files?.[editorFile]) {
      setEditorCode(selectedDeployment.files[editorFile]);
    } else if (selectedDeployment?.files?.['App.jsx']) {
      setEditorFile('App.jsx');
      setEditorCode(selectedDeployment.files['App.jsx']);
    }
  }, [selectedDeployment, editorFile]);

  // Copy deployment URL
  const copyUrl = (id, url) => {
    navigator.clipboard?.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Handle saving code in Studio editor
  const handleSaveCode = () => {
    if (!selectedDeployment) return;
    const updatedFiles = {
      ...selectedDeployment.files,
      [editorFile]: editorCode
    };
    updateDeploymentFiles(selectedDeployment.id, updatedFiles);
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 2000);
  };

  // Storefront bridge for Studio preview
  const storefrontBridge = useMemo(() => {
    return {
      store: {
        name: settings.storeName,
        domain: settings.storeDomain,
        currency: settings.currency || 'USD',
        currencySymbol: settings.currencySymbol || '$'
      },
      products: products || [],
      cart: {
        items: cart.items || [],
        count: (cart.items || []).reduce((s, i) => s + (i.quantity || 1), 0),
        addItem: (p, q) => addToCart(p, null, q || 1)
      }
    };
  }, [settings, products, cart, addToCart]);

  // Compiled HTML for Studio Live Preview
  const studioPreviewHtml = useMemo(() => {
    if (!selectedDeployment) return '';
    const tempDeployment = {
      ...selectedDeployment,
      files: {
        ...selectedDeployment.files,
        [editorFile]: editorCode
      }
    };
    return buildHostedHtmlBundle(tempDeployment, storefrontBridge);
  }, [selectedDeployment, editorFile, editorCode, storefrontBridge]);

  // If user selected full preview runner
  if (previewDeployment) {
    return (
      <HostedAppRunner
        deployment={previewDeployment}
        onBack={() => setPreviewDeployment(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans flex flex-col selection:bg-emerald-500 selection:text-black">
      {/* Top Global Command Hub / Module Switcher */}
      <GlobalHeader currentSection="hosting" />

      {/* Vercel Header */}
      <header className="bg-zinc-950 border-b border-zinc-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-12 z-40 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-white text-black font-black flex items-center justify-center text-sm shadow-md">
            ▲
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm text-white tracking-tight">
                Vercel React Hosting Engine
              </span>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Edge Global CDN
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-mono">
              Direct React File & Component Hosting • Zero Config Transpilation
            </p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsDeployModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-black shadow-md transition-all cursor-pointer"
          >
            <FileArchive className="w-3.5 h-3.5" />
            <span>Deploy dist.zip</span>
          </button>
          <button
            onClick={() => setIsDeployModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-black shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New App</span>
          </button>
        </div>
      </header>

      {/* Edge Metrics Sub-Header */}
      <div className="bg-zinc-900/60 border-b border-zinc-800/80 px-4 sm:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">Deployments:</span>
              <span className="font-bold text-white font-mono">{deployments.length} Active</span>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <span className="text-zinc-500">Edge Network:</span>
              <span className="font-mono text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                32 Global Regions
              </span>
            </div>
            <div className="hidden lg:flex items-center gap-2">
              <span className="text-zinc-500">Avg Latency:</span>
              <span className="font-mono text-zinc-300">~14ms TTFB</span>
            </div>
            <div className="hidden lg:flex items-center gap-2">
              <span className="text-zinc-500">Transpiler:</span>
              <span className="font-mono text-amber-300">esbuild v0.25 (1.8ms)</span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            {[
              { id: 'deployments', label: 'Deployments', icon: Layers },
              { id: 'studio', label: 'Live Studio', icon: Code },
              { id: 'logs', label: 'Build Logs', icon: Terminal },
              { id: 'domains', label: 'Domains', icon: Globe },
              { id: 'env', label: 'Env Variables', icon: Settings },
              { id: 'analytics', label: 'Analytics', icon: Activity }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-zinc-800 text-white shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Body */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 flex-1 flex flex-col">
        {/* TAB 1: DEPLOYMENTS TABLE */}
        {activeTab === 'deployments' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-white">Active Deployments</h2>
                <p className="text-xs text-zinc-400">
                  Directly hosted React single-page applications and headless storefronts
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsDeployModalOpen(true)}
                  className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-xl text-xs font-black shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <FileArchive className="w-3.5 h-3.5" />
                  <span>Deploy dist.zip</span>
                </button>
                <button
                  onClick={() => setIsDeployModalOpen(true)}
                  className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold border border-zinc-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New App</span>
                </button>
              </div>
            </div>

            {/* Deployments List */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-950/80 text-zinc-400 border-b border-zinc-800 uppercase text-[10px] tracking-wider font-mono">
                    <tr>
                      <th className="py-3 px-4">Deployment / Domain</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Target</th>
                      <th className="py-3 px-4">Commit / Source</th>
                      <th className="py-3 px-4">Framework</th>
                      <th className="py-3 px-4">Size</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800 text-zinc-300">
                    {deployments.map((dep) => (
                      <tr
                        key={dep.id}
                        className="hover:bg-zinc-800/40 transition-colors group"
                      >
                        {/* Name & URL */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm block">
                                {dep.name}
                              </span>
                              {dep.isDistZip && (
                                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded flex items-center gap-1">
                                  <FileArchive className="w-2.5 h-2.5" />
                                  dist.zip
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-zinc-400 font-mono text-[11px]">
                              <span className="text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
                                onClick={() => setPreviewDeployment(dep)}
                              >
                                {dep.subdomain}
                              </span>
                              <button
                                onClick={() => copyUrl(dep.id, dep.liveUrl)}
                                className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
                                title="Copy Deployment URL"
                              >
                                {copiedId === dep.id ? (
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            {dep.status}
                          </span>
                        </td>

                        {/* Target */}
                        <td className="py-3.5 px-4 font-mono">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              dep.environment === 'production'
                                ? 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {dep.environment}
                          </span>
                        </td>

                        {/* Commit */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <p className="text-xs text-zinc-200 line-clamp-1">
                              {dep.commit?.message || 'Direct file upload'}
                            </p>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              {dep.commit?.branch || 'main'} • {dep.commit?.hash || 'head'}
                            </span>
                          </div>
                        </td>

                        {/* Framework */}
                        <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-400">
                          {dep.framework}
                        </td>

                        {/* Size */}
                        <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-400">
                          {dep.bundleSizeKb} kB
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setPreviewDeployment(dep)}
                              className="px-2.5 py-1 bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                              title="Live Interactive Preview"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Preview</span>
                            </button>

                            <button
                              onClick={() => {
                                setActiveDeploymentId(dep.id);
                                setActiveTab('studio');
                              }}
                              className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors cursor-pointer"
                              title="Edit React Code in Studio"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                setActiveDeploymentId(dep.id);
                                setActiveTab('logs');
                              }}
                              className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors cursor-pointer"
                              title="View Build Logs"
                            >
                              <Terminal className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => deleteDeployment(dep.id)}
                              className="p-1.5 bg-zinc-800 hover:bg-rose-950/60 text-zinc-400 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                              title="Tear Down Deployment"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LIVE CODE STUDIO */}
        {activeTab === 'studio' && (
          <div className="flex-1 flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <h2 className="text-base font-black text-white flex items-center gap-2">
                    <span>Vercel React Studio:</span>
                    <span className="text-emerald-400 font-mono">{selectedDeployment?.name}</span>
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Hot-reload live code editor directly bundled & served on edge
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isSavedToast && (
                  <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Rebuilt & Live!</span>
                  </span>
                )}

                <button
                  onClick={handleSaveCode}
                  className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Build & Deploy</span>
                </button>

                <button
                  onClick={() => setPreviewDeployment(selectedDeployment)}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold border border-zinc-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Full Screen</span>
                </button>
              </div>
            </div>

            {/* Split Screen: Left Code, Right Live Sandbox */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-[620px]">
              {/* Code Editor Panel */}
              <div className="lg:col-span-6 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col overflow-hidden">
                {/* File Tabs */}
                <div className="bg-zinc-950 border-b border-zinc-800 px-3 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 overflow-x-auto max-w-[80%] py-0.5 scrollbar-thin">
                    {Object.keys(selectedDeployment?.files || { 'App.jsx': '' }).map((fileName) => (
                      <button
                        key={fileName}
                        onClick={() => setEditorFile(fileName)}
                        className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                          editorFile === fileName
                            ? 'bg-zinc-800 text-white border border-zinc-700'
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{fileName}</span>
                      </button>
                    ))}
                  </div>

                  <span className="text-[10px] font-mono text-zinc-500 shrink-0">
                    {selectedDeployment?.isDistZip ? 'Static Asset' : 'React 19 + JSX'}
                  </span>
                </div>

                {/* Textarea Editor */}
                <div className="flex-1 p-3 bg-zinc-950 font-mono text-xs">
                  <textarea
                    value={editorCode}
                    onChange={(e) => setEditorCode(e.target.value)}
                    className="w-full h-full bg-transparent text-zinc-200 resize-none focus:outline-none leading-relaxed selection:bg-zinc-800 font-mono"
                    spellCheck="false"
                  />
                </div>
              </div>

              {/* Live Preview Panel */}
              <div className="lg:col-span-6 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col overflow-hidden">
                {/* Preview Toolbar */}
                <div className="bg-zinc-950 border-b border-zinc-800 px-4 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold text-white">Live Edge Sandbox</span>
                  </div>

                  {/* Viewport switch */}
                  <div className="flex items-center bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
                    <button
                      onClick={() => setStudioViewport('desktop')}
                      className={`p-1 rounded ${studioViewport === 'desktop' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
                      title="Desktop"
                    >
                      <Monitor className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setStudioViewport('mobile')}
                      className={`p-1 rounded ${studioViewport === 'mobile' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
                      title="Mobile"
                    >
                      <Smartphone className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Iframe Viewport */}
                <div className="flex-1 bg-black flex items-center justify-center p-2 overflow-hidden">
                  <div className={`w-full ${studioViewport === 'mobile' ? 'max-w-[390px]' : 'max-w-full'} h-full transition-all duration-300 rounded-xl overflow-hidden border border-zinc-800 shadow-xl bg-black`}>
                    <iframe
                      src={selectedDeployment?.isDistZip ? `/hosted/${selectedDeployment.id}` : undefined}
                      srcDoc={!selectedDeployment?.isDistZip ? studioPreviewHtml : undefined}
                      title="Studio Sandbox"
                      className="w-full h-full border-none"
                      sandbox="allow-scripts allow-modals allow-forms allow-same-origin allow-popups"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: BUILD LOGS */}
        {activeTab === 'logs' && (
          <div className="space-y-4 flex-1 flex flex-col">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-white">Build Pipeline & Terminal Logs</h2>
                <p className="text-xs text-zinc-400">
                  Streaming logs for: <span className="text-emerald-400 font-mono">{selectedDeployment?.name}</span>
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => rebuildDeployment(selectedDeployment?.id)}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold border border-zinc-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Re-trigger Build</span>
                </button>
              </div>
            </div>

            {/* Terminal Window */}
            <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded-2xl p-4 font-mono text-xs overflow-y-auto max-h-[600px] shadow-2xl">
              <div className="flex items-center gap-2 pb-3 mb-3 border-b border-zinc-900 text-zinc-500">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-[11px]">vercel-build-runner@edge ~ /usr/src/app</span>
              </div>

              <div className="space-y-1.5 text-zinc-300">
                {(selectedDeployment?.logs || []).map((log, index) => (
                  <div key={index} className="flex gap-3 leading-relaxed">
                    <span className="text-zinc-600 select-none">{log.timestamp}</span>
                    <span
                      className={`select-none font-bold uppercase text-[10px] px-1.5 py-0.2 rounded ${
                        log.level === 'success'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : log.level === 'warn'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {log.level}
                    </span>
                    <span className={log.level === 'success' ? 'text-emerald-300 font-bold' : ''}>
                      {log.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: DOMAINS */}
        {activeTab === 'domains' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-black text-white">Custom Domains & DNS</h2>
              <p className="text-xs text-zinc-400">
                Map custom domains and apex routing to your hosted React applications
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="e.g. shop.mybrand.com"
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  className="px-5 py-2 bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
                >
                  Add Custom Domain
                </button>
              </div>

              <div className="pt-4 divide-y divide-zinc-800">
                <div className="py-3 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white font-mono text-xs">
                        {selectedDeployment?.subdomain}
                      </span>
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                        Valid Configuration
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 font-mono">
                      Target: {selectedDeployment?.name} • SSL: Let's Encrypt (Active)
                    </p>
                  </div>

                  <span className="text-xs font-mono text-zinc-400">Edge DNS Active</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: ENVIRONMENT VARIABLES */}
        {activeTab === 'env' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-black text-white">Environment Variables & Secrets</h2>
              <p className="text-xs text-zinc-400">
                Runtime configuration injected into <code className="text-emerald-400">window.process.env</code>
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
              <div className="space-y-3">
                {Object.entries(selectedDeployment?.envVars || {}).map(([key, val]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-3 bg-zinc-950 rounded-xl border border-zinc-800 font-mono text-xs"
                  >
                    <span className="text-emerald-400 font-bold">{key}</span>
                    <span className="text-zinc-400 truncate max-w-xs">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: EDGE ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-black text-white">Edge Observability & Metrics</h2>
              <p className="text-xs text-zinc-400">
                Real-time performance metrics across global Vercel edge nodes
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-1">
                <span className="text-zinc-500 text-xs uppercase tracking-wider font-mono">Total Edge Requests</span>
                <p className="text-2xl font-black text-white font-mono">148,290</p>
                <span className="text-[11px] text-emerald-400 font-mono">↑ 18.4% this week</span>
              </div>
              <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-1">
                <span className="text-zinc-500 text-xs uppercase tracking-wider font-mono">P95 Latency</span>
                <p className="text-2xl font-black text-emerald-400 font-mono">14.2 ms</p>
                <span className="text-[11px] text-zinc-500 font-mono">Sub-second worldwide</span>
              </div>
              <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-1">
                <span className="text-zinc-500 text-xs uppercase tracking-wider font-mono">Cache Hit Ratio</span>
                <p className="text-2xl font-black text-white font-mono">99.4%</p>
                <span className="text-[11px] text-emerald-400 font-mono">Edge CDN Warm</span>
              </div>
              <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-1">
                <span className="text-zinc-500 text-xs uppercase tracking-wider font-mono">Success Rate</span>
                <p className="text-2xl font-black text-white font-mono">100%</p>
                <span className="text-[11px] text-emerald-400 font-mono">0 HTTP 5xx errors</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* New Deployment Modal */}
      {isDeployModalOpen && (
        <NewDeploymentModal
          onClose={() => setIsDeployModalOpen(false)}
          onDeploy={(newDep) => {
            createDeployment(newDep);
            setActiveDeploymentId(newDep.id);
            setActiveTab('deployments');
            setPreviewDeployment(newDep);
          }}
        />
      )}
    </div>
  );
}
