
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

const InstallPwaButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null); // Use 'any' for Event type flexibility
  const [canInstall, setCanInstall] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true); // Signal that component has mounted

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI to show the install button
      setCanInstall(true);
      console.log('beforeinstallprompt event fired');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listener for when the app is successfully installed
    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      setCanInstall(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', () => {
        console.log('PWA install listener removed');
      });
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      console.log('Install prompt not available');
      return;
    }
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    // We've used the prompt, and can't use it again, discard it
    if (outcome === 'accepted') {
        setCanInstall(false);
    }
    setDeferredPrompt(null);
  };

  if (!mounted || !canInstall) {
    return null;
  }

  return (
    <Button
      onClick={handleInstallClick}
      className="fixed bottom-4 right-4 z-50 shadow-lg"
      aria-label="Install Memoria App"
    >
      <Download className="mr-2 h-4 w-4" />
      Install App
    </Button>
  );
};

export default InstallPwaButton;
