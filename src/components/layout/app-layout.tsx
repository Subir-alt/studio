'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Flame } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from '@/components/ui/sidebar';
import { navItems, type NavItem } from './sidebar-nav-items';
import { Button } from '@/components/ui/button';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarProvider defaultOpen>
      <Sidebar className="border-r" collapsible="icon">
        <SidebarHeader className="p-4">
          <Link href="/" className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
            <Flame className="h-7 w-7 text-primary" />
            <span className="text-xl font-semibold group-data-[collapsible=icon]:hidden">Memoria</span>
          </Link>
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} passHref legacyBehavior>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(item.href)}
                    tooltip={{ children: item.title, className: "ml-2" }}
                  >
                    <a>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2">
          <div className="group-data-[collapsible=icon]:hidden text-xs text-muted-foreground">
            © {new Date().getFullYear()} Memoria
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="p-4 md:p-6">
        <div className="flex items-center justify-start md:hidden mb-4">
          <SidebarTrigger />
        </div>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
