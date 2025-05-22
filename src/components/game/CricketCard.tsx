"use client";

import type { PlayerCard as PlayerCardType, CardStats } from '@/types/game';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CricketCardProps {
  card: PlayerCardType | null; // Allow null for empty slots or card back
  isFaceUp?: boolean;
  isSelected?: boolean;
  onCardClick?: (card: PlayerCardType) => void;
  onStatSelect?: (statName: keyof CardStats) => void;
  showStatSelection?: boolean; // True if this card's stats should be selectable
  compact?: boolean; // For smaller display, e.g. in opponent's hand
  className?: string;
}

export function CricketCard({
  card,
  isFaceUp = false,
  isSelected = false,
  onCardClick,
  onStatSelect,
  showStatSelection = false,
  compact = false,
  className,
}: CricketCardProps) {
  const handleCardClick = () => {
    if (card && onCardClick && isFaceUp) {
      onCardClick(card);
    }
  };

  const StatDisplay = ({ statKey, stat }: { statKey: keyof CardStats, stat: CardStats[keyof CardStats] }) => (
    <div className={cn("flex items-center justify-between text-sm", compact ? "py-0.5" : "py-1")}>
      <div className="flex items-center gap-2">
        {stat.icon && <stat.icon className={cn("h-4 w-4", compact ? "h-3 w-3" : "")} />}
        <span>{stat.label}</span>
      </div>
      <span className="font-semibold">{stat.value}</span>
      {showStatSelection && onStatSelect && (
        <Button
          variant="outline"
          size={compact ? "sm" : "sm"}
          className={cn("ml-2", compact ? "px-1 py-0.5 text-xs h-6" : "px-2 py-1 text-xs h-7")}
          onClick={(e) => {
            e.stopPropagation(); // Prevent card click
            onStatSelect(statKey);
          }}
        >
          Pick
        </Button>
      )}
    </div>
  );

  return (
    <div
      className={cn(
        "card-container rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300",
        compact ? "w-32 h-48" : "w-48 h-72 md:w-56 md:h-[22rem]",
        isSelected && isFaceUp ? "ring-4 ring-accent" : "",
        onCardClick && isFaceUp ? "cursor-pointer" : "",
        className
      )}
      onClick={handleCardClick}
    >
      <div className={cn("card-inner", isFaceUp ? "" : "flipped")}>
        <Card className={cn("card-front bg-card overflow-hidden", compact ? "p-2" : "p-0")}>
          {card && (
            <>
              <CardHeader className={cn("p-2", compact ? "pb-1" : "p-4")}>
                <CardTitle className={cn("truncate", compact ? "text-sm" : "text-lg")}>{card.name}</CardTitle>
              </CardHeader>
              <CardContent className={cn(compact ? "p-2 pt-0" : "p-4 pt-0")}>
                <div className={cn("relative", compact ? "h-20 mb-1" : "h-32 md:h-40 mb-2")}>
                  <Image
                    src={card.image}
                    alt={card.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover rounded"
                    data-ai-hint={card.dataAiHint}
                  />
                </div>
                {!compact && <CardDescription className="text-xs mb-2">Stats:</CardDescription>}
                {Object.entries(card.stats).map(([key, stat]) => (
                  <StatDisplay key={key} statKey={key as keyof CardStats} stat={stat} />
                ))}
              </CardContent>
            </>
          )}
        </Card>
        <Card className={cn("card-back bg-secondary flex items-center justify-center", compact ? "p-2" : "")}>
          <div className="text-center">
            <h3 className={cn("font-bold text-secondary-foreground", compact ? "text-lg" : "text-2xl")}>Squad Ace</h3>
            {!compact && <p className="text-sm text-secondary-foreground/80">Cricket Card Game</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
