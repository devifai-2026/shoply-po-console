import React, { useState } from 'react';
import { Copy, Check, ExternalLink, Download, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { platform as platformApi } from '../../services/api';
import { useToast } from '../../contexts/ToastContext.jsx';

// ─── Status badge (tenant + build statuses) ──────────────────────────────────
const STATUS_STYLES = {
  active:       'bg-success/10 text-success border-success/30',
  suspended:    'bg-danger/10 text-danger border-danger/30',
  provisioning: 'bg-warning/10 text-warning border-warning/30',
  deleted:      'bg-slate-500/10 text-slate-400 border-slate-500/30',
  queued:       'bg-slate-500/10 text-slate-300 border-slate-500/30',
  dispatched:   'bg-info/10 text-info border-info/30',
  running:      'bg-primary/10 text-primary-light border-primary/30',
  succeeded:    'bg-success/10 text-success border-success/30',
  failed:       'bg-danger/10 text-danger border-danger/30',
};

const PULSING = new Set(['provisioning', 'running', 'dispatched', 'queued']);

export const StatusBadge = ({ status }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold capitalize',
      STATUS_STYLES[status] || 'bg-slate-500/10 text-slate-400 border-slate-500/30'
    )}
  >
    <span className={cn('w-1.5 h-1.5 rounded-full bg-current', PULSING.has(status) && 'pulse-dot')} />
    {status || 'unknown'}
  </span>
);

// ─── Stat card ───────────────────────────────────────────────────────────────
export const StatCard = ({ icon: Icon, label, value, sub, accent = 'text-primary-light' }) => (
  <div className="console-card p-5 flex items-start gap-4">
    <div className={cn('w-10 h-10 rounded-xl bg-bg-raised border border-border-primary flex items-center justify-center shrink-0', accent)}>
      {Icon && <Icon className="w-5 h-5" />}
    </div>
    <div className="min-w-0">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">{label}</div>
      <div className="text-2xl font-bold text-text-primary leading-tight mt-0.5">{value ?? '—'}</div>
      {sub && <div className="text-[12px] text-text-secondary mt-0.5">{sub}</div>}
    </div>
  </div>
);

// ─── Copy button ─────────────────────────────────────────────────────────────
export const CopyButton = ({ text, className }) => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={copy}
      title="Copy to clipboard"
      className={cn(
        'p-1.5 rounded-md text-text-tertiary hover:text-text-primary hover:bg-bg-raised transition-colors cursor-pointer shrink-0',
        copied && 'text-success hover:text-success',
        className
      )}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
};

// ─── Credential row (label + mono value + copy) ──────────────────────────────
export const CredRow = ({ label, value }) => (
  <div className="flex items-center gap-2 py-2 border-b border-border-primary last:border-0 min-w-0">
    <span className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary w-32 shrink-0">{label}</span>
    <span className="text-[13px] font-mono text-text-primary truncate flex-1 min-w-0">{value}</span>
    <CopyButton text={value} />
  </div>
);

// ─── URL row with copy + open ────────────────────────────────────────────────
export const UrlRow = ({ label, url }) => (
  <div className="flex items-center gap-2 py-2 border-b border-border-primary last:border-0 min-w-0">
    <span className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary w-14 shrink-0">{label}</span>
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="text-[13px] font-mono text-primary-light hover:underline truncate flex-1 min-w-0"
    >
      {url}
    </a>
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="p-1.5 rounded-md text-text-tertiary hover:text-text-primary hover:bg-bg-raised transition-colors shrink-0"
      title="Open in new tab"
    >
      <ExternalLink className="w-3.5 h-3.5" />
    </a>
    <CopyButton text={url} />
  </div>
);

// ─── Spinner ─────────────────────────────────────────────────────────────────
export const Spinner = ({ className }) => (
  <div className={cn('w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin', className)} />
);

export const PageLoader = () => (
  <div className="flex items-center justify-center py-24">
    <Spinner />
  </div>
);

// ─── Empty state ─────────────────────────────────────────────────────────────
export const EmptyState = ({ icon: Icon, title, sub, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    {Icon && (
      <div className="w-12 h-12 rounded-2xl bg-bg-raised border border-border-primary flex items-center justify-center text-text-tertiary mb-3">
        <Icon className="w-6 h-6" />
      </div>
    )}
    <div className="text-[14px] font-semibold text-text-primary">{title}</div>
    {sub && <div className="text-[13px] text-text-secondary mt-1 max-w-sm">{sub}</div>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

// ─── App badge (buyer vs seller) ─────────────────────────────────────────────
const APP_STYLES = {
  buyer:  'bg-info/10 text-info border-info/30',
  seller: 'bg-primary/10 text-primary-light border-primary/30',
};

export const AppBadge = ({ app }) => (
  <span
    className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-semibold capitalize',
      APP_STYLES[app] || 'bg-slate-500/10 text-slate-400 border-slate-500/30'
    )}
  >
    {app || 'buyer'}
  </span>
);

// ─── Build download button (fetches short-lived signed URL on click) ─────────
export const BuildDownloadButton = ({ id }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const download = async () => {
    setLoading(true);
    try {
      const res = await platformApi.buildDownload(id);
      const url = res?.data?.url;
      if (!url) throw new Error('No download URL returned');
      window.open(url, '_blank');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button type="button" onClick={download} disabled={loading} className="btn-secondary !py-1.5">
      {loading
        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
        : <Download className="w-3.5 h-3.5" />}
      Download
    </button>
  );
};

// ─── DB badge (default cluster vs custom URI) ────────────────────────────────
export const DbBadge = ({ onDefault }) => (
  <span
    className={cn(
      'inline-flex items-center px-2.5 py-1 rounded-full border text-[11px] font-semibold',
      onDefault
        ? 'bg-primary/10 text-primary-light border-primary/30'
        : 'bg-warning/10 text-warning border-warning/30'
    )}
  >
    {onDefault ? 'Default cluster' : 'Custom URI'}
  </span>
);
