import React from 'react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const CHAIN_COLORS = {
  Base: '#58a6ff',
  Optimism: '#ff7b72',
  Stacks: '#56d364',
};

export default function ProfitChart({ daily, byChain }) {
  return (
    <div>
      <p className="section-title">Daily Income (USD)</p>
      <div className="card" style={{ padding: '20px 10px' }}>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={daily} margin={{ top: 4, right: 20, left: 0, bottom: 4 }}>
            <defs>
              <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#58a6ff" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#58a6ff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
            <XAxis dataKey="date" tick={{ fill: '#8b949e', fontSize: 11 }} />
            <YAxis tick={{ fill: '#8b949e', fontSize: 11 }} unit="$" />
            <Tooltip
              contentStyle={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 8 }}
              labelStyle={{ color: '#c9d1d9' }}
              itemStyle={{ color: '#58a6ff' }}
              formatter={(v) => [`$${v.toFixed(2)}`, 'Income']}
            />
            <Area
              type="monotone"
              dataKey="income"
              stroke="#58a6ff"
              strokeWidth={2}
              fill="url(#incomeGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <p className="section-title" style={{ marginTop: 24 }}>Income by Chain (USD)</p>
      <div className="card" style={{ padding: '20px 10px' }}>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={byChain} margin={{ top: 4, right: 20, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
            <XAxis dataKey="chain" tick={{ fill: '#8b949e', fontSize: 11 }} />
            <YAxis tick={{ fill: '#8b949e', fontSize: 11 }} unit="$" />
            <Tooltip
              contentStyle={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 8 }}
              labelStyle={{ color: '#c9d1d9' }}
              formatter={(v, name, props) => [`$${v.toFixed(2)}`, props.payload.chain]}
            />
            <Bar dataKey="total" radius={[4, 4, 0, 0]}
              fill="#58a6ff"
              label={false}
            >
              {byChain.map((entry) => (
                <rect key={entry.chain} fill={CHAIN_COLORS[entry.chain] || '#58a6ff'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
