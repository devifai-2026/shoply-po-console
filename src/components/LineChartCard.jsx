import React from 'react';
import {
  ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
} from 'recharts';

/**
 * Reusable dark-theme line chart wrapped in the console-card shell.
 *
 * Props:
 *   title   — card heading
 *   data    — array of rows (each row carries the xKey + every series.key)
 *   xKey    — key on each row for the X axis label (default 'label')
 *   series  — [{ key, name, color, dashed? }]
 *   height  — chart height in px (default 220)
 */
export const LineChartCard = ({ title, data = [], xKey = 'label', series = [], height = 220 }) => {
  const hasData = Array.isArray(data) && data.length > 0;

  return (
    <div className="console-card p-5">
      {title && (
        <h3 className="text-[12px] font-semibold uppercase tracking-wider text-text-tertiary mb-4">
          {title}
        </h3>
      )}

      {hasData ? (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey={xKey}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              minTickGap={30}
              stroke="#232b45"
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              width={44}
              stroke="#232b45"
            />
            <Tooltip
              contentStyle={{
                background: '#0d1226',
                border: '1px solid #232b45',
                borderRadius: 8,
                fontSize: 12,
                color: '#e2e8f0',
              }}
              labelStyle={{ color: '#94a3b8', marginBottom: 4 }}
              itemStyle={{ padding: 0 }}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
            {series.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name || s.key}
                stroke={s.color}
                dot={false}
                strokeWidth={s.dashed ? 1 : 2}
                strokeDasharray={s.dashed ? '4 3' : undefined}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div
          className="flex items-center justify-center text-[12px] text-text-tertiary"
          style={{ height }}
        >
          No data for this window yet
        </div>
      )}
    </div>
  );
};

export default LineChartCard;
