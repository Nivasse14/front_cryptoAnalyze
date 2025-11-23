import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api, WalletStats } from '../services/api'
import { formatCurrency, formatPercent, formatAddress, getPNLColor, getWinrateColor } from '../utils/formatters'
import { ArrowLeft, RefreshCw, TrendingUp, Clock, BarChart3, Activity } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import StatCard from '../components/StatCard'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import clsx from 'clsx'

export default function WalletDetail() {
  const { address } = useParams<{ address: string }>()
  const [walletTimeframes, setWalletTimeframes] = useState<WalletStats[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d')

  useEffect(() => {
    if (address) {
      loadWallet()
    }
  }, [address])

  const loadWallet = async () => {
    try {
      setLoading(true)
      const response = await api.getWalletAllTimeframes(address!)
      if (response.data.results && response.data.results.length > 0) {
        setWalletTimeframes(response.data.results)
      }
    } catch (error) {
      console.error('Error loading wallet:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner className="py-12" size="lg" />
  }

  if (walletTimeframes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Wallet not found</p>
        <Link to="/" className="btn-primary mt-4">Go Back</Link>
      </div>
    )
  }

  const currentData = walletTimeframes.find(t => t.timeframe === selectedTimeframe) || walletTimeframes[0]
  
  const holdTimeData = [
    { name: '0-3 min', value: currentData.hold_0_3_min },
    { name: '3-30 min', value: currentData.hold_3_30_min },
    { name: '30-60 min', value: currentData.hold_30_60_min },
    { name: '1-24h', value: currentData.hold_1_24_hours },
    { name: '>24h', value: currentData.hold_gt_24_hours },
  ]

  const roiDistribution = [
    { name: '>500%', value: currentData.roi_above_500 },
    { name: '200-500%', value: currentData.roi_200_to_500 },
    { name: '50-200%', value: currentData.roi_50_to_200 },
    { name: '10-50%', value: currentData.roi_10_to_50 },
    { name: '0-10%', value: currentData.roi_0_to_10 },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/" className="btn-secondary">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white font-mono">{formatAddress(address!, 8, 6)}</h1>
            <p className="text-gray-400 mt-1 text-sm">Full Address: {address}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="input"
          >
            {walletTimeframes.map(t => (
              <option key={t.timeframe} value={t.timeframe}>
                {t.timeframe.toUpperCase()}
              </option>
            ))}
          </select>
          <button onClick={loadWallet} className="btn-secondary">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total PNL"
          value={formatCurrency(currentData.total_pnl, 0)}
          valueClassName={getPNLColor(currentData.total_pnl)}
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <StatCard
          label="ROI"
          value={formatPercent(currentData.total_roi_percentage, 1)}
          valueClassName={getPNLColor(currentData.total_roi_percentage)}
          icon={<BarChart3 className="w-5 h-5" />}
        />
        <StatCard
          label="Winrate"
          value={formatPercent(currentData.winrate, 1)}
          valueClassName={getWinrateColor(currentData.winrate)}
          icon={<Activity className="w-5 h-5" />}
        />
        <StatCard
          label="Total Swaps"
          value={currentData.swap_count.toString()}
          icon={<Clock className="w-5 h-5" />}
        />
      </div>

      {/* Trading Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Trading Performance</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Winning Trades</span>
              <span className="text-success font-semibold">{currentData.winning_trades}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Losing Trades</span>
              <span className="text-danger font-semibold">{currentData.losing_trades}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Profitable Tokens</span>
              <span className="text-success font-semibold">{currentData.profitable_tokens}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Losing Tokens</span>
              <span className="text-danger font-semibold">{currentData.losing_tokens}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Total Tokens Traded</span>
              <span className="font-semibold">{currentData.total_tokens_traded}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Streaks & Stats</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Max Win Streak</span>
              <span className="text-success font-semibold">{currentData.max_win_streak}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Max Loss Streak</span>
              <span className="text-danger font-semibold">{currentData.max_loss_streak}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Avg Holding Time</span>
              <span className="font-semibold">{Math.round(currentData.average_holding_time_minutes)} min</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Unique Trading Days</span>
              <span className="font-semibold">{currentData.unique_trading_days}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Total Invest</span>
              <span className="font-semibold">{formatCurrency(currentData.total_invest, 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Best & Worst Trades */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 text-success">🔥 Best Trade</h3>
          <div className="p-4 bg-dark-200 rounded">
            <div className="mb-2">
              <p className="text-xs text-gray-400">Token</p>
              <p className="font-mono text-sm">{formatAddress(currentData.best_trade_token, 6, 4)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Profit</p>
              <p className="text-2xl font-bold text-success">{formatCurrency(currentData.best_trade_profit, 0)}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4 text-danger">💀 Worst Trade</h3>
          <div className="p-4 bg-dark-200 rounded">
            <div className="mb-2">
              <p className="text-xs text-gray-400">Token</p>
              <p className="font-mono text-sm">{formatAddress(currentData.worst_trade_token, 6, 4)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Loss</p>
              <p className="text-2xl font-bold text-danger">{formatCurrency(currentData.worst_trade_loss, 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Holding Time Distribution */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">⏱️ Holding Time Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={holdTimeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
              labelStyle={{ color: '#fff' }}
            />
            <Bar dataKey="value" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ROI Distribution */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">📊 ROI Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={roiDistribution}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
              labelStyle={{ color: '#fff' }}
            />
            <Bar dataKey="value" fill="#6366f1" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* All Timeframes Comparison */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">📈 Performance Across Timeframes</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Timeframe</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">PNL</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">ROI</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">Winrate</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">Swaps</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">Profitable</th>
              </tr>
            </thead>
            <tbody>
              {walletTimeframes.map((tf) => (
                <tr
                  key={tf.timeframe}
                  className={clsx('border-b border-dark-200 hover:bg-dark-200 transition-colors', tf.timeframe === selectedTimeframe && 'bg-dark-200/50')}
                >
                  <td className="py-3 px-4 font-semibold">{tf.timeframe.toUpperCase()}</td>
                  <td className={clsx('text-right py-3 px-4 font-semibold', getPNLColor(tf.total_pnl))}>
                    {formatCurrency(tf.total_pnl, 0)}
                  </td>
                  <td className={clsx('text-right py-3 px-4', getPNLColor(tf.total_roi_percentage))}>
                    {formatPercent(tf.total_roi_percentage, 1)}
                  </td>
                  <td className={clsx('text-right py-3 px-4', getWinrateColor(tf.winrate))}>
                    {formatPercent(tf.winrate, 1)}
                  </td>
                  <td className="text-right py-3 px-4 text-gray-300">{tf.swap_count}</td>
                  <td className="text-right py-3 px-4 text-success">{tf.profitable_tokens}/{tf.total_tokens_traded}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
