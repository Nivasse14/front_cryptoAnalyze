import { ReactNode } from 'react'
import clsx from 'clsx'

interface StatCardProps {
  label: string
  value: string | number
  change?: number
  icon?: ReactNode
  valueClassName?: string
}

export default function StatCard({ label, value, change, icon, valueClassName }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between">
        <span className="stat-label">{label}</span>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
      <div className="stat-value" className={valueClassName}>{value}</div>
      {change !== undefined && (
        <div className={clsx(
          'text-sm font-medium',
          change > 0 ? 'text-success' : change < 0 ? 'text-danger' : 'text-gray-400'
        )}>
          {change > 0 ? '+' : ''}{change}%
        </div>
      )}
    </div>
  )
}
