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
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-blue-100">
      {/* Sidebar */}
      <aside className="w-56 bg-white/80 backdrop-blur-sm flex flex-col">
        <div className="p-4 flex justify-center">
          <Link to="/">
            <img src="/logo.png" alt="로고" className="w-36 h-36 object-contain" />
          </Link>
        </div>

        <nav className="flex-1 px-4 pt-8">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-all ${
                  isActive
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* 하단 유저 정보 + 로그아웃 */}
        <div className="px-4 pb-6 border-t border-gray-100 pt-4">
          <div className="px-2 mb-3">
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            {user?.name && (
              <p className="text-sm font-medium text-gray-700 truncate">{user.name}</p>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 w-full rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-500 transition-all text-sm"
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
