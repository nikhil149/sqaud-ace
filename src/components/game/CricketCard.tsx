
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
    <div className={cn("flex items-center justify-between text-xs", "py-0.5")}>
      <div className="flex items-center gap-2">
        {stat.icon && <stat.icon className={cn("h-4 w-4", compact ? "h-3 w-3" : "")} />}
        <span>{stat.label}</span>
      </div>
      <span className="font-semibold">{stat.value}</span>
      {showStatSelection && onStatSelect && (
        <Button
          variant="outline"
          size="sm" // size="sm" is already small
          className={cn("ml-2 px-1 py-0.5 text-xs h-6")} // Explicitly make button smaller
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
        compact ? "w-32" : "w-48 md:w-56",
        isSelected && isFaceUp ? "ring-4 ring-accent" : "",
        onCardClick && isFaceUp ? "cursor-pointer" : "",
        !isFaceUp && "flipped",
        className
      )}
      onClick={handleCardClick}
    >
      <div className={cn("card-inner")}>
        <Card className={cn("card-front bg-card flex flex-col", compact ? "p-0" : "p-0")}>
          {card && (
            <>
              <CardHeader className={cn(compact ? "p-2 pb-1" : "p-3 pb-1")}>
                <CardTitle className={cn("truncate", compact ? "text-sm" : "text-base")}>{card.name}</CardTitle>
              </CardHeader>
              <CardContent className={cn("flex-grow", compact ? "p-2 pt-0" : "p-3 pt-1")}>
                <div className={cn("relative mx-auto", compact ? "w-24 h-20 mb-1" : "w-full h-24 md:h-28 mb-2")}>
                  <Image
                    src={card.image}
                    alt={card.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover rounded"
                    data-ai-hint={card.dataAiHint}
                  />
                </div>
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
