import { PREDICTION_CONFIG } from '../data/mockData'

export default function PredictionBadge({ prediction, confidence }) {
  const cfg = PREDICTION_CONFIG[prediction]

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${cfg.bgColor} ${cfg.borderColor}`}>
      <span className={`text-2xl font-bold ${cfg.textColor}`}>{cfg.icon}</span>
      <div>
        <p className={`text-xs font-semibold ${cfg.textColor}`}>{cfg.label}</p>
        <div className="flex items-center gap-1 mt-0.5">
          <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${cfg.badgeBg}`}
              style={{ width: `${confidence}%` }}
            />
          </div>
          <span className={`text-xs font-medium ${cfg.textColor}`}>{confidence}%</span>
        </div>
      </div>
    </div>
  )
}
