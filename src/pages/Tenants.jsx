import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, RefreshCw, Building2, ExternalLink, PauseCircle, PlayCircle } from 'lucide-react';
import { tenants as tenantsApi } from '../services/api';
import { StatusBadge, DbBadge, PageLoader, EmptyState } from '../components/common/UI.jsx';
import { useToast } from '../contexts/ToastContext.jsx';

export const Tenants = () => {
  const { toast } = useToast();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);

  const load = () => {
    tenantsApi.list()
      .then(res => setList(res.data || []))
      .catch(err => toast(err.message, 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const toggleStatus = async (tenant) => {
    const action = tenant.status === 'suspended' ? 'reactivate' : 'suspend';
    setBusy(tenant.slug);
    try {
      await tenantsApi[action](tenant.slug);
      toast(`Tenant "${tenant.slug}" ${action === 'suspend' ? 'suspended' : 'reactivated'}`);
      load();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(null);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary tracking-tight">Tenants</h1>
          <p className="text-[13px] text-text-secondary mt-0.5">{list.length} tenant{list.length !== 1 ? 's' : ''} provisioned</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setLoading(true); load(); }} className="btn-secondary">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <Link to="/tenants/new" className="btn-primary">
            <Plus className="w-4 h-4" />
            New tenant
          </Link>
        </div>
      </div>

      <div className="console-card overflow-hidden">
        {list.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No tenants yet"
            sub="Provision your first storefront tenant to get started."
            action={<Link to="/tenants/new" className="btn-primary"><Plus className="w-4 h-4" />Create tenant</Link>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-bg-inset border-b border-border-primary">
                <tr>
                  <th className="table-head">Slug</th>
                  <th className="table-head">Name</th>
                  <th className="table-head">Status</th>
                  <th className="table-head">Database</th>
                  <th className="table-head">URLs</th>
                  <th className="table-head text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-primary">
                {list.map(t => (
                  <tr key={t._id || t.slug} className="hover:bg-bg-raised/40 transition-colors">
                    <td className="table-cell">
                      <Link to={`/tenants/${t.slug}`} className="font-mono text-[12px] font-semibold text-primary-light hover:underline">
                        {t.slug}
                      </Link>
                    </td>
                    <td className="table-cell">
                      <div className="font-semibold">{t.name}</div>
                      {t.branding?.displayName && t.branding.displayName !== t.name && (
                        <div className="text-[11px] text-text-tertiary">{t.branding.displayName}</div>
                      )}
                    </td>
                    <td className="table-cell"><StatusBadge status={t.status} /></td>
                    <td className="table-cell"><DbBadge onDefault={!!t.dbOnDefaultCluster} /></td>
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        {t.urls?.store && (
                          <a href={t.urls.store} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[12px] text-primary-light hover:underline">
                            Store <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {t.urls?.admin && (
                          <a href={t.urls.admin} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[12px] text-primary-light hover:underline">
                            Admin <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="table-cell text-right">
                      {(t.status === 'active' || t.status === 'suspended') && (
                        <button
                          onClick={() => toggleStatus(t)}
                          disabled={busy === t.slug}
                          className={t.status === 'suspended' ? 'btn-secondary !py-1.5' : 'btn-danger !py-1.5'}
                        >
                          {t.status === 'suspended'
                            ? <><PlayCircle className="w-3.5 h-3.5" />Reactivate</>
                            : <><PauseCircle className="w-3.5 h-3.5" />Suspend</>}
                        </button>
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
