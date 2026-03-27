import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { getChartData } from '../api/ledgerAPI';

const SAMPLE_DATA = [
  { date: 'Day 1', income: 0, expense: 0, pnl: 0 },
];

const ProfitChart = () => {
  const [chartType, setChartType] = useState('line');

  const rawData = getChartData();
  const data = rawData.length > 0 ? rawData : SAMPLE_DATA;

  return (
    <div className="profit-chart">
      <div className="chart-controls">
        <button
          className={`btn btn-small ${chartType === 'line' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setChartType('line')}
        >
          Line
        </button>
        <button
          className={`btn btn-small ${chartType === 'bar' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setChartType('bar')}
        >
          Bar
        </button>
      </div>

      {data.length === 1 && data[0].date === 'Day 1' && (
        <p className="muted-text chart-empty-msg">
          No ledger entries yet — log activity to see your profit chart.
        </p>
      )}

      <ResponsiveContainer width="100%" height={280}>
        {chartType === 'line' ? (
          <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
            <XAxis dataKey="date" stroke="#718096" tick={{ fontSize: 12 }} />
            <YAxis stroke="#718096" tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
            <Tooltip
              contentStyle={{ background: '#1a202c', border: '1px solid #2d3748', borderRadius: 6 }}
              labelStyle={{ color: '#e2e8f0' }}
              formatter={(value) => [`$${value.toFixed(4)}`, undefined]}
            />
            <Legend />
            <Line type="monotone" dataKey="income" stroke="#48bb78" strokeWidth={2} dot={false} name="Income" />
            <Line type="monotone" dataKey="expense" stroke="#fc8181" strokeWidth={2} dot={false} name="Expense" />
            <Line type="monotone" dataKey="pnl" stroke="#63b3ed" strokeWidth={2} dot={false} name="P&L" />
          </LineChart>
        ) : (
          <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
            <XAxis dataKey="date" stroke="#718096" tick={{ fontSize: 12 }} />
            <YAxis stroke="#718096" tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
            <Tooltip
              contentStyle={{ background: '#1a202c', border: '1px solid #2d3748', borderRadius: 6 }}
              labelStyle={{ color: '#e2e8f0' }}
              formatter={(value) => [`$${value.toFixed(4)}`, undefined]}
            />
            <Legend />
            <Bar dataKey="income" fill="#48bb78" name="Income" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" fill="#fc8181" name="Expense" radius={[4, 4, 0, 0]} />
            <Bar dataKey="pnl" fill="#63b3ed" name="P&L" radius={[4, 4, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

export default ProfitChart;
