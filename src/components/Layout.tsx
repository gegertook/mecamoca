import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Coffee, LayoutDashboard, Users, FileText, BarChart3,
  LogOut, Menu, X, ChevronRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/karyawan', icon: Users, label: 'Karyawan' },
  { to: '/slip-gaji', icon: FileText, label: 'Slip Gaji' },
  { to: '/laporan', icon: BarChart3, label: 'Laporan' },
];

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-800/60">
        <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-amber-500/20">
          <Coffee size={18} className="text-gray-950" />
        </div>
        {sidebarOpen && (
          <div className="overflow-hidden">
            <p className="text-white font-bold text-sm leading-none">Mecamocha</p>
            <p className="text-gray-500 text-xs mt-0.5">Penggajian</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                isActive
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                  : 'text-gray-400 hover:bg-gray-800/60 hover:text-gray-200'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-amber-500 rounded-r-full" />
                )}
                <Icon size={18} className="flex-shrink-0" />
                {sidebarOpen && <span className="text-sm font-medium">{label}</span>}
                {isActive && sidebarOpen && (
                  <ChevronRight size={14} className="ml-auto text-amber-500/60" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Info & Logout */}
      <div className="px-3 pb-4 border-t border-gray-800/60 pt-4">
        {sidebarOpen && (
          <div className="px-3 py-2 mb-2">
            <p className="text-gray-400 text-xs truncate">Pemilik</p>
            <p className="text-gray-300 text-xs truncate mt-0.5">{user?.email}</p>
          </div>
        )}
        <button
          id="logout-btn"
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 group"
        >
          <LogOut size={18} className="flex-shrink-0" />
          {sidebarOpen && <span className="text-sm font-medium">Keluar</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-gray-900/80 border-r border-gray-800/50 transition-all duration-300 flex-shrink-0 ${
          sidebarOpen ? 'w-56' : 'w-16'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-56 bg-gray-900 border-r border-gray-800/50 z-10">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="bg-gray-900/60 border-b border-gray-800/50 px-4 lg:px-6 py-3.5 flex items-center gap-3 sticky top-0 z-30 backdrop-blur-md">
          {/* Mobile menu toggle */}
          <button
            id="mobile-menu-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden text-gray-400 hover:text-gray-200 transition-colors"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Desktop sidebar toggle */}
          <button
            id="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:flex text-gray-400 hover:text-gray-200 transition-colors"
          >
            <Menu size={20} />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-2 bg-gray-800/60 rounded-lg px-3 py-1.5">
            <div className="w-6 h-6 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
              <span className="text-gray-950 text-xs font-bold">
                {user?.email?.[0]?.toUpperCase() ?? 'O'}
              </span>
            </div>
            <span className="text-gray-300 text-sm hidden sm:block">Pemilik</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
