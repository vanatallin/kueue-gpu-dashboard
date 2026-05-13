import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { LogIn } from 'lucide-react';

export function LoginPage() {
  const { login, error } = useAuth();

  return (
    <div className="flex items-center justify-center min-h-screen bg-bg">
      <div className="max-w-md w-full mx-4">
        <div className="bg-surface rounded-[16px] border border-border p-8 shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-text-primary mb-2">
              GPU Monitor
            </h1>
            <p className="text-sm text-text-secondary">
              Kueue cluster management dashboard
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-critical/10 border border-critical/20">
              <p className="text-sm text-critical">{error}</p>
            </div>
          )}

          <Button
            variant="primary"
            onClick={login}
            className="w-full gap-2 justify-center py-3"
          >
            <LogIn size={18} />
            Login with OpenShift
          </Button>
        </div>
      </div>
    </div>
  );
}
