import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'
import { formatCurrency, formatPercent, formatAddress, getWinrateColor, getPNLColor } from '../utils/formatters'
import { Trophy, Medal, TrendingUp } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import clsx from 'clsx'

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState('7d')

  useEffect(() => {
    loadLeaderboard()
  }, [timeframe])

  const loadLeaderboard = async () => {
    try {
      setLoading(true)
      const response = await api.getLeaderboard({ timeframe, limit: 100, orderBy: 'total_pnl', orderDir: 'DESC' })
      setLeaderboard(response.data.results)
      
      // Calculer les stats globales à partir des résultats
      if (response.data.results.length > 0) {
        const totalPnl = response.data.results.reduce((sum: number, w: any) => sum + (w.total_pnl || 0), 0)
        const avgPnl = totalPnl / response.data.results.length
        const avgWinrate = response.data.results.reduce((sum: number, w: any) => sum + (w.winrate || 0), 0) / response.data.results.length
        const totalTrades = response.data.results.reduce((sum: number, w: any) => sum + (w.swap_count || 0), 0)
        
        setStats({
          total_wallets: response.data.count,
          avg_pnl: avgPnl,
          avg_winrate: avgWinrate,
          total_trades: totalTrades
        })
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-400" />
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />
    if (rank === 3) return <Medal className="w-5 h-5 text-orange-600" />
    return <span className="text-gray-500">#{rank}</span>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center space-x-3">
            <Trophy className="w-8 h-8 text-yellow-400" />
            <span>Leaderboard</span>
          </h1>
          <p className="text-gray-400 mt-1">Top performing Solana wallets</p>
        </div>

        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          className="input"
        >
          <option value="1d">1 Day</option>
          <option value="7d">7 Days</option>
          <option value="30d">30 Days</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {/* Global Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="stat-card">
            <span className="stat-label">Total Wallets</span>
            <span className="stat-value">{stats.total_wallets}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Avg PNL</span>
            <span className={clsx('stat-value', getPNLColor(stats.avg_pnl))}>
              {formatCurrency(stats.avg_pnl, 0)}
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Avg Winrate</span>
            <span className={clsx('stat-value', getWinrateColor(stats.avg_winrate))}>
              {formatPercent(stats.avg_winrate, 1)}
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Total Trades</span>
            <span className="stat-value">{stats.total_trades.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="card">
        {loading ? (
          <LoadingSpinner className="py-12" />
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            No wallets found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Rank</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Wallet</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">PNL</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">ROI</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">Winrate</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">Trades</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">Profitable</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Top Token</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((wallet, index) => {
                  const rank = index + 1
                  const isTopThree = rank <= 3

                  return (
                    <tr
                      key={wallet.wallet_address}
                      className={clsx(
                        'border-b border-dark-200 hover:bg-dark-200 transition-colors',
                        isTopThree && 'bg-dark-200/30'
                      )}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          {getMedalIcon(rank)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          to={`/wallet/${wallet.wallet_address}`}
                          className="text-primary hover:text-primary/80 font-mono"
                        >
                          {formatAddress(wallet.wallet_address, 6, 4)}
                        </Link>
                      </td>
                      <td className={clsx('text-right py-3 px-4 font-bold', getPNLColor(wallet.total_pnl))}>
                        {formatCurrency(wallet.total_pnl, 0)}
                      </td>
                      <td className={clsx('text-right py-3 px-4', getPNLColor(wallet.total_roi_percentage))}>
                        {formatPercent(wallet.total_roi_percentage, 1)}
                      </td>
                      <td className={clsx('text-right py-3 px-4', getWinrateColor(wallet.winrate))}>
                        {formatPercent(wallet.winrate, 1)}
                      </td>
                      <td className="text-right py-3 px-4 text-gray-300">
                        {wallet.swap_count}
                      </td>
                      <td className="text-right py-3 px-4 text-success">
                        {wallet.profitable_tokens}
                      </td>
                      <td className="py-3 px-4 text-gray-300">
                        {wallet.best_trade_token ? formatAddress(wallet.best_trade_token, 4, 4) : 'N/A'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="card bg-dark-200/50">
        <div className="flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span className="text-gray-400">1st Place</span>
          </div>
          <div className="flex items-center space-x-2">
            <Medal className="w-4 h-4 text-gray-400" />
            <span className="text-gray-400">2nd Place</span>
          </div>
          <div className="flex items-center space-x-2">
            <Medal className="w-4 h-4 text-orange-600" />
            <span className="text-gray-400">3rd Place</span>
          </div>
        </div>
      </div>
    </div>
  )
}
