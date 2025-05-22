
"use client";

import type { Player, PlayerCard as PlayerCardType, CardStats } from '@/types/game';
import Image from 'next/image';
import { CricketCard } from './CricketCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PlayerDisplayProps {
  player: Player;
  isCurrentTurn?: boolean;
  onCardClick?: (card: PlayerCardType) => void;
  onStatSelect?: (statName: keyof CardStats) => void;
  showStatSelectionForCardId?: string | null; // ID of the card for which to show stat selection
  selectedCardId?: string | null;
  isBattleZoneCard?: boolean; // If true, display only one card (presumably the one played)
  playedCard?: PlayerCardType | null; // The card played by this player in the current battle
}

export function PlayerDisplay({
  player,
  isCurrentTurn = false,
  onCardClick,
  onStatSelect,
  showStatSelectionForCardId,
  selectedCardId,
  isBattleZoneCard = false,
  playedCard,
}: PlayerDisplayProps) {
  
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const cardsToDisplay = isBattleZoneCard && playedCard ? [playedCard] : player.cards;

  return (
    <div className={cn("flex flex-col items-center p-2 md:p-4 rounded-lg", isCurrentTurn ? "bg-primary/10" : "")}>
      <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-4">
        <Avatar className="h-10 w-10 md:h-12 md:w-12">
          <AvatarImage src={player.avatarUrl} alt={player.name} data-ai-hint="player avatar" />
          <AvatarFallback>{getInitials(player.name)}</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-semibold text-sm md:text-lg">{player.name}</h3>
          <Badge variant={isCurrentTurn ? "default" : "secondary"} className="text-xs">
            Cards: {player.cards.length}
          </Badge>
        </div>
      </div>

      <div className={cn(
          "flex flex-wrap justify-center gap-2 md:gap-3", 
          isBattleZoneCard ? "" : "min-h-[12rem] md:min-h-[18rem]" // Ensure space for hand
        )}>
        {cardsToDisplay.length > 0 ? (
          cardsToDisplay.map((card, index) => (
            <CricketCard
              key={card.id}
              card={card}
              isFaceUp={player.isCurrentUser || isBattleZoneCard || (isCurrentTurn && !!onCardClick)} // Show opponent's card in battle zone
              onCardClick={player.isCurrentUser && !isBattleZoneCard ? onCardClick : undefined}
              onStatSelect={player.isCurrentUser && !isBattleZoneCard ? onStatSelect : undefined}
              showStatSelection={player.isCurrentUser && !isBattleZoneCard && showStatSelectionForCardId === card.id}
              isSelected={!isBattleZoneCard && selectedCardId === card.id}
              compact={!player.isCurrentUser && !isBattleZoneCard} // Compact for opponent's hand
              className={isBattleZoneCard ? "w-48 h-72 md:w-56 md:h-[22rem]" : ""} // Ensure played card is full size
            />
          ))
        ) : (
          <div className="flex items-center justify-center text-muted-foreground italic h-full">
            {isBattleZoneCard ? "Waiting..." : (player.cards.length === 0 && player.isCurrentUser ? "No cards left!" : "No cards to show")}
          </div>
        )}
         {/* 
           For the opponent's hand (when not their battle card):
           - If the opponent has cards, render one card back for each card they hold.
           - This visually represents their hand size without revealing the cards.
           - This ensures there are no "empty" card slots if the opponent has cards.
        */}
        {!player.isCurrentUser && !isBattleZoneCard && player.cards.length > 0 &&
          Array.from({ length: player.cards.length }).map((_, index) => (
             <CricketCard key={`back-${index}`} card={null} isFaceUp={false} compact />
          ))
        }
      </div>
    </div>
  );
}

