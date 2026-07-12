import React, { useEffect, useState } from 'react';
import { KeyRound, ShieldCheck, ShieldAlert, Sparkles, Upload, AlertTriangle } from 'lucide-react';
import { keystore as keystoreApi } from '../services/api';
import { CredRow, PageLoader } from '../components/common/UI.jsx';
import { useToast } from '../contexts/ToastContext.jsx';

// Read a File into a base64 string (without the data: prefix).
const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const bytes = new Uint8Array(reader.result);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      resolve(btoa(binary));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });

const Field = ({ label, hint, ...props }) => (
  <div>
    <label className="field-label">{label}</label>
    <input className="field-input" {...props} />
    {hint && <p className="text-[11px] text-text-tertiary mt-1.5">{hint}</p>}
  </div>
);

export const Keystore = () => {
  const { toast } = useToast();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Generate panel state
  const [gen, setGen] = useState({ keyAlias: 'release', cn: '', org: '', storePassword: '', keyPassword: '' });
  const [generating, setGenerating] = useState(false);
  const [credentials, setCredentials] = useState(null);

  // Upload panel state
  const [up, setUp] = useState({ storePassword: '', keyAlias: '', keyPassword: '' });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await keystoreApi.get();
      setStatus(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load keystore status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const setGenField = (key) => (e) => setGen(g => ({ ...g, [key]: e.target.value }));
  const setUpField  = (key) => (e) => setUp(u => ({ ...u, [key]: e.target.value }));

  const submitGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const body = { keyAlias: gen.keyAlias.trim() || 'release' };
      if (gen.cn.trim()) body.cn = gen.cn.trim();
      if (gen.org.trim()) body.org = gen.org.trim();
      if (gen.storePassword) body.storePassword = gen.storePassword;
      if (gen.keyPassword) body.keyPassword = gen.keyPassword;

      const res = await keystoreApi.generate(body);
      setCredentials(res.credentials || null);
      toast(res.message || 'Keystore generated');
      await load();
    } catch (err) {
      toast(err.message || 'Failed to generate keystore', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const submitUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      toast('Select a keystore file first', 'error');
      return;
    }
    setUploading(true);
    try {
      const keystoreB64 = await fileToBase64(file);
      const body = {
        keystoreB64,
        storePassword: up.storePassword,
        keyAlias: up.keyAlias.trim(),
        keyPassword: up.keyPassword,
        fileName: file.name,
      };
      const res = await keystoreApi.upload(body);
      toast(res.message || 'Keystore uploaded');
      setFile(null);
      setUp({ storePassword: '', keyAlias: '', keyPassword: '' });
      await load();
    } catch (err) {
      toast(err.message || 'Failed to upload keystore', 'error');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <PageLoader />;

  const hasKeystore = !!status?.hasKeystore;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-bg-raised border border-border-primary flex items-center justify-center text-primary-light shrink-0">
          <KeyRound className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text-primary tracking-tight">Keystore</h1>
          <p className="text-[13px] text-text-secondary mt-0.5">Android app signing key used for every tenant APK build</p>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-[13px] font-medium">
          {error}
        </div>
      )}

      {/* ─── Status card ──────────────────────────────────────────────────── */}
      <div className="console-card p-5 space-y-4">
        <div className="flex items-center gap-2 text-[13px] font-bold text-text-primary">
          {hasKeystore
            ? <ShieldCheck className="w-4 h-4 text-success" />
            : <ShieldAlert className="w-4 h-4 text-warning" />}
          {hasKeystore ? 'Keystore configured' : 'No keystore configured'}
        </div>

        {hasKeystore ? (
          <div className="rounded-xl border border-border-primary bg-bg-inset px-4 py-2">
            {status?.keyAlias   && <CredRow label="Key alias"   value={status.keyAlias} />}
            {status?.fingerprint && <CredRow label="Fingerprint" value={status.fingerprint} />}
            {status?.fileName   && <CredRow label="File name"   value={status.fileName} />}
            {status?.name       && <CredRow label="Name"        value={status.name} />}
            {status?.updatedAt  && (
              <CredRow label="Last updated" value={new Date(status.updatedAt).toLocaleString()} />
            )}
          </div>
        ) : (
          <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-warning/10 border border-warning/30 text-warning">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <p className="text-[13px] font-medium">
              Tenant APK builds will fail until a signing keystore is set. Generate a new keystore or upload an existing one below.
            </p>
          </div>
        )}
      </div>

      {/* ─── Generate panel ──────────────────────────────────────────────── */}
      <form onSubmit={submitGenerate} className="console-card p-5 space-y-4">
        <div className="flex items-center gap-2 text-[13px] font-bold text-text-primary">
          <Sparkles className="w-4 h-4 text-primary-light" /> Generate a new keystore
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Key alias" value={gen.keyAlias} onChange={setGenField('keyAlias')} placeholder="release" />
          <div />
          <Field label="Common name (CN)" value={gen.cn} onChange={setGenField('cn')} placeholder="Acme Shopping" hint="Optional" />
          <Field label="Organization" value={gen.org} onChange={setGenField('org')} placeholder="Acme Inc." hint="Optional" />
          <Field
            label="Store password" type="password" value={gen.storePassword}
            onChange={setGenField('storePassword')} placeholder="••••••••"
            hint="Leave blank to auto-generate"
          />
          <Field
            label="Key password" type="password" value={gen.keyPassword}
            onChange={setGenField('keyPassword')} placeholder="••••••••"
            hint="Leave blank to auto-generate"
          />
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={generating} className="btn-primary">
            <Sparkles className="w-4 h-4" />
            {generating ? 'Generating…' : 'Generate keystore'}
          </button>
        </div>

        {credentials && (
          <div className="rounded-xl border border-warning/40 bg-warning/10 p-4 space-y-3">
            <div className="flex items-start gap-2 text-warning">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <p className="text-[13px] font-bold">Save these now — shown only once</p>
            </div>
            <div className="rounded-lg border border-border-primary bg-bg-inset px-4 py-2">
              <CredRow label="Key alias"      value={credentials.keyAlias} />
              <CredRow label="Store password" value={credentials.storePassword} />
              <CredRow label="Key password"   value={credentials.keyPassword} />
            </div>
          </div>
        )}
      </form>

      {/* ─── Upload panel ────────────────────────────────────────────────── */}
      <form onSubmit={submitUpload} className="console-card p-5 space-y-4">
        <div className="flex items-center gap-2 text-[13px] font-bold text-text-primary">
          <Upload className="w-4 h-4 text-primary-light" /> Upload an existing keystore
        </div>

        <div>
          <label className="field-label">Keystore file</label>
          <input
            type="file"
            accept=".jks,.keystore"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="field-input file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-[12px] file:font-semibold file:bg-primary/15 file:text-primary-light cursor-pointer"
          />
          {file && <p className="text-[11px] text-text-tertiary mt-1.5 font-mono">{file.name}</p>}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Key alias" value={up.keyAlias} onChange={setUpField('keyAlias')} placeholder="release" />
          <div />
          <Field label="Store password" type="password" value={up.storePassword} onChange={setUpField('storePassword')} placeholder="••••••••" />
          <Field label="Key password" type="password" value={up.keyPassword} onChange={setUpField('keyPassword')} placeholder="••••••••" />
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={uploading} className="btn-primary">
            <Upload className="w-4 h-4" />
            {uploading ? 'Uploading…' : 'Upload keystore'}
          </button>
        </div>
      </form>
    </div>
  );
};
