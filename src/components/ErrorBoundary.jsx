import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    try {
      localStorage.clear();
      window.location.reload();
    } catch (e) {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-white">Application State Recovered</h2>
              <p className="text-xs text-zinc-400 mt-1">
                A data format mismatch was caught from previous localStorage state.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-zinc-950 rounded-lg text-left border border-zinc-800 text-[11px] font-mono text-rose-300 overflow-x-auto max-h-32">
                {this.state.error.toString()}
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full py-2.5 px-4 bg-[#008060] hover:bg-[#006e52] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#008060]/20 transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reset Local Storage & Reload Store</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
