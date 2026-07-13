import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Building2, Link2, Database, Smartphone, PauseCircle, PlayCircle,
  RotateCw, Package, RefreshCw, KeyRound, AlertTriangle, Eye, Trash2, Sparkles,
} from 'lucide-react';
import { tenants as tenantsApi, builds as buildsApi, platform as platformApi } from '../services/api';
import { StatusBadge, DbBadge, PageLoader, UrlRow, EmptyState, AppBadge, BuildDownloadButton, CredRow, Toggle } from '../components/common/UI.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import { formatDate } from '../lib/utils';

const AppBuildGroup = ({ title, app, packageId, busy, onBuild }) => (
  <div>
    <div className="flex items-center justify-between gap-3">
      <div className="text-[12px] font-semibold text-text-primary">{title}</div>
      <span className="font-mono text-[11px] text-text-tertiary break-all text-right">{packageId || '—'}</span>
    </div>
    <div className="flex items-center gap-2 mt-3">
      <button
        onClick={() => onBuild(app, 'apk')}
        disabled={busy === `build-${app}-apk`}
        className="btn-primary"
      >
        <Package className="w-4 h-4" />
        {busy === `build-${app}-apk` ? 'Queueing…' : 'Build APK'}
      </button>
      <button
        onClick={() => onBuild(app, 'aab')}
        disabled={busy === `build-${app}-aab`}
        className="btn-secondary"
      >
        <Package className="w-4 h-4" />
        {busy === `build-${app}-aab` ? 'Queueing…' : 'Build AAB'}
      </button>
    </div>
  </div>
);

const InfoRow = ({ label, value, mono }) => (
  <div className="flex items-start justify-between gap-4 py-2 border-b border-border-primary last:border-0">
    <span className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary pt-0.5 shrink-0">{label}</span>
    <span className={`text-[13px] text-text-primary text-right break-all ${mono ? 'font-mono text-[12px]' : ''}`}>{value ?? '—'}</span>
  </div>
);

