
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
import InstallPwaButton from '@/components/pwa/InstallPwaButton';

// Custom SVG Hamburger Icon
const HamburgerIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
);

// Context for mobile header actions
const MobileHeaderActionsContext = React.createContext<React.Dispatch<React.SetStateAction<React.ReactNode>> | null>(null);

export function useSetMobileHeaderActions() {
  return React.useContext(MobileHeaderActionsContext);
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [mobileHeaderActions, setMobileHeaderActions] = React.useState<React.ReactNode>(null);

  const isAuthPage = pathname === '/login' || pathname === '/signup';

  React.useEffect(() => {
    if (!loading && !user && !isAuthPage && pathname !== '/') {
      router.replace('/login');
    }
  }, [user, loading, pathname, router, isAuthPage]);

  const activeNavItem = React.useMemo(() => {
    return navItems.find(item => pathname.startsWith(item.href));
  }, [pathname]);


  if (isAuthPage) {
    return <>{children}</>;
  }
  
  if (pathname !== '/') {
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
    }
    if (!user) {
       React.useEffect(() => {
        // This useEffect is now redundant due to the one at the top of AppLayout
        // but kept for safety in case of direct navigation to a protected route before initial loading state resolves.
        if (typeof window !== 'undefined') { // Ensure router is available
          router.replace('/login');
        }
      }, [router]); 
      return (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="mr-2 h-12 w-12 animate-spin text-primary" />
          <p>Redirecting to login...</p>
        </div>
      );
    }
  }


  return (
    <MobileHeaderActionsContext.Provider value={setMobileHeaderActions}>
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
        <SidebarInset className="p-2 sm:p-3 md:p-4">
          <div className="flex items-center justify-between md:hidden mb-3 sm:mb-4 gap-3">
            <div className="flex items-center gap-3">
              <SidebarTrigger>
                <HamburgerIcon />
              </SidebarTrigger>
              {activeNavItem && (
                <h1 className="text-lg font-semibold text-foreground truncate">
                  {activeNavItem.title}
                </h1>
              )}
            </div>
            {mobileHeaderActions && <div className="flex-shrink-0">{mobileHeaderActions}</div>}
          </div>
          {children}
          <InstallPwaButton />
        </SidebarInset>
      </SidebarProvider>
    </MobileHeaderActionsContext.Provider>
  );
}
