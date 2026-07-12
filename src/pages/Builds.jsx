import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, Hammer, Download } from 'lucide-react';
import { builds as buildsApi, tenants as tenantsApi } from '../services/api';
import { StatusBadge, PageLoader, EmptyState } from '../components/common/UI.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import { formatDate } from '../lib/utils';

const IN_FLIGHT = new Set(['queued', 'dispatched', 'running']);

export const Builds = () => {
  const { toast } = useToast();
  const [list, setList] = useState([]);
  const [tenantOptions, setTenantOptions] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const timerRef = useRef(null);

  const load = useCallback((silent = false) => {
    if (!silent) setRefreshing(true);
    return buildsApi.list(filter ? { tenant: filter } : {})
      .then(res => setList(res.data || []))
      .catch(err => { if (!silent) toast(err.message, 'error'); })
      .finally(() => { setLoading(false); setRefreshing(false); });
  }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setLoading(true);
    load(true);
  }, [load]);

  useEffect(() => {
    tenantsApi.list()
      .then(res => setTenantOptions((res.data || []).map(t => t.slug)))
      .catch(() => {});
  }, []);

  const hasInFlight = useMemo(() => list.some(b => IN_FLIGHT.has(b.status)), [list]);

  // Auto-refresh every 10s while any job is queued/dispatched/running.
  useEffect(() => {
    if (!hasInFlight) return;
    timerRef.current = setInterval(() => load(true), 10000);
    return () => clearInterval(timerRef.current);
  }, [hasInFlight, load]);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-text-primary tracking-tight">Builds</h1>
          <p className="text-[13px] text-text-secondary mt-0.5">
            {list.length} job{list.length !== 1 ? 's' : ''}
            {hasInFlight && <span className="text-primary-light"> · auto-refreshing every 10s</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="field-input !w-auto min-w-[160px] cursor-pointer"
          >
            <option value="">All tenants</option>
            {tenantOptions.map(slug => <option key={slug} value={slug}>{slug}</option>)}
          </select>
          <button onClick={() => load()} disabled={refreshing} className="btn-secondary">
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="console-card overflow-hidden">
        {list.length === 0 ? (
          <EmptyState
            icon={Hammer}
            title="No build jobs"
            sub={filter ? `No builds found for tenant "${filter}".` : 'Queue a build from a tenant detail page.'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-bg-inset border-b border-border-primary">
                <tr>
                  <th className="table-head">Tenant</th>
                  <th className="table-head">App</th>
                  <th className="table-head">Artifact</th>
                  <th className="table-head">Version</th>
                  <th className="table-head">Status</th>
                  <th className="table-head">Queued</th>
                  <th className="table-head text-right">Output</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-primary">
                {list.map(b => (
                  <tr key={b._id} className="hover:bg-bg-raised/40 transition-colors">
                    <td className="table-cell">
                      <Link to={`/tenants/${b.tenant}`} className="font-mono text-[12px] font-semibold text-primary-light hover:underline">
                        {b.tenant}
                      </Link>
                    </td>
                    <td className="table-cell">
                      <div className="font-semibold">{b.appLabel || b.app || '—'}</div>
                      {b.applicationId && <div className="text-[11px] font-mono text-text-tertiary">{b.applicationId}</div>}
                    </td>
                    <td className="table-cell font-mono text-[12px] uppercase font-semibold">{b.artifact}</td>
                    <td className="table-cell font-mono text-[12px]">
                      {b.versionName || '—'}{b.versionCode != null ? ` (${b.versionCode})` : ''}
                    </td>
                    <td className="table-cell">
                      <StatusBadge status={b.status} />
                      {b.status === 'failed' && b.error && (
                        <div className="text-[11px] text-danger mt-1 max-w-[280px] truncate" title={b.error}>{b.error}</div>
                      )}
                    </td>
                    <td className="table-cell text-text-secondary">{formatDate(b.createdAt)}</td>
                    <td className="table-cell text-right">
                      {b.status === 'succeeded' && b.artifactUrl ? (
                        <a href={b.artifactUrl} target="_blank" rel="noreferrer" className="btn-secondary !py-1.5">
                          <Download className="w-3.5 h-3.5" />Download
                        </a>
                      ) : (
                        <span className="text-[12px] text-text-tertiary">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
