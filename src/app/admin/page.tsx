
"use client";

import { useState, useEffect, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader as ShadTableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Trash2, Edit, Shield, Users, CreditCard, Save, TrendingUp, Target, Zap, Award, Clock } from 'lucide-react';
import Link from 'next/link';
import { useToast } from "@/hooks/use-toast";
import type { CardStats as GameCardStats } from '@/types/game'; // Import the main game's CardStats type
import { BatIcon } from '@/components/icons/BatIcon';


// Use a simpler structure for AdminCard stats, just numbers.
// The full PlayerStat object from types/game is complex for a simple admin form.
interface AdminCardStats {
  runs: number;
  battingAverage: number;
  bowlingAverage: number;
  wickets: number;
  battingStrikerate: number;
  bowlingStrikerate: number;
  num100s: number;
  num50s: number;
  oversBowled: number;
}

interface AdminCard {
  id: string;
  name: string;
  image: string;
  stats: AdminCardStats;
  dataAiHint?: string;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

const initialCards: AdminCard[] = [
  {
    id: `card-${Math.random().toString(36).substring(2, 8)}`,
    name: "Legendary Batter",
    image: "https://placehold.co/100x150.png",
    stats: { runs: 12000, battingAverage: 55, bowlingAverage: 0, wickets: 5, battingStrikerate: 90, bowlingStrikerate: 0, num100s: 30, num50s: 60, oversBowled: 100 },
    dataAiHint: "cricket bat"
  },
  {
    id: `card-${Math.random().toString(36).substring(2, 8)}`,
    name: "Ace Bowler",
    image: "https://placehold.co/100x150.png",
    stats: { runs: 1500, battingAverage: 15, bowlingAverage: 22, wickets: 350, battingStrikerate: 70, bowlingStrikerate: 30, num100s: 0, num50s: 5, oversBowled: 2000 },
    dataAiHint: "cricket ball"
  },
];

const initialUsers: AdminUser[] = [
  { id: `user-${Math.random().toString(36).substring(2, 8)}`, name: "Alice Admin", email: "alice@example.com", role: "admin" },
  { id: `user-${Math.random().toString(36).substring(2, 8)}`, name: "Bob Player", email: "bob@example.com", role: "user" },
];

// Helper to get default stats
const getDefaultStats = (): AdminCardStats => ({
  runs: 0,
  battingAverage: 0,
  bowlingAverage: 0,
  wickets: 0,
  battingStrikerate: 0,
  bowlingStrikerate: 0,
  num100s: 0,
  num50s: 0,
  oversBowled: 0,
});


export default function AdminPage() {
  const [mounted, setMounted] = useState(false);
  const [currentYear, setCurrentYear] = useState('');
  const { toast } = useToast();

  // Cards State
  const [cards, setCards] = useState<AdminCard[]>([]);
  const [isEditingCard, setIsEditingCard] = useState<AdminCard | null>(null);
  const [cardName, setCardName] = useState('');
  const [cardImage, setCardImage] = useState('');
  const [cardStats, setCardStats] = useState<AdminCardStats>(getDefaultStats());
  const [cardDataAiHint, setCardDataAiHint] = useState('');


  // Users State
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isEditingUser, setIsEditingUser] = useState<AdminUser | null>(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState<'user' | 'admin'>('user');

  useEffect(() => {
    setMounted(true);
    setCurrentYear(new Date().getFullYear().toString());
    setCards(initialCards.map(c => ({...c, id: `card-${Math.random().toString(36).substring(2, 8)}` })));
    setUsers(initialUsers.map(u => ({...u, id: `user-${Math.random().toString(36).substring(2, 8)}` })));
  }, []);

  const handleStatChange = (statName: keyof AdminCardStats, value: string) => {
    setCardStats(prev => ({ ...prev, [statName]: parseInt(value, 10) || 0 }));
  };

  // Card CRUD Functions
  const handleCardSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!cardName || !cardImage) {
      toast({ title: "Error", description: "Card name and image URL are required.", variant: "destructive" });
      return;
    }
    const newCard: AdminCard = {
      id: isEditingCard ? isEditingCard.id : `card-${Math.random().toString(36).substring(2, 8)}`,
      name: cardName,
      image: cardImage,
      stats: cardStats,
      dataAiHint: cardDataAiHint,
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
    setCardStats(card.stats);
    setCardDataAiHint(card.dataAiHint || '');
  };

