import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2, CheckCircle2, PauseCircle, Hammer, Clock3, PlayCircle,
  XCircle, Activity, Timer, MemoryStick, Radio, RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
} from 'recharts';
import { overview as overviewApi, platform } from '../services/api';
import { useMetricsSocket } from '../hooks/useMetricsSocket';
import { StatCard, PageLoader } from '../components/common/UI.jsx';
import { cn, formatUptime, formatBytes } from '../lib/utils';

const pad = (n) => String(n).padStart(2, '0');

// ─── Status class stat tiles (no donut / no stacked bar) ─────────────────────
const STATUS_CLASSES = [
  { key: '2xx', color: '#10b981', label: '2xx Success' },
  { key: '4xx', color: '#f59e0b', label: '4xx Client' },
  { key: '5xx', color: '#ef4444', label: '5xx Server' },
];

const StatusTiles = ({ counts = {} }) => (
  <div className="grid grid-cols-3 gap-3">
    {STATUS_CLASSES.map(c => (
      <div key={c.key} className="rounded-lg border border-border-primary bg-bg-inset px-3 py-3">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: c.color }} />
          {c.label}
        </div>
        <div className="text-xl font-bold text-text-primary mt-1.5">
          {(counts[c.key] || 0).toLocaleString()}
        </div>
      </div>
    ))}
  </div>
);

// ─── Live activity feed ──────────────────────────────────────────────────────
const statusColor = (status) => {
  if (status >= 500) return 'text-danger';
  if (status >= 400) return 'text-warning';
  return 'text-success';
};

const ActivityFeed = ({ events }) => (
  <div className="max-h-[340px] overflow-y-auto divide-y divide-border-primary">
    {events.length === 0 && (
      <div className="py-10 text-center text-[12px] text-text-tertiary">
        Waiting for live request events…
      </div>
    )}
    {events.map(e => (
      <div key={e._key} className="flex items-center gap-3 py-2 px-1 text-[12px] font-mono">
        <span className={cn('font-bold w-9 shrink-0', statusColor(e.status))}>{e.status}</span>
        <span className="text-text-primary truncate flex-1">{e.route}</span>
        <span className="text-text-tertiary shrink-0">{Math.round(e.ms)}ms</span>
        <span className="text-text-tertiary shrink-0 hidden sm:inline">
          {e.at ? new Date(e.at).toLocaleTimeString('en-IN', { hour12: false }) : ''}
        </span>
      </div>
    ))}
  </div>
);

