import { ShieldCheck } from 'lucide-react';

export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-surface-0 flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className="absolute inset-0 animate-pulse-glow rounded-2xl" />
        <ShieldCheck className="w-16 h-16 text-primary-500 relative z-10" strokeWidth={1.5} />
      </div>
      <p className="text-secondary-400 text-sm animate-pulse">Aegis</p>
    </div>
  );
}