  const deleteCard = (id: string) => {
    setCards(cards.filter(c => c.id !== id));
    toast({ title: "Success", description: "Card deleted." });
  };

  const resetCardForm = () => {
    setIsEditingCard(null);
    setCardName('');
    setCardImage('');
    setCardStats(getDefaultStats());
    setCardDataAiHint('');
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

  const statFields: { key: keyof AdminCardStats; label: string; icon?: React.ComponentType<any> }[] = [
    { key: 'runs', label: 'Runs', icon: TrendingUp },
    { key: 'battingAverage', label: 'Batting Avg', icon: BatIcon },
    { key: 'bowlingAverage', label: 'Bowling Avg (Lower is better)', icon: Target },
    { key: 'wickets', label: 'Wickets', icon: Target },
    { key: 'battingStrikerate', label: 'Batting SR', icon: Zap },
    { key: 'bowlingStrikerate', label: 'Bowling SR (Lower is better)', icon: Zap },
    { key: 'num100s', label: '100s', icon: Award },
    { key: 'num50s', label: '50s', icon: Award },
    { key: 'oversBowled', label: 'Overs Bowled', icon: Clock },
  ];

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
            <form onSubmit={handleCardSubmit} className="space-y-6 mb-6 p-4 border rounded-lg bg-muted/30">
              <h3 className="text-xl font-semibold mb-4">{isEditingCard ? 'Edit Card' : 'Add New Card'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cardName">Card Name</Label>
                  <Input id="cardName" value={cardName} onChange={e => setCardName(e.target.value)} placeholder="E.g., Master Blaster" className="mt-1 bg-background" />
                </div>
                <div>
                  <Label htmlFor="cardImage">Image URL</Label>
                  <Input id="cardImage" value={cardImage} onChange={e => setCardImage(e.target.value)} placeholder="https://placehold.co/100x150.png" className="mt-1 bg-background" />
                </div>
                 <div>
                  <Label htmlFor="cardDataAiHint">Data AI Hint (for image search)</Label>
                  <Input id="cardDataAiHint" value={cardDataAiHint} onChange={e => setCardDataAiHint(e.target.value)} placeholder="E.g., cricket bat" className="mt-1 bg-background" />
                </div>
              </div>
              <h4 className="text-lg font-medium mt-4 mb-2">Card Stats:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {statFields.map(field => (
                  <div key={field.key}>
                    <Label htmlFor={`cardStat-${field.key}`} className="flex items-center">
                      {field.icon && <field.icon className="mr-2 h-4 w-4 text-muted-foreground" />}
                      {field.label}
                    </Label>
                    <Input
                      id={`cardStat-${field.key}`}
                      type="number"
                      value={cardStats[field.key]}
                      onChange={e => handleStatChange(field.key, e.target.value)}
                      placeholder="0"
                      className="mt-1 bg-background"
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-4">
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
                      {statFields.map(field => (
                         <TableHead key={`head-${field.key}`} className="text-foreground whitespace-nowrap">{field.label.replace(' (Lower is better)', '')}</TableHead>
                      ))}
                      <TableHead className="text-right text-foreground">Actions</TableHead>
                    </TableRow>
                  </ShadTableHeader>
                  <TableBody>
                    {cards.map((card) => (
                      <TableRow key={card.id}>
                        <TableCell className="text-foreground font-medium">{card.name}</TableCell>
                        <TableCell>
                          <img src={card.image} alt={card.name} className="h-16 w-auto rounded object-cover" data-ai-hint={card.dataAiHint || "card illustration"} />
                        </TableCell>
                        {statFields.map(field => (
                           <TableCell key={`cell-${card.id}-${field.key}`} className="text-foreground">{card.stats[field.key]}</TableCell>
                        ))}
                        <TableCell className="text-right space-x-2 whitespace-nowrap">
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
