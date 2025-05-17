
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter }
  from 'next/navigation';
import { Flame, LogIn, LogOut, UserCircle, Loader2, Menu, KeyRound } from 'lucide-react'; // Added Menu, KeyRound

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
import { Input } from '@/components/ui/input'; // For Change Password Dialog
import { Label } from '@/components/ui/label'; // For Change Password Dialog
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog, // For Change Password Dialog
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import InstallPwaButton from '@/components/pwa/InstallPwaButton';
import { useToast } from '@/hooks/use-toast'; // For Change Password feedback


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

// Change Password Dialog Component
function ChangePasswordDialogContent({ onClose }: { onClose: () => void }) {
  const { changeUserPassword, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      toast({ title: "Error", description: "New password cannot be empty.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match.", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters long.", variant: "destructive" });
      return;
    }

    const success = await changeUserPassword(newPassword);
    if (success) {
      setNewPassword('');
      setConfirmPassword('');
      onClose(); // Close dialog on success
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Change Password</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit}>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="newPassword" className="text-right col-span-1">
              New Password
            </Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="col-span-3"
              placeholder="Enter new password"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="confirmPassword" className="text-right col-span-1">
              Confirm Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="col-span-3"
              placeholder="Confirm new password"
              required
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          </DialogClose>
          <Button type="submit" disabled={authLoading}>
            {authLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Changes"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}


export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [mobileHeaderActions, setMobileHeaderActions] = React.useState<React.ReactNode>(null);
  const [isChangePasswordDialogOpen, setIsChangePasswordDialogOpen] = React.useState(false);


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
    // The conditional useEffect for redirecting if !user was removed as per previous fix for hook order error.
    // The main useEffect hook above handles the necessary redirection logic.
    // Fallback UI if redirect hasn't completed (e.g. user directly navigated to a protected route)
    if (!user) {
        return (
          <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="mr-2 h-12 w-12 animate-spin text-primary" />
            <p>Redirecting to login...</p>
          </div>
        );
    }
  }

  const userDropdownContent = (
    <>
      <DropdownMenuItem onClick={() => setIsChangePasswordDialogOpen(true)}>
        <KeyRound className="mr-2 h-4 w-4" />
        <span>Change Password</span>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => useAuth().signOut()}> {/* Directly call signOut from useAuth() */}
        <LogOut className="mr-2 h-4 w-4" />
        <span>Logout</span>
      </DropdownMenuItem>
    </>
  );


  return (
    <MobileHeaderActionsContext.Provider value={setMobileHeaderActions}>
      <SidebarProvider defaultOpen>
        <Sidebar className="border-r" collapsible="icon">
          <SidebarHeader className="p-2 sm:p-4">
            <Link href="/" className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
              <Flame className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
              <span className="text-lg sm:text-xl font-semibold group-data-[collapsible=icon]:hidden">Memoria</span>
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
                        <item.icon className="h-4 w-4 sm:h-auto"/>
                        <span className="text-sm sm:text-base">{item.title}</span>
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
                    {userDropdownContent}
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
                     {userDropdownContent}
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
        <SidebarInset className="p-2 sm:p-3">
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
      <Dialog open={isChangePasswordDialogOpen} onOpenChange={setIsChangePasswordDialogOpen}>
        <DialogContent>
          <ChangePasswordDialogContent onClose={() => setIsChangePasswordDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </MobileHeaderActionsContext.Provider>
  );
}
