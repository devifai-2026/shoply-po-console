import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Rocket, Palette, Smartphone, Database, Upload, Loader2, AlertTriangle } from 'lucide-react';
import { tenants as tenantsApi } from '../services/api';
import { UrlRow, CredRow } from '../components/common/UI.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import { SERVER_URL } from '../config';

const PACKAGE_RE = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/;

export const TenantNew = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    appName: '',
    packageName: '',
    brandName: '',
    brandLogo: '',
    primaryColor: '#6D28D9',
    mongoUri: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const packageValid = !form.packageName || PACKAGE_RE.test(form.packageName);

  const pickLogo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const res = await tenantsApi.uploadLogo(file);
      setForm(f => ({ ...f, brandLogo: `${SERVER_URL}${res.data.url}` }));
    } catch (err) {
      toast(err.message || 'Failed to upload logo', 'error');
    } finally {
      setUploadingLogo(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (!PACKAGE_RE.test(form.packageName)) {
      setError('Package name must look like a reverse-domain identifier (e.g. com.acme.shop).');
      return;
    }

    setLoading(true);
    try {
      const body = {
        appName: form.appName.trim(),
        packageName: form.packageName.trim(),
        brandName: form.brandName.trim(),
        brandLogo: form.brandLogo,
        primaryColor: form.primaryColor,
        mongoUri: form.mongoUri.trim() || undefined,
      };

      const res = await tenantsApi.create(body);
      setCreated(res.data);
      toast(`Tenant "${res.data?.slug || form.brandName}" provisioned`);
    } catch (err) {
      setError(err.message || 'Failed to create tenant');
    } finally {
      setLoading(false);
    }
  };

  // ─── Success screen: show URLs prominently ────────────────────────────────
  if (created) {
    const urls = created.urls || {};
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="console-card p-8 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-success/10 border border-success/30 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-7 h-7 text-success" />
          </div>
          <h1 className="text-xl font-bold text-text-primary tracking-tight">
            Tenant "{created.slug}" is live
          </h1>
          <p className="text-[13px] text-text-secondary mt-1">
            {created.name} has been provisioned. Share these URLs with the store owner.
          </p>

          <div className="text-left mt-6 rounded-xl border border-border-primary bg-bg-inset px-4 py-2">
            {urls.store && <UrlRow label="Store" url={urls.store} />}
            {urls.admin && <UrlRow label="Admin" url={urls.admin} />}
            {urls.seller && <UrlRow label="Seller" url={urls.seller} />}
            {urls.api && <UrlRow label="API" url={urls.api} />}
          </div>

          {created.adminCredentials && (
            <div className="text-left mt-4 rounded-xl border border-warning/40 bg-warning/10 p-4 space-y-3">
              <div className="flex items-start gap-2 text-warning">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <p className="text-[13px] font-bold">Admin login — save this now, shown only once here</p>
              </div>
              <div className="rounded-lg border border-border-primary bg-bg-inset px-4 py-2">
                <CredRow label="Email" value={created.adminCredentials.email} />
                <CredRow label="Password" value={created.adminCredentials.password} />
              </div>
              <p className="text-[11px] text-text-tertiary">
                You can reveal or rotate this later from the tenant's detail page.
              </p>
            </div>
          )}

          <div className="flex items-center justify-center gap-3 mt-6">
            <button onClick={() => navigate(`/tenants/${created.slug}`)} className="btn-primary">
              Open tenant detail
            </button>
            <Link to="/tenants" className="btn-secondary">Back to tenants</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/tenants" className="btn-secondary !px-2.5"><ArrowLeft className="w-4 h-4" /></Link>
        <div>
          <h1 className="text-xl font-bold text-text-primary tracking-tight">New tenant</h1>
          <p className="text-[13px] text-text-secondary mt-0.5">Provision a new storefront on the platform</p>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-5">
        {error && (
          <div className="px-4 py-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-[13px] font-medium">
            {error}
          </div>
        )}

        <p className="text-[12px] text-text-secondary bg-bg-inset border border-border-primary rounded-lg px-4 py-3">
          Slug, database and store-admin login are provisioned automatically. The store admin configures everything else.
        </p>

        {/* App */}
        <div className="console-card p-5 space-y-4">
          <div className="flex items-center gap-2 text-[13px] font-bold text-text-primary">
            <Smartphone className="w-4 h-4 text-primary-light" /> App
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="field-label">App name *</label>
              <input required value={form.appName} onChange={set('appName')} placeholder="Acme Shopping" className="field-input" />
            </div>
            <div>
              <label className="field-label">Package name *</label>
              <input
                required
                value={form.packageName}
                onChange={e => setForm(f => ({ ...f, packageName: e.target.value.toLowerCase() }))}
                placeholder="com.acme.shop"
                className={`field-input font-mono ${!packageValid ? '!border-danger/60' : ''}`}
              />
              <p className={`text-[11px] mt-1.5 ${packageValid ? 'text-text-tertiary' : 'text-danger'}`}>
                Reverse-domain identifier (e.g. com.acme.shop).
              </p>
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className="console-card p-5 space-y-4">
          <div className="flex items-center gap-2 text-[13px] font-bold text-text-primary">
            <Palette className="w-4 h-4 text-primary-light" /> Branding
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="field-label">Brand name *</label>
              <input required value={form.brandName} onChange={set('brandName')} placeholder="Acme" className="field-input" />
            </div>
            <div>
              <label className="field-label">Primary color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.primaryColor}
                  onChange={set('primaryColor')}
                  className="w-10 h-10 rounded-lg border border-border-primary bg-bg-inset cursor-pointer p-1"
                />
                <input
                  value={form.primaryColor}
                  onChange={set('primaryColor')}
                  className="field-input font-mono flex-1"
                  placeholder="#6D28D9"
                />
              </div>
            </div>
          </div>
          <div>
            <label className="field-label">Brand logo</label>
            <div className="flex items-center gap-3">
              <label className="field-input font-mono flex-1 cursor-pointer flex items-center gap-2 text-text-tertiary">
                {uploadingLogo
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
                  : <><Upload className="w-4 h-4" /> {form.brandLogo ? 'Change logo' : 'Choose an image…'}</>}
                <input type="file" accept="image/*" onChange={pickLogo} className="hidden" />
              </label>
              {form.brandLogo && (
                <img
                  src={form.brandLogo}
                  alt="Brand logo preview"
                  className="w-10 h-10 rounded-lg border border-border-primary bg-bg-inset object-contain shrink-0"
                />
              )}
            </div>
          </div>
        </div>

        {/* Database */}
        <div className="console-card p-5 space-y-4">
          <div className="flex items-center gap-2 text-[13px] font-bold text-text-primary">
            <Database className="w-4 h-4 text-primary-light" /> Database
          </div>
          <div>
            <label className="field-label">MongoDB URI (optional)</label>
            <input
              value={form.mongoUri}
              onChange={set('mongoUri')}
              placeholder="mongodb+srv://user:pass@cluster.mongodb.net"
              className="field-input font-mono"
            />
            <p className="text-[11px] text-text-tertiary mt-1.5">
              Leave blank to use a database on the platform's default cluster. Set this to give the
              tenant its own dedicated cluster/instance for load isolation — can also be set later
              from the tenant's detail page.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Link to="/tenants" className="btn-secondary">Cancel</Link>
          <button type="submit" disabled={loading} className="btn-primary">
            <Rocket className="w-4 h-4" />
            {loading ? 'Provisioning…' : 'Create tenant'}
          </button>
        </div>
      </form>
    </div>
  );
};
