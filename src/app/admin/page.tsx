
"use client";

import { useState, useEffect, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader as ShadTableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Trash2, Edit, Shield, Users, CreditCard, Save } from 'lucide-react';
import Link from 'next/link';
import { useToast } from "@/hooks/use-toast";

// Simplified types for admin management
interface AdminCard {
  id: string;
  name: string;
  image: string;
  stats: {
    batting: number;
    bowling: number;
    fielding: number;
  };
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

const initialCards: AdminCard[] = [
  { id: `card-${Math.random().toString(36).substring(2, 8)}`, name: "Power Hitter Pro", image: "https://placehold.co/100x150.png", stats: { batting: 90, bowling: 50, fielding: 70 }, dataAiHint: "cricket bat" },
  { id: `card-${Math.random().toString(36).substring(2, 8)}`, name: "Speedster Bowler", image: "https://placehold.co/100x150.png", stats: { batting: 40, bowling: 95, fielding: 65 }, dataAiHint: "cricket ball" },
];

const initialUsers: AdminUser[] = [
  { id: `user-${Math.random().toString(36).substring(2, 8)}`, name: "Alice Admin", email: "alice@example.com", role: "admin" },
  { id: `user-${Math.random().toString(36).substring(2, 8)}`, name: "Bob Player", email: "bob@example.com", role: "user" },
];

export default function AdminPage() {
  const [mounted, setMounted] = useState(false);
  const [currentYear, setCurrentYear] = useState('');
  const { toast } = useToast();

  // Cards State
  const [cards, setCards] = useState<AdminCard[]>([]);
  const [isEditingCard, setIsEditingCard] = useState<AdminCard | null>(null);
  const [cardName, setCardName] = useState('');
  const [cardImage, setCardImage] = useState('');
  const [cardBatting, setCardBatting] = useState('');
  const [cardBowling, setCardBowling] = useState('');
  const [cardFielding, setCardFielding] = useState('');

  // Users State
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isEditingUser, setIsEditingUser] = useState<AdminUser | null>(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState<'user' | 'admin'>('user');

  useEffect(() => {
    setMounted(true);
    setCurrentYear(new Date().getFullYear().toString());
    // Initialize with some default items after mount to ensure client-side IDs
    setCards(initialCards.map(c => ({...c, id: `card-${Math.random().toString(36).substring(2, 8)}` })));
    setUsers(initialUsers.map(u => ({...u, id: `user-${Math.random().toString(36).substring(2, 8)}` })));
  }, []);

  // Card CRUD Functions
  const handleCardSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!cardName || !cardImage || !cardBatting || !cardBowling || !cardFielding) {
      toast({ title: "Error", description: "All card fields are required.", variant: "destructive" });
      return;
    }
    const newCard: AdminCard = {
      id: isEditingCard ? isEditingCard.id : `card-${Math.random().toString(36).substring(2, 8)}`,
      name: cardName,
      image: cardImage,
      stats: {
        batting: parseInt(cardBatting, 10),
        bowling: parseInt(cardBowling, 10),
        fielding: parseInt(cardFielding, 10),
      },
    };

