import { useSettings } from '../context/SettingsContext';
import { RefreshCw, MessageSquare } from 'lucide-react';

const REFRESH_INTERVALS = [
  { value: 5, label: '5 seconds' },
  { value: 10, label: '10 seconds' },
  { value: 30, label: '30 seconds' },
  { value: 60, label: '1 minute' },
  { value: 120, label: '2 minutes' },
  { value: 300, label: '5 minutes' },
];

export function Settings() {
  const { settings, updateSettings } = useSettings();

  return (
    <div className="flex flex-col gap-6 max-w-[600px]">
      {/* Auto-refresh Settings */}
      <div className="bg-surface rounded-[12px] border border-border p-4 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
        <div className="flex items-center gap-3 mb-4">
          <RefreshCw size={18} className="text-primary" />
          <h3 className="text-sm font-medium text-text-primary">Auto-Refresh</h3>
        </div>

        <div className="space-y-4">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] text-text-primary">Enable auto-refresh</p>
              <p className="text-[11px] text-text-muted">Automatically refresh data at regular intervals</p>
            </div>
            <button
              onClick={() => updateSettings({ autoRefreshEnabled: !settings.autoRefreshEnabled })}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                settings.autoRefreshEnabled ? 'bg-primary' : 'bg-surface-2'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.autoRefreshEnabled ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Refresh Interval */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] text-text-primary">Refresh interval</p>
              <p className="text-[11px] text-text-muted">How often to fetch new data</p>
            </div>
            <select
              value={settings.autoRefreshInterval}
              onChange={(e) => updateSettings({ autoRefreshInterval: Number(e.target.value) })}
              disabled={!settings.autoRefreshEnabled}
              className={`px-3 py-1.5 rounded-lg border border-border bg-surface-2 text-[13px] text-text-primary focus:outline-none focus:border-primary ${
                !settings.autoRefreshEnabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {REFRESH_INTERVALS.map((interval) => (
                <option key={interval.value} value={interval.value}>
                  {interval.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* UI Features */}
      <div className="bg-surface rounded-[12px] border border-border p-4 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
        <div className="flex items-center gap-3 mb-4">
          <MessageSquare size={18} className="text-primary" />
          <h3 className="text-sm font-medium text-text-primary">UI Features</h3>
        </div>

        <div className="space-y-4">
          {/* Copilot Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] text-text-primary">Show Copilot</p>
              <p className="text-[11px] text-text-muted">Display the AI assistant chat panel</p>
            </div>
            <button
              onClick={() => updateSettings({ copilotEnabled: !settings.copilotEnabled })}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                settings.copilotEnabled ? 'bg-primary' : 'bg-surface-2'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.copilotEnabled ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Demo Slider Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] text-text-primary">Show demo slider</p>
              <p className="text-[11px] text-text-muted">Display the demo control bar at the bottom of the screen</p>
            </div>
            <button
              onClick={() => updateSettings({ demoSliderEnabled: !settings.demoSliderEnabled })}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                settings.demoSliderEnabled ? 'bg-primary' : 'bg-surface-2'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.demoSliderEnabled ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Current Status */}
      <div className="bg-surface-2 rounded-lg p-3 text-[12px] text-text-muted">
        <p>
          Auto-refresh: {settings.autoRefreshEnabled ? `Enabled (every ${settings.autoRefreshInterval}s)` : 'Disabled'}
        </p>
        <p>Copilot: {settings.copilotEnabled ? 'Visible' : 'Hidden'}</p>
        <p>Demo slider: {settings.demoSliderEnabled ? 'Visible' : 'Hidden'}</p>
      </div>
    </div>
  );
}
