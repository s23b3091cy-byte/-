import { ResponsiveContainer, AreaChart, Area, Tooltip } from 'recharts'
import { PREDICTION_CONFIG } from '../data/mockData'

function CustomTooltip({ active, payload }) {
  if (active && payload?.length) {
    return (
      <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded-lg shadow">
        {payload[0].value.toFixed(3)}
      </div>
    )
  }
  return null
}

export default function MiniChart({ chartData, prediction, id }) {
  const color = PREDICTION_CONFIG[prediction].chartColor
  const gradientId = `grad-${id}`

  return (
    <div className="rounded-xl overflow-hidden bg-gray-50 px-1 py-1">
      <ResponsiveContainer width="100%" height={72}>
        <AreaChart data={chartData} margin={{ top: 6, right: 6, left: 6, bottom: 6 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.18} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="price"
            stroke={color}
            strokeWidth={2.5}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: color }}
          />
          <Tooltip content={<CustomTooltip />} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
