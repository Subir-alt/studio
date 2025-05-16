
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter }
  from 'next/navigation';
import { Flame, LogIn, LogOut, UserCircle, Loader2 } from 'lucide-react';

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
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, signOut } = useAuth();

  const isAuthPage = pathname === '/login' || pathname === '/signup';

  React.useEffect(() => {
    // If not loading, no user, and trying to access a protected route (i.e., not '/' and not an auth page)
    if (!loading && !user && !isAuthPage && pathname !== '/') {
      router.replace('/login');
    }
  }, [user, loading, pathname, router, isAuthPage]);


  if (isAuthPage) {
    return <>{children}</>;
  }

  // If loading, and it's not the homepage (which has its own loader)
  if (loading && pathname !== '/') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // If not loading, no user, and trying to access a protected route (and not the homepage)
  // We show a loader here because the useEffect above will handle the redirect.
  // This prevents rendering the layout for a split second before redirecting.
  if (!loading && !user && !isAuthPage && pathname !== '/') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-2">Redirecting to login...</p>
      </div>
    );
  }

  // If we reach here, it means:
  // 1. User is logged in (user is not null) -> show full layout
  // 2. OR Path is '/' (pathname === '/') -> show full layout, HomePage will handle its own redirect if !user
  // 3. OR Auth is still loading but it's the homepage, so let HomePage handle its loader/redirect

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
        <SidebarFooter className="p-2 group-data-[collapsible=icon]:p-0">
          <div className="group-data-[collapsible=icon]:hidden w-full">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start p-2 text-left h-auto">
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarImage src={user.photoURL || undefined} />
                      <AvatarFallback>
                        {user.email ? user.email[0].toUpperCase() : <UserCircle className="h-5 w-5" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col truncate">
                      <span className="text-sm font-medium truncate">{user.displayName || user.email}</span>
                      <span className="text-xs text-muted-foreground">Account</span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 mb-2 ml-2" side="top" align="start">
                  <DropdownMenuLabel>{user.displayName || user.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex flex-col gap-1 p-2">
                <Button variant="outline" asChild className="w-full justify-start">
                  <Link href="/login">
                    <LogIn className="mr-2" /> Login
                  </Link>
                </Button>
              </div>
            )}
          </div>
          <div className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2 hidden">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.photoURL || undefined} />
                      <AvatarFallback>
                        {user.email ? user.email[0].toUpperCase() : <UserCircle className="h-5 w-5" />}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="mb-2 ml-2" side="right" align="center">
                  <DropdownMenuLabel>{user.displayName || user.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <UserCircle className="h-6 w-6" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="mb-2 ml-2" side="right" align="center">
                  <DropdownMenuItem asChild>
                    <Link href="/login"><LogIn className="mr-2 h-4 w-4" /> Login</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="p-4 md:p-6">
        <div className="flex items-center justify-between md:hidden mb-4">
          <SidebarTrigger />
        </div>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
