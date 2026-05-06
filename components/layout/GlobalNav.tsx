'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Swords } from 'lucide-react';

import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '/',       label: '포켓몬 도감', icon: BookOpen },
  { href: '/battle', label: '모의 대전',   icon: Swords },
];

export function GlobalNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        {/* 로고 */}
        <span className="select-none text-base font-bold tracking-tight">🎮 포켓몬 월드</span>

        {/* 메뉴 */}
        <nav className="flex items-center gap-1">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
