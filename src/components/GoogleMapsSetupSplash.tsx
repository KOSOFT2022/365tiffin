import React from 'react';
import { ShieldAlert, Key, Settings, HelpCircle, CheckCircle2, Globe } from 'lucide-react';

interface GoogleMapsSetupSplashProps {
  onBackToMock?: () => void;
}

export const GoogleMapsSetupSplash: React.FC<GoogleMapsSetupSplashProps> = ({ onBackToMock }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopyVar = () => {
    navigator.clipboard.writeText('GOOGLE_MAPS_PLATFORM_KEY');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 flex flex-col justify-between h-full min-h-[360px] shadow-2xl relative overflow-hidden">
      {/* Background radial highlight */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shrink-0">
            <Globe className="animate-spin" style={{ animationDuration: '8s' }} size={20} />
          </div>
          <div>
            <h4 className="text-sm font-black text-white flex items-center gap-1.5 uppercase tracking-wider">
              Google Maps Config Needed
            </h4>
            <p className="text-[10px] text-slate-400">Enable real-time satellite tracking, routes, and geographic geocoding.</p>
          </div>
        </div>

        {/* Steps List */}
        <div className="space-y-3.5 text-xs text-slate-300">
          {/* Step 1 */}
          <div className="flex gap-3 items-start bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60">
            <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5">
              1
            </div>
            <div className="space-y-1">
              <p className="font-extrabold text-white text-[11px]">Generate a Google Maps API Key</p>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Ensure you have Maps JavaScript API and Routes API enabled.
              </p>
              <a
                href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-400 hover:text-emerald-300 underline mt-1"
              >
                Get Google Maps Key <span className="text-xs">→</span>
              </a>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-3 items-start bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60">
            <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5">
              2
            </div>
            <div className="space-y-1 w-full">
              <p className="font-extrabold text-white text-[11px]">Register Key in Secrets</p>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Click the <strong className="text-white">Settings</strong> (<Settings className="inline-block" size={11} /> gear icon) in the top-right corner of AI Studio, go to <strong className="text-white">Secrets</strong> tab, and add a secret:
              </p>
              <div className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800 mt-1.5">
                <code className="text-[10px] text-emerald-400 font-mono font-bold">GOOGLE_MAPS_PLATFORM_KEY</code>
                <button
                  type="button"
                  onClick={handleCopyVar}
                  className="text-[9px] bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-1 rounded font-extrabold transition-all cursor-pointer"
                >
                  {copied ? 'Copied!' : 'Copy Name'}
                </button>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-3 items-start bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60">
            <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5">
              3
            </div>
            <div className="space-y-0.5">
              <p className="font-extrabold text-white text-[11px]">Instant Automatic Activation</p>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Paste your key and press Enter. The container will automatically recompile and load the live maps. No page reload needed!
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-800 flex gap-2 justify-end">
        {onBackToMock && (
          <button
            type="button"
            onClick={onBackToMock}
            className="text-[10px] bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-300 px-3.5 py-1.5 rounded-xl font-extrabold transition-all cursor-pointer"
          >
            ← Keep Using Mock Map
          </button>
        )}
      </div>
    </div>
  );
};