    if (isEditingCard) {
      setCards(cards.map(c => c.id === newCard.id ? newCard : c));
      toast({ title: "Success", description: "Card updated successfully." });
    } else {
      setCards([...cards, newCard]);
      toast({ title: "Success", description: "Card added successfully." });
    }
    resetCardForm();
  };

  const editCard = (card: AdminCard) => {
    setIsEditingCard(card);
    setCardName(card.name);
    setCardImage(card.image);
    setCardBatting(card.stats.batting.toString());
    setCardBowling(card.stats.bowling.toString());
    setCardFielding(card.stats.fielding.toString());
  };

  const deleteCard = (id: string) => {
    setCards(cards.filter(c => c.id !== id));
    toast({ title: "Success", description: "Card deleted." });
  };

  const resetCardForm = () => {
    setIsEditingCard(null);
    setCardName('');
    setCardImage('');
    setCardBatting('');
    setCardBowling('');
    setCardFielding('');
  };

  // User CRUD Functions
  const handleUserSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!userName || !userEmail) {
      toast({ title: "Error", description: "User name and email are required.", variant: "destructive" });
      return;
    }
    const newUser: AdminUser = {
      id: isEditingUser ? isEditingUser.id : `user-${Math.random().toString(36).substring(2, 8)}`,
      name: userName,
      email: userEmail,
      role: userRole,
    };

    if (isEditingUser) {
      setUsers(users.map(u => u.id === newUser.id ? newUser : u));
      toast({ title: "Success", description: "User updated successfully." });
    } else {
      setUsers([...users, newUser]);
      toast({ title: "Success", description: "User added successfully." });
    }
    resetUserForm();
  };

  const editUser = (user: AdminUser) => {
    setIsEditingUser(user);
    setUserName(user.name);
    setUserEmail(user.email);
    setUserRole(user.role);
  };

  const deleteUser = (id: string) => {
    setUsers(users.filter(u => u.id !== id));
    toast({ title: "Success", description: "User deleted." });
  };

  const resetUserForm = () => {
    setIsEditingUser(null);
    setUserName('');
    setUserEmail('');
    setUserRole('user');
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

      <main className="flex-grow container mx-auto px-4 py-8 space-y-8">
        {/* Manage Cards Section */}
        <Card className="shadow-xl border-primary/20 bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground flex items-center gap-2"><CreditCard /> Manage Cards</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCardSubmit} className="space-y-4 mb-6 p-4 border rounded-lg bg-muted/30">
              <h3 className="text-lg font-semibold">{isEditingCard ? 'Edit Card' : 'Add New Card'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cardName">Card Name</Label>
                  <Input id="cardName" value={cardName} onChange={e => setCardName(e.target.value)} placeholder="E.g., Master Blaster" className="mt-1 bg-background" />
                </div>
                <div>
                  <Label htmlFor="cardImage">Image URL</Label>
                  <Input id="cardImage" value={cardImage} onChange={e => setCardImage(e.target.value)} placeholder="https://placehold.co/100x150.png" className="mt-1 bg-background" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="cardBatting">Batting Stat</Label>
                  <Input id="cardBatting" type="number" value={cardBatting} onChange={e => setCardBatting(e.target.value)} placeholder="0-100" className="mt-1 bg-background" />
                </div>
                <div>
                  <Label htmlFor="cardBowling">Bowling Stat</Label>
                  <Input id="cardBowling" type="number" value={cardBowling} onChange={e => setCardBowling(e.target.value)} placeholder="0-100" className="mt-1 bg-background" />
                </div>
                <div>
                  <Label htmlFor="cardFielding">Fielding Stat</Label>
                  <Input id="cardFielding" type="number" value={cardFielding} onChange={e => setCardFielding(e.target.value)} placeholder="0-100" className="mt-1 bg-background" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  {isEditingCard ? <Save className="mr-2 h-5 w-5" /> : <PlusCircle className="mr-2 h-5 w-5" />}
                  {isEditingCard ? 'Update Card' : 'Add Card'}
                </Button>
                {isEditingCard && (
                  <Button type="button" variant="outline" onClick={resetCardForm}>Cancel Edit</Button>
                )}
              </div>
            </form>

            {cards.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <ShadTableHeader>
                    <TableRow>
                      <TableHead className="text-foreground">Name</TableHead>
                      <TableHead className="text-foreground">Image</TableHead>
                      <TableHead className="text-foreground">Batting</TableHead>
                      <TableHead className="text-foreground">Bowling</TableHead>
                      <TableHead className="text-foreground">Fielding</TableHead>
                      <TableHead className="text-right text-foreground">Actions</TableHead>
                    </TableRow>
                  </ShadTableHeader>
                  <TableBody>
                    {cards.map((card) => (
                      <TableRow key={card.id}>
                        <TableCell className="text-foreground font-medium">{card.name}</TableCell>
                        <TableCell>
                          <img src={card.image} alt={card.name} className="h-16 w-auto rounded object-cover" data-ai-hint="card illustration" />
                        </TableCell>
                        <TableCell className="text-foreground">{card.stats.batting}</TableCell>
                        <TableCell className="text-foreground">{card.stats.bowling}</TableCell>
                        <TableCell className="text-foreground">{card.stats.fielding}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="outline" size="sm" onClick={() => editCard(card)}>
                            <Edit className="mr-1 h-4 w-4" /> Edit
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => deleteCard(card.id)}>
                            <Trash2 className="mr-1 h-4 w-4" /> Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No cards yet. Add some!</p>
            )}
          </CardContent>
        </Card>

        {/* Manage Users Section */}
        <Card className="shadow-xl border-primary/20 bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground flex items-center gap-2"><Users /> Manage Users</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUserSubmit} className="space-y-4 mb-6 p-4 border rounded-lg bg-muted/30">
              <h3 className="text-lg font-semibold">{isEditingUser ? 'Edit User' : 'Add New User'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="userName">User Name</Label>
                  <Input id="userName" value={userName} onChange={e => setUserName(e.target.value)} placeholder="E.g., John Doe" className="mt-1 bg-background" />
                </div>
                <div>
                  <Label htmlFor="userEmail">Email</Label>
                  <Input id="userEmail" type="email" value={userEmail} onChange={e => setUserEmail(e.target.value)} placeholder="user@example.com" className="mt-1 bg-background" />
                </div>
                <div>
                  <Label htmlFor="userRole">Role</Label>
                  <Select value={userRole} onValueChange={(value) => setUserRole(value as 'user' | 'admin')}>
                    <SelectTrigger className="mt-1 bg-background">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                   {isEditingUser ? <Save className="mr-2 h-5 w-5" /> : <PlusCircle className="mr-2 h-5 w-5" />}
                  {isEditingUser ? 'Update User' : 'Add User'}
                </Button>
                 {isEditingUser && (
                  <Button type="button" variant="outline" onClick={resetUserForm}>Cancel Edit</Button>
                )}
              </div>
            </form>

            {users.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <ShadTableHeader>
                    <TableRow>
                      <TableHead className="text-foreground">Name</TableHead>
                      <TableHead className="text-foreground">Email</TableHead>
                      <TableHead className="text-foreground">Role</TableHead>
                      <TableHead className="text-right text-foreground">Actions</TableHead>
                    </TableRow>
                  </ShadTableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="text-foreground font-medium">{user.name}</TableCell>
                        <TableCell className="text-foreground">{user.email}</TableCell>
                        <TableCell className="text-foreground capitalize">{user.role}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="outline" size="sm" onClick={() => editUser(user)}>
                            <Edit className="mr-1 h-4 w-4" /> Edit
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => deleteUser(user.id)}>
                            <Trash2 className="mr-1 h-4 w-4" /> Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No users yet. Add some!</p>
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

    