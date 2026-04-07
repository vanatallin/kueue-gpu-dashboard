import { X, Sparkles } from 'lucide-react';
import { useDemo } from '../../context/DemoContext';
import { ChatBubble } from './ChatBubble';
import { Button } from '../ui/Button';
import { AnimatePresence, motion } from 'framer-motion';

const COPILOT_MESSAGES: Record<1 | 2 | 3 | 4, { user: string; ai: string; action?: string }> = {
  1: {
    user: "What's the cluster status?",
    ai: "Cluster is stable. Team A is running data-preprocessing on 4 of 8 GPUs. 50% capacity available.",
  },
  2: {
    user: "Team B needs GPUs urgently.",
    ai: "Team B submitted llm-finetune requesting 6 GPUs, but only 4 are free. I recommend preempting Team A's low-priority workload to free 4 more GPUs.",
    action: 'Preempt Team A',
  },
  3: {
    user: "What happened to Team A?",
    ai: "Team A's data-preprocessing was preempted and paused at 45% progress. It will auto-resume once Team B's high-priority job finishes and releases GPUs.",
  },
  4: {
    user: "Is Team A back?",
    ai: "Yes! Team B completed. Team A automatically resumed at 45% progress on 4 GPUs. Cluster is back to steady state.",
  },
};

interface CopilotPanelProps {
  onClose: () => void;
}

export function CopilotPanel({ onClose }: CopilotPanelProps) {
  const { step } = useDemo();
  const convo = COPILOT_MESSAGES[step];

  return (
    <motion.aside
      initial={{ x: 320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 320, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="w-80 shrink-0 bg-surface border-l border-border flex flex-col h-full"
    >
      <div className="h-12 flex items-center justify-between px-4 border-b border-border">
        <div className="flex items-center gap-2 text-[13px] font-medium text-text-primary">
          <Sparkles size={16} className="text-primary" />
          AI Copilot
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-surface-2 text-text-muted"
        >
          <X size={14} />
        </button>
      </div>
      <div className="flex-1 p-4 flex flex-col gap-3 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-3"
          >
            <ChatBubble role="user" message={convo.user} />
            <ChatBubble role="ai" message={convo.ai} />
            {convo.action && (
              <div className="bg-surface-2 rounded-lg p-3 border border-border">
                <p className="text-[11px] text-text-muted mb-2">Suggested action</p>
                <Button variant="primary" className="w-full h-8 text-[12px]">
                  {convo.action}
                </Button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.aside>
  );
}
