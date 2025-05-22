
"use client";

import { UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { useEffect, useState } from 'react';

export default function UserPage() {
  const [mounted, setMounted] = useState(false);
  const [currentYear, setCurrentYear] = useState('');

  useEffect(() => {
    setMounted(true);
    setCurrentYear(new Date().getFullYear().toString());
  }, []);

  if (!mounted) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-background text-foreground">
        Loading User Dashboard...
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-secondary/30">
      <header className="py-6 px-4 md:px-8 bg-primary text-primary-foreground shadow-md">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCircle className="h-8 w-8" />
            <h1 className="text-3xl font-bold">User Dashboard</h1>
          </div>
          <nav>
             <Button variant="outline" asChild className="text-primary-foreground border-primary-foreground hover:bg-primary-foreground/20 hover:text-primary">
              <Link href="/">Back to Home</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-16 flex flex-col items-center justify-center">
        <Card className="w-full max-w-lg text-center shadow-xl border-primary/20 bg-card">
          <CardHeader>
            <CardTitle className="text-4xl text-card-foreground">Welcome, User!</CardTitle>
            <CardDescription>This is your personal dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              Here you'll find your game statistics, achievements, and settings in the future.
            </p>
            <div className="relative w-full max-w-[300px] h-[200px] mx-auto">
              <Image 
                src="https://placehold.co/300x200.png" 
                alt="User placeholder graphic" 
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="rounded-md object-cover" 
                data-ai-hint="dashboard graph" 
              />
            </div>
          </CardContent>
        </Card>
      </main>

       <footer className="text-center py-6 px-4 bg-background border-t border-border">
        <p className="text-sm text-muted-foreground">
          &copy; {currentYear} Squad Ace User Area. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
