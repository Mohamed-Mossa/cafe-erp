import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { logout } from '../../features/auth/store/authSlice';

const NAV = [
  { to: '/pos',         icon: '🛒', label: 'POS',        roles: ['OWNER','MANAGER','SUPERVISOR','CASHIER','WAITER'] },
  { to: '/floor',       icon: '🪑', label: 'Floor',      roles: ['OWNER','MANAGER','SUPERVISOR','CASHIER','WAITER'] },
  { to: '/gaming',      icon: '🎮', label: 'Gaming',     roles: ['OWNER','MANAGER','SUPERVISOR','CASHIER'] },
  { to: '/shifts',      icon: '🕐', label: 'Shifts',     roles: ['OWNER','MANAGER','SUPERVISOR','CASHIER'] },
  { to: '/inventory',   icon: '📦', label: 'Inventory',  roles: ['OWNER','MANAGER','SUPERVISOR'] },
  { to: '/customers',   icon: '👥', label: 'Customers',  roles: ['OWNER','MANAGER','SUPERVISOR','CASHIER'] },
  { to: '/promotions',  icon: '🎟️', label: 'Promos',    roles: ['OWNER','MANAGER'] },
  { to: '/reports',     icon: '📊', label: 'Reports',    roles: ['OWNER','MANAGER'] },
];

export default function AppShell() {
  const { role, fullName, username } = useAppSelector(s => s.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const visibleNav = NAV.filter(n => !role || n.roles.includes(role));

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-52 flex-shrink-0 bg-slate-900 flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <div className="text-white font-bold text-lg">☕ Cafe ERP</div>
          <div className="text-slate-400 text-xs mt-1 truncate">{fullName || username}</div>
          <div className="text-slate-500 text-xs">{role}</div>
        </div>
        <nav className="flex-1 py-2 overflow-y-auto">
          {visibleNav.map(({ to, icon, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 text-sm transition-colors ${isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`
              }>
              <span className="text-base">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>
        <button onClick={handleLogout} className="p-4 text-slate-400 hover:text-white text-sm text-left border-t border-slate-700 hover:bg-slate-800 transition">
          🚪 Logout
        </button>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto p-5">
        <Outlet />
      </main>
    </div>
  );
}
