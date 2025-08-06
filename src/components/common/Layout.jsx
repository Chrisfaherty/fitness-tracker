import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  Home, 
  Apple, 
  Activity, 
  Heart, 
  User, 
  Menu, 
  X,
  LogIn,
  LogOut 
} from 'lucide-react'

const Layout = ({ children, currentUser, onLoginClick, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Nutrition', href: '/nutrition', icon: Apple },
    { name: 'Activity', href: '/activity', icon: Activity },
    { name: 'Wellness', href: '/wellness', icon: Heart },
    { name: 'Body', href: '/body', icon: User },
  ]

  const isActive = (href) => location.pathname === href

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 sidebar transform transition-all duration-500 ease-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-20 px-6 border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">F</span>
            </div>
            <h1 className="text-xl font-bold text-gradient">FitnessApp</h1>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all duration-200"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="mt-8 px-4">
          <div className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    nav-link ${isActive(item.href) ? 'active' : ''}
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon size={22} className="mr-4" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              )
            })}
          </div>
        </nav>

        {/* User section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          {currentUser ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-700 rounded-2xl shadow-sm">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-semibold text-lg">
                    {currentUser.firstName[0]}{currentUser.lastName[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {currentUser.firstName} {currentUser.lastName}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {currentUser.email}
                  </p>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-2xl transition-all duration-200"
              >
                <LogOut size={18} className="mr-3" />
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              className="btn-primary w-full flex items-center justify-center"
            >
              <LogIn size={18} className="mr-3" />
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="header-glass lg:hidden">
          <div className="flex items-center justify-between h-20 px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-3 rounded-2xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all duration-200"
            >
              <Menu size={22} />
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">F</span>
              </div>
              <h1 className="text-lg font-bold text-gradient">FitnessApp</h1>
            </div>
            {currentUser ? (
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-semibold text-sm">
                    {currentUser.firstName[0]}{currentUser.lastName[0]}
                  </span>
                </div>
              </div>
            ) : (
              <button
                onClick={onLoginClick}
                className="p-3 rounded-2xl text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all duration-200"
              >
                <LogIn size={22} />
              </button>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-transparent">
          <div className="p-6 lg:p-10 animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout