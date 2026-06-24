import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  BarChart3,
  Settings,
  LogOut,
  ChevronRight,
  Cpu,
  Moon,
  Sun,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Role } from '../api/client';

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  roles: Role[];
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', icon: LayoutDashboard, label: 'Übersicht', roles: ['SALES', 'BRANCH_MANAGER', 'TECHNICAL_LEAD', 'WAREHOUSE', 'TECHNICIAN', 'ADMIN', 'MANAGEMENT', 'DISPATCHER'] },
  { to: '/requests/new', icon: PlusCircle, label: 'Neue Anfrage', roles: ['SALES', 'ADMIN'] },
  { to: '/statistics', icon: BarChart3, label: 'Statistiken', roles: ['MANAGEMENT', 'ADMIN'] },
  { to: '/admin', icon: Settings, label: 'Verwaltung', roles: ['ADMIN'] },
];

const ROLE_LABELS: Record<Role, string> = {
  SALES:          'Vertrieb',
  BRANCH_MANAGER: 'Niederlassungsleiter',
  TECHNICAL_LEAD: 'Technischer Leiter',
  WAREHOUSE:      'Lager',
  TECHNICIAN:     'Techniker',
  MANAGEMENT:     'Verwaltung',
  DISPATCHER:     'Disponent',
  ADMIN:          'Administrator',
};

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const visibleItems = NAV_ITEMS.filter((item) => user && item.roles.includes(user.role));

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 dark:border-slate-800">
        <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center shadow-sm shadow-brand-600/30">
          <Cpu className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-900 dark:text-slate-100">Auftragsverwaltung</p>
          <p className="text-xs text-gray-400 dark:text-slate-500">Auftragsmanagement</p>
        </div>
        {/* Close button only on mobile */}
        <button
          className="md:hidden text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"
          onClick={() => setSidebarOpen(false)}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? 'bg-brand-50 dark:bg-brand-600/15 text-brand-700 dark:text-brand-400'
                  : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-slate-200'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={`w-4 h-4 flex-shrink-0 transition-colors ${
                    isActive
                      ? 'text-brand-600 dark:text-brand-400'
                      : 'text-gray-400 dark:text-slate-500 group-hover:text-gray-600 dark:group-hover:text-slate-300'
                  }`}
                />
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight className="w-3 h-3 text-brand-400 dark:text-brand-500" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-3 py-3 border-t border-gray-100 dark:border-slate-800 space-y-1.5">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-700 dark:hover:text-slate-200 transition-all duration-150"
          title={theme === 'dark' ? 'Helles Design' : 'Dunkles Design'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          <span>{theme === 'dark' ? 'Helles Design' : 'Dunkles Design'}</span>
        </button>

        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-slate-800/60">
          <div className="w-8 h-8 bg-brand-100 dark:bg-brand-600/20 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-brand-700 dark:text-brand-400">
              {user?.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-900 dark:text-slate-100 truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 dark:text-slate-500">{user ? ROLE_LABELS[user.role] : ''}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            title="Abmelden"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950 overflow-hidden transition-colors duration-200">

      {/* ── Desktop Sidebar (md+) ── */}
      <aside className="hidden md:flex md:w-64 flex-shrink-0 bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 flex-col transition-colors duration-200">
        {sidebarContent}
      </aside>

      {/* ── Mobile Overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Mobile Sidebar (drawer) ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 transition-transform duration-300 md:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-6 h-6 bg-brand-600 rounded-md flex items-center justify-center">
              <Cpu className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-bold text-gray-900 dark:text-slate-100">Auftragsverwaltung</span>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
