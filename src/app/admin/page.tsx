
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader as ShadTableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Trash2, Shield } from 'lucide-react';
import Link from 'next/link';

interface GameItem {
  id: string;
  name: string;
}

export default function AdminPage() {
  const [items, setItems] = useState<GameItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [mounted, setMounted] = useState(false);
  const [currentYear, setCurrentYear] = useState('');

  useEffect(() => {
    setMounted(true);
    setCurrentYear(new Date().getFullYear().toString());
    // Initialize with some default items after mount to ensure client-side IDs
    setItems([
      { id: `item-${Math.random().toString(36).substring(2, 8)}`, name: "Special Event Card" },
      { id: `item-${Math.random().toString(36).substring(2, 8)}`, name: "Tournament Announcement" },
    ]);
  }, []);

  const handleAddItem = () => {
    if (!newItemName.trim()) return;
    const newItem: GameItem = {
      id: `item-${Math.random().toString(36).substring(2, 8)}`,
      name: newItemName.trim(),
    };
    setItems(prevItems => [...prevItems, newItem]);
    setNewItemName('');
  };

  const handleDeleteItem = (id: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  if (!mounted) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-background text-foreground">
        Loading Admin Dashboard...
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-secondary/30">
      <header className="py-6 px-4 md:px-8 bg-primary text-primary-foreground shadow-md">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8" />
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          </div>
          <nav>
            <Button variant="outline" asChild className="text-primary-foreground border-primary-foreground hover:bg-primary-foreground/20 hover:text-primary">
              <Link href="/">Back to Home</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8">
        <Card className="shadow-xl border-primary/20 bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">Manage Game Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                type="text"
                placeholder="Enter new item name"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="flex-grow bg-background border-input placeholder-muted-foreground"
              />
              <Button onClick={handleAddItem} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <PlusCircle className="mr-2 h-5 w-5" /> Add Item
              </Button>
            </div>

            {items.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <ShadTableHeader>
                    <TableRow>
                      <TableHead className="text-foreground">Item Name</TableHead>
                      <TableHead className="text-right text-foreground">Actions</TableHead>
                    </TableRow>
                  </ShadTableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-foreground">{item.name}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="destructive" size="sm" onClick={() => handleDeleteItem(item.id)}>
                            <Trash2 className="mr-1 h-4 w-4" /> Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No items yet. Add some!</p>
            )}
          </CardContent>
        </Card>
      </main>

      <footer className="text-center py-6 px-4 bg-background border-t border-border">
        <p className="text-sm text-muted-foreground">
          &copy; {currentYear} Squad Ace Admin. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
