import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TrendingUp, RefreshCw } from 'lucide-react';
import { platform } from '../services/api';
import { LineChartCard } from '../components/LineChartCard.jsx';
import { PageLoader } from '../components/common/UI.jsx';
import { cn } from '../lib/utils';

const WINDOWS = [
  { value: '24h', label: '24 Hours' },
  { value: '7d', label: '7 Days' },
  { value: 'month', label: 'This Month' },
  { value: 'all', label: 'All Time' },
];
const REFRESH_MS = 15000;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const pad = (n) => String(n).padStart(2, '0');

// ISO ts → "HH:MM" for short windows, "DD MMM" for long windows.
const formatSeriesLabel = (ts, window) => {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return String(ts);
  // 24h shows time-of-day; longer windows show the calendar day.
  if (window === '24h') {
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  return `${pad(d.getDate())} ${MONTHS[d.getMonth()]}`;
};

// YYYY-MM-DD (or any date) → "DD MMM"
const formatDayLabel = (ts) => {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return String(ts);
  return `${pad(d.getDate())} ${MONTHS[d.getMonth()]}`;
};

export const Analytics = () => {
  const [window, setWindow] = useState('24h');
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState(null);
  const windowRef = useRef(window);
  windowRef.current = window;

  const load = (w = windowRef.current, showLoader = false) => {
    if (showLoader) setLoading(true);
    platform.analytics(w)
      .then((res) => {
        setPayload(res.data || null);
        setUpdatedAt(new Date());
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  // Refetch on window change.
  useEffect(() => {
    load(window, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [window]);

  // Auto-refresh every 15s while on the page.
  useEffect(() => {
    const id = setInterval(() => load(), REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  const apiSeries = useMemo(() => {
    const rows = payload?.api?.series || [];
    return rows.map((r) => ({ ...r, label: formatSeriesLabel(r.ts, window) }));
  }, [payload, window]);

  const growthSeries = useMemo(() => {
    const rows = payload?.growth || [];
    return rows.map((r) => ({ ...r, label: formatDayLabel(r.ts) }));
  }, [payload]);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <TrendingUp className="w-5 h-5 text-primary-light" />
          <div>
            <h1 className="text-xl font-bold text-text-primary tracking-tight">Analytics</h1>
            <p className="text-[13px] text-text-secondary mt-0.5">
              Platform traffic, latency &amp; growth over time
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {updatedAt && (
            <span className="text-[11px] text-text-tertiary font-mono">
              updated {updatedAt.toLocaleTimeString('en-IN', { hour12: false })}
            </span>
          )}
          <button onClick={() => load(window, false)} className="btn-secondary">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Window toggle */}
      <div className="flex items-center gap-1.5">
        {WINDOWS.map((w) => (
          <button
            key={w.value}
            type="button"
            onClick={() => setWindow(w.value)}
            className={cn(
              'px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-colors cursor-pointer border',
              window === w.value
                ? 'bg-primary text-white border-primary shadow-sm shadow-primary/20'
                : 'bg-bg-raised text-text-secondary border-border-primary hover:text-text-primary hover:border-border-secondary'
            )}
          >
            {w.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <LineChartCard
          title="API Requests & Errors"
          data={apiSeries}
          series={[
            { key: 'requests', name: 'Requests', color: '#6366f1' },
            { key: 'errors', name: 'Errors', color: '#f43f5e' },
          ]}
        />

        <LineChartCard
          title="API Latency"
          data={apiSeries}
          series={[
            { key: 'p95Ms', name: 'p95 (ms)', color: '#a855f7' },
            { key: 'avgMs', name: 'avg (ms)', color: '#22d3ee', dashed: true },
          ]}
        />

        <div className="xl:col-span-2">
          <LineChartCard
            title="Platform Growth"
            data={growthSeries}
            series={[
              { key: 'tenants', name: 'Tenants', color: '#6366f1' },
              { key: 'builds', name: 'Builds', color: '#22d3ee' },
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export default Analytics;
