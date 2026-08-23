import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Shield, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function SignInPage() {
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await signIn(email, password);
      navigate('/dashboard');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('Invalid login')) {
        setError(t('auth.errors.invalidCredentials'));
      } else {
        setError(t('auth.errors.network'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <div className="inline-flex">
          <Shield className="w-12 h-12 text-primary-500" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-secondary-100">{t('auth.welcomeBack')}</h1>
          <p className="text-sm text-secondary-400 mt-1">{t('app.tagline')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-error-500/10 border border-error-500/20 text-error-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm text-secondary-300 font-medium">{t('auth.email')}</label>
          <div className="relative">
            <Mail className="absolute top-1/2 -translate-y-1/2 start-3 w-5 h-5 text-secondary-500" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field ps-11"
              placeholder="you@example.com"
              dir="ltr"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-secondary-300 font-medium">{t('auth.password')}</label>
          <div className="relative">
            <Lock className="absolute top-1/2 -translate-y-1/2 start-3 w-5 h-5 text-secondary-500" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field ps-11"
              placeholder="••••••••"
              dir="ltr"
            />
          </div>
        </div>

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? t('auth.signingIn') : t('auth.signIn')}
        </button>
      </form>

      <p className="text-center text-sm text-secondary-400">
        {t('auth.noAccount')}{' '}
        <Link to="/signup" className="text-primary-400 hover:text-primary-300 font-medium">
          {t('auth.signUp')}
        </Link>
      </p>
    </div>
  );
}
