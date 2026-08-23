import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  ScanLine,
  Coins,
  BrainCircuit,
  Briefcase,
  NotebookPen,
  Star,
  Bell,
  Settings,
  Shield,
  LogOut,
  Menu,
  X,
  Globe,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { applyDocumentLocale } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/dashboard', key: 'nav.dashboard', icon: LayoutDashboard },
  { to: '/scanner', key: 'nav.scanner', icon: ScanLine },
  { to: '/assets', key: 'nav.assets', icon: Coins },
  { to: '/analysis', key: 'nav.analysis', icon: BrainCircuit },
  { to: '/portfolio', key: 'nav.portfolio', icon: Briefcase },
  { to: '/journal', key: 'nav.journal', icon: NotebookPen },
  { to: '/watchlist', key: 'nav.watchlist', icon: Star },
  { to: '/alerts', key: 'nav.alerts', icon: Bell },
  { to: '/settings', key: 'nav.settings', icon: Settings },
];

export function AppLayout() {
  const { t, i18n } = useTranslation();
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleLang = () => {
    const next = i18n.language === 'fa' ? 'en' : 'fa';
    i18n.changeLanguage(next);
    applyDocumentLocale(next);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/signin');
  };

  const isAdmin = profile?.role === 'admin';

  return (
    <div className="min-h-screen bg-surface-0 flex">
      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex w-64 flex-col border-l border-surface-3 bg-surface-1/50 backdrop-blur-sm">
        <SidebarContent
          navItems={navItems}
          t={t}
          isAdmin={isAdmin}
          onSignOut={handleSignOut}
        />
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-64 flex flex-col border-r border-surface-3 bg-surface-1 animate-slide-down">
            <button
              className="absolute top-4 left-4 text-secondary-400 hover:text-secondary-100"
              onClick={() => setMobileOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent
              navItems={navItems}
              t={t}
              isAdmin={isAdmin}
              onSignOut={handleSignOut}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 border-b border-surface-3 bg-surface-1/50 backdrop-blur-sm flex items-center justify-between px-4 lg:px-6">
          <button
            className="lg:hidden text-secondary-300"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-3 ml-auto">
            <button
              onClick={toggleLang}
              className="btn-ghost"
              aria-label="Toggle language"
            >
              <Globe className="w-5 h-5" />
              <span className="text-sm">{i18n.language === 'fa' ? 'EN' : 'فا'}</span>
            </button>

            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-surface-3 border border-surface-4 flex items-center justify-center text-primary-300 text-sm font-medium">
                {profile?.display_name?.[0]?.toUpperCase() ?? profile?.email?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm text-secondary-200 font-medium">
                  {profile?.display_name ?? profile?.email}
                </p>
                <p className="text-xs text-secondary-500">{profile?.role}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SidebarContent({
  navItems,
  t,
  isAdmin,
  onSignOut,
  onNavigate,
}: {
  navItems: { to: string; key: string; icon: typeof LayoutDashboard }[];
  t: (key: string) => string;
  isAdmin: boolean;
  onSignOut: () => void;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="h-16 flex items-center gap-2.5 px-5 border-b border-surface-3">
        <Shield className="w-7 h-7 text-primary-500" strokeWidth={1.5} />
        <span className="text-lg font-bold text-gradient">Aegis</span>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn('nav-link', isActive && 'nav-link-active')
            }
          >
            <item.icon className="w-5 h-5 shrink-0" strokeWidth={1.5} />
            <span className="text-sm">{t(item.key)}</span>
          </NavLink>
        ))}

        {isAdmin && (
          <NavLink
            to="/admin"
            onClick={onNavigate}
            className={({ isActive }) =>
              cn('nav-link', isActive && 'nav-link-active')
            }
          >
            <Shield className="w-5 h-5 shrink-0" strokeWidth={1.5} />
            <span className="text-sm">{t('nav.admin')}</span>
          </NavLink>
        )}
      </nav>

      <div className="p-3 border-t border-surface-3">
        <button onClick={onSignOut} className="nav-link w-full text-error-400 hover:text-error-300">
          <LogOut className="w-5 h-5 shrink-0" strokeWidth={1.5} />
          <span className="text-sm">{t('auth.signOut')}</span>
        </button>
      </div>
    </>
  );
}