// ─── Overview page ───────────────────────────────────────────────────────────
export const Overview = () => {
  const [stats, setStats] = useState(null);
  const [reqSeries, setReqSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const { metrics, activity, mode } = useMetricsSocket();

  const loadStats = () => {
    overviewApi.get()
      .then(res => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const loadSeries = () => {
    platform.analytics('24h')
      .then(res => {
        const rows = res?.data?.api?.series || [];
        setReqSeries(rows.map(r => {
          const d = new Date(r.ts);
          const label = Number.isNaN(d.getTime())
            ? String(r.ts)
            : `${pad(d.getHours())}:${pad(d.getMinutes())}`;
          return { ...r, label };
        }));
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadStats();
    loadSeries();
    const id = setInterval(() => { loadStats(); loadSeries(); }, 30000);
    return () => clearInterval(id);
  }, []);

  if (loading) return <PageLoader />;

  const tenants = stats?.tenants || {};
  const buildJobs = stats?.buildJobs || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary tracking-tight">Overview</h1>
          <p className="text-[13px] text-text-secondary mt-0.5">Platform health at a glance</p>
        </div>
        <button onClick={loadStats} className="btn-secondary">
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Link to="/tenants"><StatCard icon={Building2} label="Tenants" value={tenants.total} sub={`${tenants.active ?? 0} active`} /></Link>
        <StatCard icon={PauseCircle} label="Suspended" value={tenants.suspended} sub="Tenants offline" accent="text-danger" />
        <Link to="/builds"><StatCard icon={Hammer} label="Build jobs" value={buildJobs.total} sub={`${(buildJobs.queued ?? 0) + (buildJobs.running ?? 0)} in flight`} /></Link>
        <StatCard
          icon={CheckCircle2}
          label="Build outcomes"
          value={buildJobs.succeeded}
          sub={`${buildJobs.failed ?? 0} failed`}
          accent="text-success"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={Clock3} label="Queued" value={buildJobs.queued} accent="text-text-secondary" />
        <StatCard icon={PlayCircle} label="Running" value={buildJobs.running} accent="text-info" />
        <StatCard icon={CheckCircle2} label="Succeeded" value={buildJobs.succeeded} accent="text-success" />
        <StatCard icon={XCircle} label="Failed" value={buildJobs.failed} accent="text-danger" />
      </div>

      {/* API status panel */}
      <div className="console-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2.5">
            <Activity className="w-4.5 h-4.5 text-primary-light" />
            <h2 className="text-[15px] font-bold text-text-primary">API Status</h2>
            <span
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold',
                mode === 'live'
                  ? 'bg-success/10 text-success border-success/30'
                  : 'bg-warning/10 text-warning border-warning/30'
              )}
            >
              <Radio className={cn('w-3 h-3', mode === 'live' && 'pulse-dot')} />
              {mode === 'live' ? 'Live · socket' : mode === 'polling' ? 'Polling · 10s' : 'Connecting…'}
            </span>
          </div>

          {/* uptime + memory chips */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-raised border border-border-primary text-[12px] text-text-secondary">
              <Timer className="w-3.5 h-3.5 text-primary-light" />
              Uptime <span className="font-semibold text-text-primary">{formatUptime(metrics?.uptimeSeconds)}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-raised border border-border-primary text-[12px] text-text-secondary">
              <MemoryStick className="w-3.5 h-3.5 text-primary-light" />
              RSS <span className="font-semibold text-text-primary">{formatBytes(metrics?.memory?.rss)}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-raised border border-border-primary text-[12px] text-text-secondary">
              Heap <span className="font-semibold text-text-primary">{formatBytes(metrics?.memory?.heapUsed)}</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Requests per min + status split */}
          <div className="lg:col-span-2 space-y-6 min-w-0">
            <div>
              <h3 className="text-[12px] font-semibold uppercase tracking-wider text-text-tertiary mb-2">Requests &amp; errors (24h)</h3>
              {reqSeries.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={reqSeries} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} minTickGap={30} stroke="#232b45" />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} width={44} stroke="#232b45" />
                    <Tooltip
                      contentStyle={{ background: '#0d1226', border: '1px solid #232b45', borderRadius: 8, fontSize: 12, color: '#e2e8f0' }}
                      labelStyle={{ color: '#94a3b8', marginBottom: 4 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
                    <Line type="monotone" dataKey="requests" name="Requests" stroke="#6366f1" dot={false} strokeWidth={2} />
                    <Line type="monotone" dataKey="errors" name="Errors" stroke="#f43f5e" dot={false} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-[12px] text-text-tertiary">
                  No traffic recorded yet
                </div>
              )}
            </div>

            <div>
              <h3 className="text-[12px] font-semibold uppercase tracking-wider text-text-tertiary mb-2">Status classes</h3>
              <StatusTiles counts={metrics?.statusCounts || {}} />
            </div>

            <div className="min-w-0">
              <h3 className="text-[12px] font-semibold uppercase tracking-wider text-text-tertiary mb-2">Top endpoints</h3>
              <div className="overflow-x-auto rounded-lg border border-border-primary">
                <table className="w-full">
                  <thead className="bg-bg-inset border-b border-border-primary">
                    <tr>
                      <th className="table-head">Route</th>
                      <th className="table-head text-right">Hits</th>
                      <th className="table-head text-right">Errors</th>
                      <th className="table-head text-right">Avg latency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-primary">
                    {(metrics?.topEndpoints || []).length === 0 && (
                      <tr>
                        <td colSpan={4} className="table-cell text-center text-text-tertiary py-8">No endpoint data yet</td>
                      </tr>
                    )}
                    {(metrics?.topEndpoints || []).map(ep => (
                      <tr key={ep.route} className="hover:bg-bg-raised/40 transition-colors">
                        <td className="table-cell font-mono text-[12px] max-w-[280px] truncate">{ep.route}</td>
                        <td className="table-cell text-right font-semibold">{(ep.count ?? 0).toLocaleString()}</td>
                        <td className={cn('table-cell text-right', ep.errors > 0 ? 'text-danger font-semibold' : 'text-text-tertiary')}>
                          {ep.errors ?? 0}
                        </td>
                        <td className="table-cell text-right font-mono text-[12px]">{Math.round(ep.avgMs ?? 0)}ms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Live activity feed */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-[12px] font-semibold uppercase tracking-wider text-text-tertiary">Live activity</h3>
              {mode === 'live' && <span className="w-1.5 h-1.5 rounded-full bg-success pulse-dot" />}
            </div>
            <div className="rounded-lg border border-border-primary bg-bg-inset px-3">
              <ActivityFeed events={activity} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
