import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, Building2, Hammer, KeyRound, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';

const NAV = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/analytics', label: 'Analytics', icon: TrendingUp },
  { to: '/tenants', label: 'Tenants', icon: Building2 },
  { to: '/builds', label: 'Builds', icon: Hammer },
  { to: '/keystore', label: 'Keystore', icon: KeyRound },
  { to: '/ai-review-prompt', label: 'AI Review Prompt', icon: Sparkles },
];

export const Sidebar = () => (
  <aside className="w-56 shrink-0 bg-bg-inset border-r border-border-primary flex flex-col">
    <div className="h-[64px] flex items-center gap-2.5 px-5 border-b border-border-primary">
      <div className="w-8 h-8 bg-primary rounded-lg shadow-lg shadow-primary/25 flex items-center justify-center">
        <span className="text-white font-black text-sm">PO</span>
      </div>
      <div>
        <div className="text-[14px] font-bold text-text-primary tracking-tight leading-none">PO Console</div>
        <div className="text-[10px] text-text-tertiary font-medium uppercase tracking-wider mt-1">Platform Owner</div>
      </div>
    </div>

    <nav className="flex-1 py-4 px-3 space-y-1">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-semibold transition-colors',
              isActive
                ? 'bg-primary/15 text-primary-light border border-primary/25'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-raised border border-transparent'
            )
          }
        >
          <Icon className="w-4 h-4" />
          {label}
        </NavLink>
      ))}
    </nav>

    <div className="px-5 py-4 border-t border-border-primary">
      <div className="flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-success pulse-dot" />
        <span className="text-[10px] text-text-tertiary font-medium uppercase tracking-wider">Console Online</span>
      </div>
    </div>
  </aside>
);
