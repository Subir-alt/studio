
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Flame, LogIn, LogOut, UserCircle } from 'lucide-react'; // UserPlus removed

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
  const { user, loading, signOut } = useAuth(); 

  const isAuthPage = pathname === '/login' || pathname === '/signup';

  if (isAuthPage && pathname === '/signup') {
    // If somehow navigated to /signup, render children directly (which will be the SignupDisabledPage)
    return <>{children}</>;
  }
  if (isAuthPage && pathname ==='/login'){
     return <>{children}</>;
  }
  
  if (loading && !isAuthPage) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Flame className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // If not loading and no user, and not on an auth page already, redirect to login
  // This is a basic protection for authenticated routes.
  // More robust route protection might involve middleware or HOCs.
  if (!loading && !user && !isAuthPage) {
    // Note: This client-side redirect can cause a flicker.
    // For better UX, consider Next.js middleware for route protection.
    if (typeof window !== 'undefined') {
       // window.location.href = '/login'; // using window.location.href to ensure a full redirect if router isn't ready
       // Using router.replace for better Next.js integration.
       // This part of the logic should ideally be in a top-level component or middleware.
       // For now, let's assume the /app/page.tsx handles the initial redirect correctly.
    }
     return ( // Fallback content while redirecting or if redirect fails
        <div className="flex items-center justify-center min-h-screen">
          <Flame className="h-12 w-12 animate-spin text-primary" />
           <p className="ml-2">Redirecting to login...</p>
        </div>
      );
  }


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
                   {/* Sign Up Button Removed */}
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
                     {/* Sign Up Link Removed from dropdown */}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="p-4 md:p-6">
        <div className="flex items-center justify-between md:hidden mb-4">
          <SidebarTrigger />
          {/* Mobile User Menu Trigger - Optional */}
        </div>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
