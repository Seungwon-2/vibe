'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Sparkles, Swords, UserRound } from 'lucide-react';

import { cn } from '@/lib/utils';

const PRIMARY_NAV_LINKS = [
  { href: '/',       label: '포켓몬 도감', icon: BookOpen },
  { href: '/draw',   label: '포켓몬 뽑기', icon: Sparkles },
  { href: '/battle', label: '모의 대전',   icon: Swords },
];

const MY_PAGE_LINK = { href: '/mypage', label: '마이페이지', icon: UserRound };

export function GlobalNav() {
  const pathname = usePathname();
  const isMyPageActive =
    pathname === MY_PAGE_LINK.href || pathname.startsWith(`${MY_PAGE_LINK.href}/`);

  return (
    <header className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        {/* 로고 */}
        <span className="select-none text-base font-bold tracking-tight">🎮 포켓몬 월드</span>

        {/* 메뉴 */}
        <nav className="flex items-center gap-1">
          {PRIMARY_NAV_LINKS.map(({ href, label, icon: Icon }) => {
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

        <div className="ml-auto">
          <Link
            href={MY_PAGE_LINK.href}
            className={cn(
              'flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
              isMyPageActive
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <MY_PAGE_LINK.icon className="h-4 w-4" />
            {MY_PAGE_LINK.label}
          </Link>
        </div>
      </div>
    </header>
  );
}
