import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, LogIn, PlusCircle, Dices } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  const newSquadId = `squad-${Math.random().toString(36).substring(2, 8)}`;

  return (
    <div className="flex flex-col min-h-screen">
      <header className="py-6 px-4 md:px-8 bg-primary text-primary-foreground shadow-md">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dices className="h-8 w-8" />
            <h1 className="text-3xl font-bold">Squad Ace</h1>
          </div>
          <nav>
            {/* Future navigation links can go here */}
          </nav>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8 md:py-16 flex flex-col items-center justify-center">
        <section className="text-center mb-12 md:mb-16 max-w-3xl">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4 text-foreground">
            The Ultimate Cricket Card Battle!
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground mb-8">
            Assemble your squad, challenge opponents, and conquer the pitch with strategic card play.
            Outsmart your rivals with superior stats and lead your team to victory!
          </p>
        </section>
        
        <div className="w-full max-w-md">
          <Tabs defaultValue="create" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 rounded-lg">
              <TabsTrigger value="create" className="py-2.5 data-[state=active]:bg-background data-[state=active]:text-accent-foreground data-[state=active]:shadow-md rounded-md">
                <PlusCircle className="mr-2 h-5 w-5" /> Create Squad
              </TabsTrigger>
              <TabsTrigger value="join" className="py-2.5 data-[state=active]:bg-background data-[state=active]:text-accent-foreground data-[state=active]:shadow-md rounded-md">
                <LogIn className="mr-2 h-5 w-5" /> Join Squad
              </TabsTrigger>
            </TabsList>
            <TabsContent value="create">
              <Card className="shadow-xl border-primary/20 mt-2">
                <CardHeader>
                  <CardTitle>Create a New Squad</CardTitle>
                  <CardDescription>Start a new game and invite your friends.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    A new squad ID will be generated for you. Share it with friends to play!
                  </p>
                  <div className="flex items-center space-x-2 p-3 bg-secondary rounded-md">
                     <Label htmlFor="squadId" className="text-secondary-foreground">New Squad ID:</Label>
                     <Input id="squadId" value={newSquadId} readOnly className="font-mono bg-background"/>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button asChild size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Link href={`/play/${newSquadId}`}>
                      <Users className="mr-2 h-5 w-5" /> Start Playing
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            <TabsContent value="join">
              <Card className="shadow-xl border-primary/20 mt-2">
                <CardHeader>
                  <CardTitle>Join an Existing Squad</CardTitle>
                  <CardDescription>Enter an invite code to join a game.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="inviteCode">Invite Code</Label>
                    <Input id="inviteCode" placeholder="Enter squad invite code" className="mt-1" />
                  </div>
                </CardContent>
                <CardFooter>
                  {/* For a real app, this button would use the input value to navigate */}
                  <Button size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled> 
                    <Users className="mr-2 h-5 w-5" /> Join Game (Coming Soon)
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <section className="mt-16 md:mt-24 w-full max-w-4xl">
            <h3 className="text-2xl md:text-3xl font-bold text-center mb-8 text-foreground">How to Play</h3>
            <div className="grid md:grid-cols-3 gap-6 md:gap-8">
                <Card className="shadow-lg hover:shadow-primary/20 transition-shadow">
                    <CardHeader className="items-center text-center">
                        <Image src="https://placehold.co/100x80.png" alt="Cards" width={100} height={80} className="rounded-md mb-3" data-ai-hint="card deck" />
                        <CardTitle>1. Get Your Cards</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground text-center">Receive a hand of unique cricket player cards, each with distinct stats.</p>
                    </CardContent>
                </Card>
                <Card className="shadow-lg hover:shadow-primary/20 transition-shadow">
                    <CardHeader className="items-center text-center">
                        <Image src="https://placehold.co/100x80.png" alt="Battle" width={100} height={80} className="rounded-md mb-3" data-ai-hint="strategy board" />
                        <CardTitle>2. Choose & Battle</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground text-center">Select a card and a stat. If your stat is higher, you win the opponent's card!</p>
                    </CardContent>
                </Card>
                <Card className="shadow-lg hover:shadow-primary/20 transition-shadow">
                    <CardHeader className="items-center text-center">
                        <Image src="https://placehold.co/100x80.png" alt="Trophy" width={100} height={80} className="rounded-md mb-3" data-ai-hint="winner trophy" />
                        <CardTitle>3. Conquer All</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground text-center">The game continues until one player collects all the cards. Be the Squad Ace!</p>
                    </CardContent>
                </Card>
            </div>
        </section>
      </main>

      <footer className="text-center py-6 px-4 bg-background border-t">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Squad Ace. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
