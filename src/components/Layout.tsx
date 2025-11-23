import { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BarChart3, Wallet, Trophy } from 'lucide-react'
import clsx from 'clsx'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()

  const navItems = [
    { path: '/', icon: Wallet, label: 'Wallets' },
    { path: '/leaderboard', icon: Trophy, label: 'Leaderboard' }
  ]

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-dark-100 border-b border-dark-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-3">
              <BarChart3 className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold text-white">Solana Wallet Analytics</h1>
                <p className="text-xs text-gray-400">Professional Trading Insights</p>
              </div>
            </Link>
            
            <nav className="flex items-center space-x-2">
              {navItems.map(({ path, icon: Icon, label }) => (
                <Link
                  key={path}
                  to={path}
                  className={clsx(
                    'flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors',
                    location.pathname === path
                      ? 'bg-primary text-white'
                      : 'text-gray-400 hover:text-white hover:bg-dark-200'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-dark-100 border-t border-dark-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <p>© 2025 Solana Wallet Analytics. All rights reserved.</p>
            <div className="flex items-center space-x-4">
              <span>Powered by Cielo Finance & GMGN</span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                <span>Live</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
