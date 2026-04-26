import { useState, lazy, Suspense, memo } from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { FiMap, FiBarChart2, FiActivity, FiUploadCloud, FiCpu, FiSun, FiMoon, FiMenu, FiX } from 'react-icons/fi';
import { useTheme } from './ThemeContext';
import Loader from './components/Loader';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const MapView = lazy(() => import('./pages/MapView'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Predict = lazy(() => import('./pages/Predict'));
const DataManager = lazy(() => import('./pages/DataManager'));

const navItems = [
  { to: '/', icon: <FiActivity size={20} />, label: 'Dashboard' },
  { to: '/map', icon: <FiMap size={20} />, label: 'Hotspot Map' },
  { to: '/analytics', icon: <FiBarChart2 size={20} />, label: 'Analytics' },
  { to: '/predict', icon: <FiCpu size={20} />, label: 'Predict' },
  { to: '/data', icon: <FiUploadCloud size={20} />, label: 'Data' },
];

const NavItem = memo(({ to, icon, label, active, onClick }) => (
  <NavLink 
    to={to}
    onClick={onClick}
    className="flex items-center gap-3 px-4 py-3 lg:py-2.5 rounded-xl text-sm lg:text-sm font-medium transition-all duration-200 hover:translate-x-1"
    style={{
      background: active ? 'rgba(99,102,241,.15)' : 'transparent',
      color: active ? 'var(--clr-primary-light)' : 'var(--clr-text-muted)',
      boxShadow: active ? '0 4px 12px rgba(99,102,241,.15)' : 'none',
    }}
  >
    {icon}
    <span>{label}</span>
  </NavLink>
));

NavItem.displayName = 'NavItem';

function App() {
  const location = useLocation();
  const { theme, toggle } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-72 lg:w-64 shrink-0 flex flex-col border-r 
          transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{ 
          background: 'var(--clr-surface)', 
          borderColor: 'var(--clr-border)',
          boxShadow: sidebarOpen ? '4px 0 24px rgba(0,0,0,0.2)' : 'none'
        }}
      >
        {/* Header */}
        <div className="p-5 lg:p-4 flex items-center justify-between border-b" style={{ borderColor: 'var(--clr-border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 lg:w-9 lg:h-9 rounded-xl flex items-center justify-center text-white font-bold text-base lg:text-sm shadow-lg"
              style={{ background: 'linear-gradient(135deg, var(--clr-primary), var(--clr-danger))' }}>
              AH
            </div>
            <div>
              <h1 className="text-base lg:text-sm font-bold" style={{ color: 'var(--clr-text)' }}>AcciHotspot</h1>
              <p className="text-xs" style={{ color: 'var(--clr-text-muted)' }}>AI Prediction System</p>
            </div>
          </div>
          
          {/* Close button (mobile only) */}
          <button 
            onClick={closeSidebar}
            className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: 'var(--clr-surface-2)', color: 'var(--clr-text-muted)' }}
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon, label }) => (
            <NavItem 
              key={to}
              to={to}
              icon={icon}
              label={label}
              active={location.pathname === to}
              onClick={closeSidebar}
            />
          ))}
        </nav>

        {/* Theme toggle */}
        <div className="p-4 border-t" style={{ borderColor: 'var(--clr-border)' }}>
          <button 
            onClick={toggle} 
            aria-label="Toggle theme"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium"
            style={{ background: 'var(--clr-surface-2)', color: 'var(--clr-text)' }}
          >
            {theme === 'dark' ? <FiSun size={18} /> : <FiMoon size={18} />}
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>

        {/* Footer info */}
        <div className="p-4 m-3 rounded-xl text-xs" style={{ background: 'var(--clr-surface-2)' }}>
          <p style={{ color: 'var(--clr-text-muted)' }}>Powered by</p>
          <p className="font-semibold mt-1" style={{ color: 'var(--clr-text)' }}>DBSCAN + Random Forest</p>
          <p className="mt-0.5" style={{ color: 'var(--clr-text-muted)' }}>GIS & Machine Learning</p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b" 
          style={{ background: 'var(--clr-surface)', borderColor: 'var(--clr-border)' }}>
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
            style={{ background: 'var(--clr-surface-2)', color: 'var(--clr-text)' }}
            aria-label="Open menu"
          >
            <FiMenu size={20} />
          </button>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
              style={{ background: 'linear-gradient(135deg, var(--clr-primary), var(--clr-danger))' }}>
              AH
            </div>
            <span className="text-sm font-bold" style={{ color: 'var(--clr-text)' }}>AcciHotspot</span>
          </div>

          <button 
            onClick={toggle} 
            aria-label="Toggle theme"
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
            style={{ background: 'var(--clr-surface-2)', color: 'var(--clr-text-muted)' }}
          >
            {theme === 'dark' ? <FiSun size={18} /> : <FiMoon size={18} />}
          </button>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 transition-colors duration-250" 
          style={{ background: 'var(--clr-bg)' }}>
          <Suspense fallback={<Loader />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/map" element={<MapView />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/predict" element={<Predict />} />
              <Route path="/data" element={<DataManager />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export default memo(App);
