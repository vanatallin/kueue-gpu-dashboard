import { AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import type { Recommendation } from '../../types/kueue';
import { motion, AnimatePresence } from 'framer-motion';

const SEVERITY_ICON = {
  info: Info,
  warning: AlertTriangle,
  critical: AlertCircle,
};

const SEVERITY_COLOR = {
  info: 'text-compute',
  warning: 'text-warning',
  critical: 'text-critical',
};

interface RecommendationCardProps {
  recommendations: Recommendation[];
}

export function RecommendationCard({ recommendations }: RecommendationCardProps) {
  return (
    <div className="bg-surface rounded-[12px] border border-border p-4 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
      <h3 className="text-sm font-medium text-text-primary mb-3">Recommendations</h3>
      <AnimatePresence mode="wait">
        <motion.div
          key={recommendations.map((r) => r.id).join(',')}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col gap-2"
        >
          {recommendations.map((rec) => {
            const Icon = SEVERITY_ICON[rec.severity];
            return (
              <div key={rec.id} className="flex items-start gap-3">
                <Icon size={16} className={`shrink-0 mt-0.5 ${SEVERITY_COLOR[rec.severity]}`} />
                <p className="flex-1 text-[13px] text-text-secondary leading-[18px]">
                  {rec.message}
                </p>
                <Button variant="primary" className="h-7 px-3 text-[11px] shrink-0">
                  {rec.action}
                </Button>
              </div>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
