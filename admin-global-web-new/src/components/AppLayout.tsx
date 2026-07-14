import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const navItems = [
  { to: '/spots', label: 'Spots', icon: '🍦' },
  { to: '/orders', label: 'Order history', icon: '📦' },
  { to: '/prizes', label: 'Rewards', icon: '🎁' },
  { to: '/quests', label: 'Quests', icon: '🎯', superAdminOnly: true },
  { to: '/admins', label: 'Admins', icon: '👤', superAdminOnly: true },
  { to: '/news', label: 'News & Notifications', icon: '📣' },
];

export function AppLayout() {
  const { user, isSuperAdmin, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="flex w-60 flex-col border-r border-gray-200 bg-white">
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white">
            G
          </div>
          <div>
            <div className="text-sm font-bold leading-4 text-gray-900">Gelato</div>
            <div className="text-xs font-semibold tracking-wide text-brand">ADMIN</div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {navItems
            .filter((i) => !i.superAdminOnly || isSuperAdmin)
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                    isActive
                      ? 'bg-brand-light text-brand'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`
                }
              >
                <span>{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
        </nav>

        <div className="border-t border-gray-200 p-3">
          <div className="px-2 pb-2">
            <div className="truncate text-sm font-medium text-gray-900">
              {user?.name || user?.email}
            </div>
            <div className="text-xs text-gray-500">{user?.roles?.join(', ')}</div>
          </div>
          <button
            onClick={logout}
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-50"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
