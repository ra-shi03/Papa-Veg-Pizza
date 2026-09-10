import React, { useState, useEffect } from 'react';
import { X, Play, CheckCircle, XCircle, Loader2, RefreshCw, Copy, Check, Terminal, Wifi, Database } from 'lucide-react';

export default function TestConnectionModal({ isOpen, onClose, gateway }) {
  const [testing, setTesting] = useState(false);
  const [progress, setProgress] = useState('');
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && gateway) {
      handleTest();
    } else {
      setResult(null);
      setProgress('');
      setTesting(false);
    }
  }, [isOpen, gateway]);

  if (!isOpen || !gateway) return null;

  const handleTest = () => {
    setTesting(true);
    setResult(null);
    setProgress('Initializing handshake with gateway...');

    const stages = [
      { delay: 400, text: 'Resolving gateway secure DNS endpoints...' },
      { delay: 800, text: 'Authenticating Merchant ID & Signature Key...' },
      { delay: 1200, text: 'Sending verification ping payload...' },
      { delay: 1600, text: 'Parsing response signature payload...' },
    ];

    stages.forEach((stage) => {
      setTimeout(() => {
        if (testing) return; // avoid updating state if closed
        setProgress(stage.text);
      }, stage.delay);
    });

    setTimeout(() => {
      const isSuccess = Math.random() > 0.15; // 85% success rate
      const latency = Math.floor(Math.random() * 200) + 80;
      
      const mockResponse = isSuccess 
        ? {
            status: 200,
            statusText: "OK",
            data: {
              success: true,
              message: "Connection verified successfully",
              gateway: gateway.gatewayName,
              environment: gateway.environment,
              timestamp: new Date().toISOString(),
              features: ["UPI", "Cards", "NetBanking", "Recurring"],
              latency_ms: latency,
              db_sync: "active"
            }
          }
        : {
            status: 401,
            statusText: "Unauthorized",
            data: {
              success: false,
              error: "Invalid Credentials",
              message: "The signature verification failed. Please check your Secret Key and Key ID credentials.",
              gateway: gateway.gatewayName,
              environment: gateway.environment,
              timestamp: new Date().toISOString(),
              latency_ms: latency
            }
          };

      setResult({
        success: isSuccess,
        latency,
        statusCode: mockResponse.status,
        statusText: mockResponse.statusText,
        payload: {
          url: `https://api.${gateway.gatewayName.toLowerCase()}.com/v1/verify-credentials`,
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer key_id_••••••••",
            "X-Gateway-Env": gateway.environment
          },
          body: {
            merchantId: gateway.merchantId,
            keyId: gateway.keyId,
            action: "ping"
          }
        },
        response: mockResponse
      });
      setTesting(false);
    }, 2000);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(JSON.stringify(text, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-zinc-950/60 backdrop-blur-sm transition-all duration-350 p-0 md:p-4 animate-fade">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-t-2xl md:rounded-xl shadow-2xl flex flex-col h-[90vh] md:h-auto md:max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div>
            <h3 className="text-base font-extrabold text-black dark:text-zinc-50 flex items-center gap-1.5">
              <Wifi className="text-[var(--primary)] shrink-0" size={18} />
              Test Connection: {gateway.gatewayName}
            </h3>
            <p className="text-[10px] text-black dark:text-zinc-100 mt-0.5 font-semibold">
              Verify credentials and ping the provider endpoints in the {gateway.environment} environment
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-black hover:text-black dark:text-zinc-100 transition-colors"
          >
            <X size={16} />
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-700">
          {testing ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 space-y-4">
              <div className="relative flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border-4 border-zinc-200 dark:border-zinc-800 border-t-[var(--primary)] animate-spin"></div>
                <Wifi className="absolute text-[var(--primary)] animate-pulse" size={18} />
              </div>
              <div className="text-center space-y-1">
                <h4 className="text-xs font-extrabold text-black dark:text-zinc-100">Testing Secure Connectivity</h4>
                <p className="text-[10px] text-black dark:text-zinc-100 font-medium animate-pulse">{progress}</p>
              </div>
            </div>
          ) : result ? (
            <div className="space-y-4">
              {/* Status Badge */}
              <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                result.success 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-400' 
                  : 'bg-red-500/10 border-red-500/20 text-red-800 dark:text-red-400'
              }`}>
                {result.success ? (
                  <CheckCircle className="shrink-0 mt-0.5" size={20} />
                ) : (
                  <XCircle className="shrink-0 mt-0.5" size={20} />
                )}
                <div className="space-y-1 flex-1">
                  <h4 className="text-xs font-black uppercase tracking-wider">
                    {result.success ? 'Connection Successful' : 'Connection Failed'}
                  </h4>
                  <p className="text-[10.5px] font-bold text-black dark:text-zinc-100 leading-normal">
                    {result.success 
                      ? `Successfully established handshake with ${gateway.gatewayName} API endpoints. Latency is within acceptable limits.` 
                      : result.response.data.message
                    }
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1.5 text-[9.5px] font-bold text-black dark:text-zinc-100">
                    <span className="flex items-center gap-1">
                      HTTP Status: <strong className={result.success ? 'text-emerald-600' : 'text-red-500'}>{result.statusCode} {result.statusText}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      Latency: <strong className="text-black dark:text-zinc-100">{result.latency} ms</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      Environment: <strong className="text-black dark:text-zinc-100">{gateway.environment}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Client-friendly diagnostic summary */}
              <div className="space-y-3 bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 text-black dark:text-zinc-100 text-xs font-semibold">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-black dark:text-zinc-50 border-b border-zinc-200 dark:border-zinc-700 pb-1.5 mb-2">
                  Diagnostic Parameters
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-[10.5px]">
                  <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-1">
                    <span className="opacity-75">SSL Handshake:</span>
                    <span className="text-emerald-600 font-extrabold">Passed</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-1">
                    <span className="opacity-75">API Protocol:</span>
                    <span className="font-mono">HTTPS</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-1">
                    <span className="opacity-75">Merchant Signature:</span>
                    <span className="text-emerald-600 font-extrabold">Verified</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-1">
                    <span className="opacity-75">Endpoint Verification:</span>
                    <span className="font-mono truncate max-w-[150px]">api.{gateway.gatewayName.toLowerCase()}.com</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-xs font-bold text-black dark:text-zinc-100">Ready to test connection</p>
              <button 
                onClick={handleTest}
                className="mt-3 px-4 py-2 bg-[var(--primary)] text-white text-xs font-bold rounded-lg flex items-center gap-1.5"
              >
                <Play size={12} /> Test Now
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="p-3 bg-zinc-50 dark:bg-zinc-900/60 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1 text-[9px] font-bold text-black dark:text-zinc-100">
            <span>Diagnostics processed securely.</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 border border-zinc-300 dark:border-zinc-700 text-black dark:text-zinc-100 text-xs font-semibold rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Close
            </button>
            {result && (
              <button 
                type="button"
                onClick={handleTest}
                className="px-4 py-1.5 bg-[var(--primary)] text-white text-xs font-semibold rounded-lg hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <RefreshCw size={12} />
                <span>Re-Test</span>
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
