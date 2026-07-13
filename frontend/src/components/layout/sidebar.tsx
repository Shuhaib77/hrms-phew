'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore, useSidebarStore } from '@/lib/store';
import {
  LayoutDashboard, Users, Clock, CalendarDays, DollarSign,
  BarChart3, Briefcase, Building2, Settings, LogOut,
  ChevronLeft, ChevronRight, Award, Calendar
} from 'lucide-react';

const navItems = [
  { section: 'Main', items: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE'] },
    { label: 'Attendance', href: '/attendance', icon: Clock, roles: ['ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE'] },
    { label: 'Leave', href: '/leave', icon: CalendarDays, roles: ['ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE'] },
    { label: 'Calendar', href: '/calendar', icon: Calendar, roles: ['ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE'] },
  ]},
  { section: 'Management', items: [
    { label: 'Employees', href: '/employees', icon: Users, roles: ['ADMIN', 'HR_MANAGER', 'MANAGER'] },
    { label: 'Performance', href: '/performance', icon: Award, roles: ['ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE'] },
    { label: 'Tasks & Projects', href: '/tasks', icon: Briefcase, roles: ['ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE'] },
  ]},
  { section: 'Payroll', items: [
    { label: 'Payslips', href: '/payroll', icon: DollarSign, roles: ['ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE'] },
    { label: 'Reports', href: '/reports', icon: BarChart3, roles: ['ADMIN', 'HR_MANAGER'] },
  ]},
  { section: 'Admin', items: [
    { label: 'Locations', href: '/locations', icon: Building2, roles: ['ADMIN', 'HR_MANAGER'] },
    { label: 'Settings', href: '/settings', icon: Settings, roles: ['ADMIN', 'HR_MANAGER'] },
  ]},
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { collapsed, toggle } = useSidebarStore();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <aside className={cn(
      'fixed left-0 top-0 z-40 h-screen bg-surface border-r border-border flex flex-col transition-all duration-200',
      collapsed ? 'w-16' : 'w-60'
    )}>
      <div className={cn('flex items-center h-16 px-4 border-b border-border', collapsed && 'justify-center')}>
        {collapsed ? (
          <div className="h-8 w-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-sm">P</div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-sm">P</div>
            <span className="font-semibold text-text">Phew HRMS</span>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
        {navItems.map((group) => {
          const visibleItems = group.items.filter(item => user && item.roles.includes(user.role));
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.section}>
              {!collapsed && (
                <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-text-tertiary">{group.section}</p>
              )}
              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        collapsed && 'justify-center px-2',
                        isActive
                          ? 'bg-brand-50 text-brand-700'
                          : 'text-text-secondary hover:bg-surface-tertiary hover:text-text'
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-border p-2 space-y-1">
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface-tertiary hover:text-text transition-colors w-full',
            collapsed && 'justify-center px-2'
          )}
          title="Logout"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
        <button
          onClick={toggle}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-text-tertiary hover:bg-surface-tertiary transition-colors w-full',
            collapsed && 'justify-center px-2'
          )}
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
