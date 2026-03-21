import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import { Calendar, Lightbulb, User, FileText, LogOut } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const menuItems = [
    { path: '/recommendation', icon: Lightbulb, label: '분석하기' },
    { path: '/record', icon: Calendar, label: '기록하기' },
    { path: '/my-page', icon: User, label: '내 정보관리' },
    { path: '/analysis-history', icon: FileText, label: '분석 리포트' },
  ];

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 bg-white/85 backdrop-blur-sm flex flex-col shadow-[2px_0_24px_rgba(0,0,0,0.06)]">
        <div className="px-2 pt-3 pb-1 flex justify-center">
          <Link to="/">
            <img src="/logo.png" alt="로고" className="w-52 h-52 object-contain transition-transform duration-300 hover:scale-105" />
          </Link>
        </div>

        <nav className="flex-1 px-3 pt-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-1.5 transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-gray-500 hover:bg-blue-50 hover:text-blue-600'
                }`}
              >
                <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : ''}`} />
                <span className="text-sm font-semibold">{item.label}</span>
                {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/70" />}
              </Link>
            );
          })}
        </nav>

        {/* 하단 유저 정보 + 로그아웃 */}
        <div className="px-3 pb-6 border-t border-gray-100/80 pt-4">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user?.name ? user.name[0] : user?.email?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="min-w-0">
              {user?.name && (
                <p className="text-sm font-semibold text-gray-700 truncate leading-tight">{user.name}</p>
              )}
              <p className="text-xs text-gray-400 truncate leading-tight">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 w-full rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all duration-200 text-sm active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            <span>로그아웃</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
