'use client';

import { useAuthStore, useSidebarStore, useNotificationStore } from '@/lib/store';
import { Avatar } from '@/components/ui';
import { Bell, Search, Menu, ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui';
import { useRouter } from 'next/navigation';

export function Topbar({ title }: { title?: string }) {
  const { user, logout } = useAuthStore();
  const { toggle } = useSidebarStore();
  const { count } = useNotificationStore();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-surface/80 backdrop-blur-md border-b border-border">
      <div className="flex items-center gap-4">
        <button onClick={toggle} className="p-2 rounded-lg hover:bg-surface-tertiary text-text-secondary transition-colors lg:hidden">
          <Menu className="h-5 w-5" />
        </button>
        {title && <h1 className="text-lg font-semibold text-text">{title}</h1>}
      </div>

      <div className="flex items-center gap-3">
        <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-surface text-sm text-text-tertiary hover:text-text-secondary transition-colors">
          <Search className="h-4 w-4" />
          <span>Search...</span>
          <kbd className="hidden md:inline-flex items-center gap-1 rounded border border-border bg-surface-secondary px-1.5 py-0.5 text-xs text-text-tertiary">
            ⌘K
          </kbd>
        </button>

        <button className="relative p-2 rounded-lg hover:bg-surface-tertiary text-text-secondary transition-colors">
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-error text-white text-[10px] font-bold flex items-center justify-center">
              {count > 9 ? '9+' : count}
            </span>
          )}
        </button>

        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-surface-tertiary transition-colors">
              <Avatar firstName={user.firstName} lastName={user.lastName} avatarUrl={user.avatar} size="sm" />
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-text leading-tight">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-text-tertiary">{user.role.replace(/_/g, ' ')}</p>
              </div>
              <ChevronDown className="hidden md:block h-4 w-4 text-text-tertiary" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="right">
              <DropdownMenuItem onClick={() => router.push('/employees/' + user.id)}>
                My Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/settings')}>
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { logout(); router.push('/login'); }}>
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
