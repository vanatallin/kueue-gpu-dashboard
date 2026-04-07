import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Stepper } from '../ui/Stepper';
import { Button } from '../ui/Button';
import { StepIntent } from './StepIntent';
import { StepProfile } from './StepProfile';
import { StepAllocation } from './StepAllocation';
import { StepPreview } from './StepPreview';

const STEPS = ['Intent', 'Profile', 'Allocation', 'Preview'];

interface CreatePoolModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreatePoolModal({ open, onClose }: CreatePoolModalProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [intent, setIntent] = useState<string | null>(null);
  const [profile, setProfile] = useState(50);
  const [gpuCount, setGpuCount] = useState(4);

  if (!open) return null;

  const handleNext = () => setActiveStep((s) => Math.min(s + 1, 3));
  const handleBack = () => setActiveStep((s) => Math.max(s - 1, 0));

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="w-[720px] bg-surface rounded-[12px] border border-border shadow-[0_4px_16px_rgba(0,0,0,0.4)]"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 border-b border-border">
            <Stepper steps={STEPS} activeStep={activeStep} />
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-2 text-text-muted">
              <X size={16} />
            </button>
          </div>
          <div className="p-6 min-h-[260px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.15 }}
              >
                {activeStep === 0 && <StepIntent selected={intent} onSelect={setIntent} />}
                {activeStep === 1 && <StepProfile value={profile} onChange={setProfile} />}
                {activeStep === 2 && <StepAllocation selected={gpuCount} onChange={setGpuCount} />}
                {activeStep === 3 && <StepPreview intent={intent} profile={profile} gpuCount={gpuCount} />}
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
            <Button variant="ghost" onClick={activeStep === 0 ? onClose : handleBack}>
              {activeStep === 0 ? 'Cancel' : 'Back'}
            </Button>
            <Button
              variant="primary"
              onClick={activeStep === 3 ? onClose : handleNext}
            >
              {activeStep === 3 ? 'Create Pool' : 'Next'}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