export const TenantDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tenant, setTenant] = useState(null);
  const [buildList, setBuildList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [mongoUri, setMongoUri] = useState('');
  const [adminCreds, setAdminCreds] = useState(null);

  const load = useCallback(() => {
    Promise.all([
      tenantsApi.get(slug).then(res => setTenant(res.data)),
      buildsApi.list({ tenant: slug }).then(res => setBuildList(res.data || [])).catch(() => {}),
    ])
      .catch(err => toast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(load, [load]);

  const toggleStatus = async () => {
    const action = tenant.status === 'suspended' ? 'reactivate' : 'suspend';
    setBusy('status');
    try {
      await tenantsApi[action](slug);
      toast(`Tenant ${action === 'suspend' ? 'suspended' : 'reactivated'}`);
      load();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy('');
    }
  };

  const toggleAiReviewAddon = async (nextValue) => {
    try {
      await tenantsApi.setAddon(slug, 'aiProductReview', nextValue);
      toast(nextValue ? 'AI Product Review enabled' : 'AI Product Review disabled');
      load();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const rotateUri = async (e) => {
    e.preventDefault();
    if (!mongoUri.trim()) {
      toast('Enter the new MongoDB URI first', 'warning');
      return;
    }
    setBusy('rotate');
    try {
      await tenantsApi.rotateSecrets(slug, { mongoUri: mongoUri.trim() });
      toast('Database URI rotated');
      setMongoUri('');
      load();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy('');
    }
  };

  const revealAdminCredentials = async () => {
    setBusy('reveal-admin');
    try {
      const res = await tenantsApi.getAdminCredentials(slug);
      setAdminCreds(res.data);
    } catch (err) {
      setAdminCreds(null);
      toast(err.message || 'No credentials on record — rotate to create one', 'warning');
    } finally {
      setBusy('');
    }
  };

  const rotateAdminCredentials = async () => {
    setBusy('rotate-admin');
    try {
      const res = await tenantsApi.rotateAdminCredentials(slug);
      setAdminCreds(res.data);
      toast(res.message || 'Admin credentials rotated');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy('');
    }
  };

  const deleteTenant = async () => {
    if (!window.confirm(
      `Permanently delete "${tenant.name}"? This drops its database and cannot be undone. ` +
      `Its subdomains' cached TLS certs must be cleared separately by an operator.`
    )) return;
    setBusy('delete');
    try {
      await tenantsApi.delete(slug);
      toast(`Tenant "${tenant.name}" deleted`);
      navigate('/tenants');
    } catch (err) {
      toast(err.message, 'error');
      setBusy('');
    }
  };

  const queueBuild = async (app, artifact) => {
    setBusy(`build-${app}-${artifact}`);
    try {
      await platformApi.queueBuild(slug, { app, artifact });
      toast(`${app === 'seller' ? 'Seller' : 'Buyer'} ${artifact.toUpperCase()} build queued`);
      load();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy('');
    }
  };

  if (loading) return <PageLoader />;
  if (!tenant) {
    return (
      <EmptyState
        icon={Building2}
        title="Tenant not found"
        action={<Link to="/tenants" className="btn-secondary">Back to tenants</Link>}
      />
    );
  }

  const urls = tenant.urls || {};
  const buyerAppId = tenant.android?.applicationId;
  const sellerAppId = tenant.androidSeller?.applicationId || (buyerAppId ? `${buyerAppId}.seller` : undefined);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/tenants" className="btn-secondary !px-2.5"><ArrowLeft className="w-4 h-4" /></Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-text-primary tracking-tight">{tenant.name}</h1>
              <StatusBadge status={tenant.status} />
            </div>
            <p className="text-[13px] text-text-secondary mt-0.5 font-mono">{tenant.slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="btn-secondary"><RefreshCw className="w-3.5 h-3.5" />Refresh</button>
          {(tenant.status === 'active' || tenant.status === 'suspended') && (
            <button
              onClick={toggleStatus}
              disabled={busy === 'status'}
              className={tenant.status === 'suspended' ? 'btn-primary' : 'btn-danger'}
            >
              {tenant.status === 'suspended'
                ? <><PlayCircle className="w-4 h-4" />Reactivate</>
                : <><PauseCircle className="w-4 h-4" />Suspend</>}
            </button>
          )}
          <button onClick={deleteTenant} disabled={busy === 'delete'} className="btn-danger">
            <Trash2 className="w-4 h-4" />
            {busy === 'delete' ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Info card */}
        <div className="console-card p-5">
          <div className="flex items-center gap-2 text-[13px] font-bold text-text-primary mb-3">
            <Building2 className="w-4 h-4 text-primary-light" /> Tenant info
          </div>
          <InfoRow label="Slug" value={tenant.slug} mono />
          <InfoRow label="Name" value={tenant.name} />
          <InfoRow label="Display name" value={tenant.branding?.displayName} />
          <InfoRow
            label="Primary color"
            value={
              tenant.branding?.primaryColor ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded border border-border-secondary inline-block" style={{ backgroundColor: tenant.branding.primaryColor }} />
                  <span className="font-mono text-[12px]">{tenant.branding.primaryColor}</span>
                </span>
              ) : '—'
            }
          />
          <InfoRow label="Created" value={formatDate(tenant.createdAt)} />
        </div>

        {/* URLs card */}
        <div className="console-card p-5">
          <div className="flex items-center gap-2 text-[13px] font-bold text-text-primary mb-3">
            <Link2 className="w-4 h-4 text-primary-light" /> URLs
          </div>
          {urls.store || urls.admin || urls.seller || urls.api ? (
            <div>
              {urls.store && <UrlRow label="Store" url={urls.store} />}
              {urls.admin && <UrlRow label="Admin" url={urls.admin} />}
              {urls.seller && <UrlRow label="Seller" url={urls.seller} />}
              {urls.api && <UrlRow label="API" url={urls.api} />}
            </div>
          ) : (
            <p className="text-[13px] text-text-tertiary py-4">No URLs available for this tenant.</p>
          )}
        </div>

        {/* DB config card */}
        <div className="console-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-[13px] font-bold text-text-primary">
              <Database className="w-4 h-4 text-primary-light" /> Database
            </div>
            <DbBadge onDefault={!!tenant.dbOnDefaultCluster} />
          </div>
          <InfoRow label="DB name" value={tenant.dbName} mono />

          <form onSubmit={rotateUri} className="mt-4 pt-4 border-t border-border-primary space-y-3">
            <label className="field-label !mb-0">Rotate MongoDB URI</label>
            <input
              value={mongoUri}
              onChange={e => setMongoUri(e.target.value)}
              placeholder="mongodb+srv://user:pass@cluster.mongodb.net"
              className="field-input font-mono"
            />
            <p className="text-[11px] text-text-tertiary">
              Replaces this tenant's connection string. The tenant is reconnected on the next request.
            </p>
            <button type="submit" disabled={busy === 'rotate'} className="btn-secondary">
              <RotateCw className={`w-3.5 h-3.5 ${busy === 'rotate' ? 'animate-spin' : ''}`} />
              {busy === 'rotate' ? 'Rotating…' : 'Rotate URI'}
            </button>
          </form>
        </div>

        {/* Admin login card */}
        <div className="console-card p-5">
          <div className="flex items-center gap-2 text-[13px] font-bold text-text-primary mb-3">
            <KeyRound className="w-4 h-4 text-primary-light" /> Admin login
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={revealAdminCredentials}
              disabled={busy === 'reveal-admin'}
              className="btn-secondary"
            >
              <Eye className="w-3.5 h-3.5" />
              {busy === 'reveal-admin' ? 'Revealing…' : 'Reveal'}
            </button>
            <button
              onClick={rotateAdminCredentials}
              disabled={busy === 'rotate-admin'}
              className="btn-secondary"
            >
              <RotateCw className={`w-3.5 h-3.5 ${busy === 'rotate-admin' ? 'animate-spin' : ''}`} />
              {busy === 'rotate-admin' ? 'Rotating…' : 'Rotate'}
            </button>
          </div>
          <p className="text-[11px] text-text-tertiary mt-2">
            Reveal shows the current login if one exists. Rotate generates a new password
            (creates the login if this tenant doesn't have one yet).
          </p>

          {adminCreds && (
            <div className="mt-4 rounded-xl border border-warning/40 bg-warning/10 p-4 space-y-3">
              <div className="flex items-start gap-2 text-warning">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <p className="text-[13px] font-bold">Visible now — treat as sensitive</p>
              </div>
              <div className="rounded-lg border border-border-primary bg-bg-inset px-4 py-2">
                <CredRow label="Email" value={adminCreds.email} />
                <CredRow label="Password" value={adminCreds.password} />
              </div>
            </div>
          )}
        </div>

        {/* Android app card */}
        <div className="console-card p-5">
          <div className="flex items-center gap-2 text-[13px] font-bold text-text-primary mb-4">
            <Smartphone className="w-4 h-4 text-primary-light" /> Android apps
          </div>

          <div className="space-y-4">
            <AppBuildGroup
              title="Buyer App"
              app="buyer"
              packageId={buyerAppId}
              busy={busy}
              onBuild={queueBuild}
            />
            <div className="pt-4 border-t border-border-primary">
              <AppBuildGroup
                title="Seller App"
                app="seller"
                packageId={sellerAppId}
                busy={busy}
                onBuild={queueBuild}
              />
            </div>
          </div>
        </div>

        {/* Premium add-ons */}
        <div className="console-card p-5">
          <div className="flex items-center gap-2 text-[13px] font-bold text-text-primary mb-1">
            <Sparkles className="w-4 h-4 text-primary-light" /> Premium Add-ons
          </div>
          <p className="text-[12px] text-text-tertiary mb-3">
            PO-only toggles — never self-serve from the tenant's own admin panel.
          </p>
          <Toggle
            enabled={!!tenant.addons?.aiProductReview?.enabled}
            onChange={toggleAiReviewAddon}
            label="AI Product Review"
            subLabel="₹599/month — Vertex AI checks new listings for consistency before they go live"
          />
        </div>
      </div>

      {/* Build history */}
      <div className="console-card overflow-hidden">
        <div className="flex items-center gap-2 text-[13px] font-bold text-text-primary p-5 pb-3">
          <Package className="w-4 h-4 text-primary-light" /> Build history
        </div>
        {buildList.length === 0 ? (
          <p className="text-[13px] text-text-tertiary px-5 pb-6">No builds queued for this tenant yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-bg-inset border-y border-border-primary">
                <tr>
                  <th className="table-head">App</th>
                  <th className="table-head">Artifact</th>
                  <th className="table-head">Version</th>
                  <th className="table-head">Status</th>
                  <th className="table-head">Queued</th>
                  <th className="table-head text-right">Output</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-primary">
                {buildList.map(b => (
                  <tr key={b._id} className="hover:bg-bg-raised/40 transition-colors">
                    <td className="table-cell"><AppBadge app={b.app} /></td>
                    <td className="table-cell font-mono text-[12px] uppercase font-semibold">{b.artifact}</td>
                    <td className="table-cell font-mono text-[12px]">
                      {b.versionName || '—'}{b.versionCode != null ? ` (${b.versionCode})` : ''}
                    </td>
                    <td className="table-cell">
                      <StatusBadge status={b.status} />
                      {b.status === 'failed' && b.error && (
                        <div className="text-[11px] text-danger mt-1 max-w-[320px] truncate" title={b.error}>{b.error}</div>
                      )}
                    </td>
                    <td className="table-cell text-text-secondary">{formatDate(b.createdAt)}</td>
                    <td className="table-cell text-right">
                      {b.status === 'succeeded' ? (
                        <BuildDownloadButton id={b._id} />
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
