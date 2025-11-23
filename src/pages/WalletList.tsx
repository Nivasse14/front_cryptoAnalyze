import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api, WalletsResponse } from '../services/api'
import { formatCurrency, formatPercent, formatAddress, getPNLColor, getWinrateColor } from '../utils/formatters'
import { TrendingUp, TrendingDown, Filter, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import StatCard from '../components/StatCard'
import clsx from 'clsx'

export default function WalletList() {
  const [walletsData, setWalletsData] = useState<WalletsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    timeframe: '7d',
    page: 1,
    limit: 50,
    orderBy: 'total_pnl',
    orderDir: 'DESC' as 'ASC' | 'DESC'
  })

  useEffect(() => {
    loadWallets()
  }, [filters])

  const loadWallets = async () => {
    try {
      setLoading(true)
      const response = await api.getWallets(filters)
      setWalletsData(response.data)
    } catch (error) {
      console.error('Error loading wallets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }))
  }

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const wallets = walletsData?.results || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Wallet Analytics</h1>
          <p className="text-gray-400 mt-1">
            {walletsData ? `${walletsData.total} wallets tracked - Page ${walletsData.page}/${walletsData.totalPages}` : 'Loading...'}
          </p>
        </div>
        <button
          onClick={loadWallets}
          className="btn-secondary flex items-center space-x-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Grid */}
      {walletsData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Wallets"
            value={walletsData.total.toString()}
            icon={<TrendingUp className="w-5 h-5" />}
          />
          <StatCard
            label="Current Page"
            value={`${walletsData.page} / ${walletsData.totalPages}`}
            icon={<Filter className="w-5 h-5" />}
          />
          <StatCard
            label="Results Per Page"
            value={walletsData.limit.toString()}
          />
          <StatCard
            label="Timeframe"
            value={walletsData.timeframe.toUpperCase()}
            valueClassName="text-primary"
          />
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Filters</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Timeframe</label>
            <select
              value={filters.timeframe}
              onChange={(e) => handleFilterChange('timeframe', e.target.value)}
              className="input w-full"
            >
              <option value="1d">1 Day</option>
              <option value="7d">7 Days</option>
              <option value="30d">30 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Results Per Page</label>
            <select
              value={filters.limit}
              onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
              className="input w-full"
            >
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="200">200</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Sort By</label>
            <select
              value={filters.orderBy}
              onChange={(e) => handleFilterChange('orderBy', e.target.value)}
              className="input w-full"
            >
              <option value="total_pnl">PNL</option>
              <option value="total_roi_percentage">ROI</option>
              <option value="winrate">Winrate</option>
              <option value="swap_count">Swaps</option>
              <option value="profitable_tokens">Profitable Tokens</option>
              <option value="winning_trades">Winning Trades</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Order</label>
            <select
              value={filters.orderDir}
              onChange={(e) => handleFilterChange('orderDir', e.target.value as 'ASC' | 'DESC')}
              className="input w-full"
            >
              <option value="DESC">Descending</option>
              <option value="ASC">Ascending</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Go to Page</label>
            <input
              type="number"
              min="1"
              max={walletsData?.totalPages || 1}
              value={filters.page}
              onChange={(e) => handleFilterChange('page', parseInt(e.target.value) || 1)}
              className="input w-full"
            />
          </div>
        </div>
      </div>

      {/* Wallets Table */}
      <div className="card">
        {loading ? (
          <LoadingSpinner className="py-12" />
        ) : wallets.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            No wallets found
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">#</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Wallet</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">PNL</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">ROI</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">Winrate</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">Swaps</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">Profitable</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">Win Streak</th>
                  </tr>
                </thead>
                <tbody>
                  {wallets.map((wallet, index) => (
                    <tr
                      key={wallet.id}
                      className="border-b border-dark-200 hover:bg-dark-200 transition-colors"
                    >
                      <td className="py-3 px-4 text-gray-400 text-sm">
                        {(filters.page - 1) * filters.limit + index + 1}
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          to={`/wallet/${wallet.wallet_address}`}
                          className="text-primary hover:text-primary/80 font-mono"
                        >
                          {formatAddress(wallet.wallet_address, 6, 4)}
                        </Link>
                      </td>
                      <td className={clsx('text-right py-3 px-4 font-semibold', getPNLColor(wallet.total_pnl))}>
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
                      <td className="text-right py-3 px-4 text-gray-300">
                        {wallet.profitable_tokens}/{wallet.total_tokens_traded}
                      </td>
                      <td className="text-right py-3 px-4 text-gray-300">
                        {wallet.max_win_streak}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="mt-6 flex items-center justify-between border-t border-dark-200 pt-4">
              <div className="text-sm text-gray-400">
                Showing {(filters.page - 1) * filters.limit + 1} to{' '}
                {Math.min(filters.page * filters.limit, walletsData?.total || 0)} of{' '}
                {walletsData?.total} wallets
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(filters.page - 1)}
                  disabled={!walletsData?.hasPrev}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>
                
                <div className="text-sm text-gray-300 px-4">
                  Page {filters.page} of {walletsData?.totalPages}
                </div>
                
                <button
                  onClick={() => handlePageChange(filters.page + 1)}
                  disabled={!walletsData?.hasNext}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
