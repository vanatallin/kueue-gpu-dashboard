import { motion, AnimatePresence } from 'framer-motion';
import type { DemoEvent } from '../../types/kueue';
import { Clock, Play, Pause, CheckCircle, RotateCcw, Send } from 'lucide-react';

const EVENT_ICON = {
  submit: Send,
  start: Play,
  preempt: Pause,
  complete: CheckCircle,
  resume: RotateCcw,
};

const EVENT_COLOR = {
  submit: 'text-compute',
  start: 'text-status-running',
  preempt: 'text-critical',
  complete: 'text-text-secondary',
  resume: 'text-status-resuming',
};

interface EventLogProps {
  events: DemoEvent[];
}

export function EventLog({ events }: EventLogProps) {
  return (
    <div className="bg-surface rounded-[12px] border border-border p-4 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
      <h3 className="text-sm font-medium text-text-primary mb-3">Event Log</h3>
      <div className="flex flex-col gap-0">
        <AnimatePresence>
          {events.map((ev, i) => {
            const Icon = EVENT_ICON[ev.type];
            return (
              <motion.div
                key={`${ev.timestamp}-${ev.type}`}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="flex items-start gap-3 py-2 border-b border-border/30 last:border-b-0"
              >
                <div className="flex items-center gap-2 shrink-0 pt-0.5">
                  <Clock size={12} className="text-text-muted" />
                  <span className="text-[11px] font-mono text-text-muted w-16">{ev.timestamp}</span>
                </div>
                <Icon size={14} className={`shrink-0 mt-0.5 ${EVENT_COLOR[ev.type]}`} />
                <p className="text-[13px] text-text-secondary leading-[18px]">{ev.message}</p>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
