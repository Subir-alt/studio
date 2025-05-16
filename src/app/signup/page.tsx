
'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function SignupDisabledPage() {
  const router = useRouter();

  useEffect(() => {
    // Optional: redirect after a few seconds
    const timer = setTimeout(() => {
      router.replace('/login');
    }, 5000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md shadow-xl text-center">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Signup Disabled</CardTitle>
          <CardDescription>
            This application uses a shared account. New account creation is not available.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            If you have credentials, please proceed to login. You will be redirected shortly.
          </p>
          <Button asChild>
            <Link href="/login">Go to Login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
