import { TrendingUp, TrendingDown } from 'lucide-react';

interface StepPreviewProps {
  intent: string | null;
  profile: number;
  gpuCount: number;
}

export function StepPreview({ intent, profile, gpuCount }: StepPreviewProps) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-[13px] text-text-secondary">Estimated impact of creating this pool:</p>
      <div className="bg-surface rounded-[12px] border border-border p-4 space-y-3">
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-text-secondary">Intent</span>
          <span className="text-text-primary font-medium capitalize">{intent ?? '—'}</span>
        </div>
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-text-secondary">Profile</span>
          <span className="text-text-primary font-medium">
            Compute {100 - profile}% / Memory {profile}%
          </span>
        </div>
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-text-secondary">GPUs</span>
          <span className="text-text-primary font-medium">{gpuCount}</span>
        </div>
        <hr className="border-border" />
        <div className="space-y-2">
          {[
            { label: 'Throughput', delta: '+22%', positive: true },
            { label: 'Latency', delta: '-18%', positive: true },
            { label: 'Fragmentation', delta: '-12%', positive: true },
          ].map((m) => (
            <div key={m.label} className="flex items-center justify-between text-[13px]">
              <span className="text-text-secondary">{m.label}</span>
              <span className={`flex items-center gap-1 font-medium ${m.positive ? 'text-status-running' : 'text-critical'}`}>
                {m.positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {m.delta}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
