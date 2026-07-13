import React, { useEffect, useState } from 'react';
import { Sparkles, Save, FlaskConical } from 'lucide-react';
import { aiPrompt as aiPromptApi } from '../services/api';
import { PageLoader } from '../components/common/UI.jsx';
import { useToast } from '../contexts/ToastContext.jsx';

const Field = ({ label, hint, ...props }) => (
  <div>
    <label className="field-label">{label}</label>
    <input className="field-input" {...props} />
    {hint && <p className="text-[11px] text-text-tertiary mt-1.5">{hint}</p>}
  </div>
);

export const AiReviewPrompt = () => {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [sample, setSample] = useState({ name: '', description: '', category: '', brand: '' });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    aiPromptApi.get()
      .then(res => setPrompt(res.data?.prompt || ''))
      .catch(err => toast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const savePrompt = async () => {
    setSaving(true);
    try {
      await aiPromptApi.update({ prompt });
      toast('Prompt saved — takes effect on the very next product submission');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const setSampleField = (key) => (e) => setSample(s => ({ ...s, [key]: e.target.value }));

  const runTest = async (e) => {
    e.preventDefault();
    if (!sample.name.trim()) {
      toast('Sample product name is required', 'error');
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await aiPromptApi.test(sample);
      setTestResult(res.data);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setTesting(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-bg-raised border border-border-primary flex items-center justify-center text-primary-light shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text-primary tracking-tight">AI Product Review Prompt</h1>
          <p className="text-[13px] text-text-secondary mt-0.5">
            Platform-wide — shared by every tenant with the AI Product Review add-on enabled.
            Always read fresh from the database at review time; saving here takes effect immediately, no redeploy.
          </p>
        </div>
      </div>

      {/* Prompt editor */}
      <div className="console-card p-5 space-y-4">
        <div className="flex items-center gap-2 text-[13px] font-bold text-text-primary">
          <Sparkles className="w-4 h-4 text-primary-light" /> System Prompt
        </div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={14}
          placeholder="Describe how the AI should judge whether a submitted product's text and images are consistent with the rest of that vendor's catalog…"
          className="field-input h-auto font-mono text-[12px] leading-relaxed resize-y"
        />
        <div className="flex justify-end">
          <button onClick={savePrompt} disabled={saving} className="btn-primary">
            <Save className="w-4 h-4" />
            {saving ? 'Saving…' : 'Save Prompt'}
          </button>
        </div>
      </div>

      {/* Test panel */}
      <form onSubmit={runTest} className="console-card p-5 space-y-4">
        <div className="flex items-center gap-2 text-[13px] font-bold text-text-primary">
          <FlaskConical className="w-4 h-4 text-primary-light" /> Test Prompt
        </div>
        <p className="text-[12px] text-text-tertiary -mt-2">
          Runs the CURRENTLY SAVED prompt (save first if you've made edits) against a sample product you provide here. No real tenant data is touched.
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Product name" value={sample.name} onChange={setSampleField('name')} placeholder="e.g. Wireless Bluetooth Earbuds" />
          <Field label="Category" value={sample.category} onChange={setSampleField('category')} placeholder="e.g. Electronics" />
          <Field label="Brand" value={sample.brand} onChange={setSampleField('brand')} placeholder="Optional" hint="Optional" />
          <div />
        </div>
        <div>
          <label className="field-label">Description</label>
          <textarea
            value={sample.description}
            onChange={setSampleField('description')}
            rows={3}
            className="field-input h-auto resize-y"
            placeholder="Paste a sample product description…"
          />
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={testing} className="btn-primary">
            <FlaskConical className="w-4 h-4" />
            {testing ? 'Running…' : 'Run Test'}
          </button>
        </div>

        {testResult && (
          <div className={`rounded-xl border p-4 space-y-2 ${
            testResult.verdict === 'approve'
              ? 'border-success/40 bg-success/10'
              : 'border-warning/40 bg-warning/10'
          }`}>
            <div className={`text-[13px] font-bold uppercase tracking-wide ${
              testResult.verdict === 'approve' ? 'text-success' : 'text-warning'
            }`}>
              Verdict: {testResult.verdict}
              {testResult.confidence != null && ` (${Math.round(testResult.confidence * 100)}% confidence)`}
            </div>
            <p className="text-[13px] text-text-primary">{testResult.reason}</p>
            {testResult.raw && (
              <details className="text-[11px] text-text-tertiary">
                <summary className="cursor-pointer font-semibold">Raw model response</summary>
                <pre className="whitespace-pre-wrap mt-2 font-mono">{testResult.raw}</pre>
              </details>
            )}
          </div>
        )}
      </form>
    </div>
  );
};
