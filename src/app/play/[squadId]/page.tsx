import { GameBoard } from '@/components/game/GameBoard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Home } from 'lucide-react';

interface PlayPageProps {
  params: {
    squadId: string;
  };
}

export default function PlayPage({ params }: PlayPageProps) {
  const { squadId } = params;

  // squadId can be 'new' or an actual ID. GameBoard can handle 'new' to generate one.
  // Or, we can generate one here if 'new' and pass it.
  // For simplicity, GameBoard will internally use the squadId or generate if it's a keyword like 'new'.

  return (
    <main className="flex-grow flex flex-col items-center justify-center p-2 md:p-6 bg-gradient-to-br from-background to-secondary/30">
      <div className="w-full max-w-5xl">
        <Card className="mb-4 shadow-md bg-card/80 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between p-3 md:p-4">
            <CardTitle className="text-xl md:text-2xl font-bold text-primary">Squad Ace: Game Room</CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link href="/">
                <Home className="mr-1 md:mr-2 h-4 w-4" /> Back to Home
              </Link>
            </Button>
          </CardHeader>
        </Card>
        <GameBoard squadId={squadId} />
      </div>
    </main>
  );
}
