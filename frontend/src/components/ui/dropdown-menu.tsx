'use client';

import { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DropdownContextType {
  open: boolean;
  setOpen: (v: boolean) => void;
}

const DropdownContext = createContext<DropdownContextType>({ open: false, setOpen: () => {} });

export function DropdownMenu({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div ref={ref} className="relative inline-block">{children}</div>
    </DropdownContext.Provider>
  );
}

export function DropdownMenuTrigger({ children, className }: { children: ReactNode; className?: string }) {
  const { open, setOpen } = useContext(DropdownContext);
  return (
    <button onClick={() => setOpen(!open)} className={className}>
      {children}
    </button>
  );
}

export function DropdownMenuContent({ children, className, align = 'left' }: { children: ReactNode; className?: string; align?: 'left' | 'right' }) {
  const { open } = useContext(DropdownContext);
  if (!open) return null;
  return (
    <div
      className={cn(
        'absolute z-50 mt-1 min-w-[12rem] rounded-lg bg-surface border border-border shadow-dropdown py-1 animate-in fade-in slide-in-from-top-1',
        align === 'right' ? 'right-0' : 'left-0',
        className
      )}
    >
      {children}
    </div>
  );
}

export function DropdownMenuItem({ children, onClick, className }: { children: ReactNode; onClick?: () => void; className?: string }) {
  const { setOpen } = useContext(DropdownContext);
  return (
    <button
      className={cn('flex w-full items-center gap-2 px-3 py-2 text-sm text-text hover:bg-surface-secondary transition-colors', className)}
      onClick={() => { onClick?.(); setOpen(false); }}
    >
      {children}
    </button>
  );
}

export function DropdownMenuSeparator() {
  return <div className="my-1 border-t border-border" />;
}
