import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-surface-0 flex flex-col items-center justify-center gap-4 p-4">
      <ShieldAlert className="w-16 h-16 text-error-400" strokeWidth={1.5} />
      <div className="text-center">
        <h1 className="text-3xl font-bold text-secondary-100">404</h1>
        <p className="text-secondary-400 mt-2">Page not found</p>
      </div>
      <Link to="/" className="btn-primary">
        Home
      </Link>
    </div>
  );
}
