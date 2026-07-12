import React from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';

const getInitials = (name) => {
  if (!name) return 'PO';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export const Topbar = () => {
  const { owner, logout } = useAuth();

  return (
    <header className="h-[64px] bg-bg-surface/80 backdrop-blur-md border-b border-border-primary flex items-center justify-between px-6 shrink-0 sticky top-0 z-10">
      <div className="text-[15px] font-bold text-text-primary tracking-tight">PO Console</div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center text-[12px] font-bold text-primary-light">
            {getInitials(owner?.name)}
          </div>
          <div className="hidden sm:block">
            <div className="text-[13px] font-semibold text-text-primary leading-tight">{owner?.name || 'Platform Owner'}</div>
            <div className="text-[11px] text-text-tertiary">{owner?.email || ''}</div>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-semibold text-danger hover:bg-danger/10 border border-transparent hover:border-danger/25 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </header>
  );
};
