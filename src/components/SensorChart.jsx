import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

const TABS = [
  { id: 'climate', label: 'Température & Humidité Sol' },
  { id: 'light', label: 'Luminosité (Lux)' },
];

export function SensorChart({ history }) {
  const [activeTab, setActiveTab] = useState('climate');

  return (
    <div className="rounded-2xl border border-emerald-900/70 bg-[#0b1f17] p-5 shadow-lg shadow-black/25">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">
            Évolution en temps réel
          </h2>
          <p className="text-xs text-emerald-200/60">
            Historique des {history.length} dernières mesures reçues
          </p>
        </div>

        <div className="inline-flex rounded-xl border border-emerald-900/70 bg-[#06130e] p-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-emerald-500/20 text-white border border-emerald-500/40'
                  : 'text-emerald-200/60 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-72 w-full">
        {history.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-emerald-800/70 bg-[#06130e]/60 text-center">
            <p className="text-sm font-medium text-white">
              En attente de données MQTT
            </p>
            <p className="mt-1 text-xs text-emerald-200/60">
              Connectez le broker et publiez des mesures pour afficher les courbes en temps réel.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {activeTab === 'climate' ? (
              <AreaChart data={history} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradTemp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fb923c" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#fb923c" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradSoil" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#133426" />
                <XAxis dataKey="time" stroke="#86efac" fontSize={11} tickMargin={8} />
                <YAxis stroke="#86efac" fontSize={11} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#071711',
                    borderColor: '#166534',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                    color: '#ffffff',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px', color: '#ffffff' }} />
                <Area
                  type="monotone"
                  dataKey="temperature"
                  name="Température (°C)"
                  stroke="#fb923c"
                  strokeWidth={2}
                  fill="url(#gradTemp)"
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="soilMoisture"
                  name="Humidité Sol (%)"
                  stroke="#34d399"
                  strokeWidth={2}
                  fill="url(#gradSoil)"
                  isAnimationActive={false}
                />
              </AreaChart>
            ) : (
              <AreaChart data={history} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradLux" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#facc15" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#facc15" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#133426" />
                <XAxis dataKey="time" stroke="#86efac" fontSize={11} tickMargin={8} />
                <YAxis stroke="#86efac" fontSize={11} domain={[0, 1200]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#071711',
                    borderColor: '#166534',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                    color: '#ffffff',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px', color: '#ffffff' }} />
                <Area
                  type="monotone"
                  dataKey="luminosity"
                  name="Luminosité (Lux)"
                  stroke="#facc15"
                  strokeWidth={2.5}
                  fill="url(#gradLux)"
                  isAnimationActive={false}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
