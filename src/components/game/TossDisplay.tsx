"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dices } from "lucide-react";
import { useState, useEffect } from "react";

interface TossDisplayProps {
  onTossComplete: (winnerPlayerId: string) => void;
  player1Name: string;
  player2Name: string;
}

export function TossDisplay({ onTossComplete, player1Name, player2Name }: TossDisplayProps) {
  const [isTossing, setIsTossing] = useState(false);
  const [tossResult, setTossResult] = useState<string | null>(null);

  const handleToss = () => {
    setIsTossing(true);
    setTossResult(null);
    // Simulate toss
    setTimeout(() => {
      const winner = Math.random() < 0.5 ? "player1" : "player2";
      const winnerName = winner === "player1" ? player1Name : player2Name;
      setTossResult(`${winnerName} wins the toss and will start!`);
      setIsTossing(false);
      onTossComplete(winner);
    }, 1500);
  };

  return (
    <Card className="w-full max-w-md mx-auto my-8 shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Coin Toss</CardTitle>
        <CardDescription>Determine who starts the game.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        <Dices className={`h-16 w-16 text-primary ${isTossing ? "animate-spin" : ""}`} />
        {tossResult && (
          <p className="text-lg font-semibold text-center">{tossResult}</p>
        )}
        {!tossResult && !isTossing && (
           <Button onClick={handleToss} disabled={isTossing} size="lg" className="w-full">
            {isTossing ? "Tossing..." : "Start Toss"}
          </Button>
        )}
         {isTossing && (
          <p className="text-muted-foreground">Tossing coin...</p>
        )}
      </CardContent>
    </Card>
  );
}
