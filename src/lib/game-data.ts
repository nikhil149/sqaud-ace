import type { PlayerCard, CardStats, Player } from '@/types/game';
import { BatIcon } from '@/components/icons/BatIcon';
import { ShieldCheck, Users, Dices, Gauge, Target } from 'lucide-react'; // Using Target for Bowling

const playerNames = [
  "Virat K.", "Rohit S.", "Jasprit B.", "Kane W.", "Steve S.", 
  "Pat C.", "Babar A.", "Shaheen A.", "Joe R.", "Ben S.",
  "Rashid K.", "Hardik P.", "Shubman G.", "Suryakumar Y.", "Ravindra J.",
  "Mohammed S.", "Kuldeep Y.", "Glenn M.", "David W.", "Mitchell S."
];

const dataAiHints = [
  "cricket player", "batsman action", "bowler action", "cricket stadium", "cricket celebration",
  "wicketkeeper action", "cricket match", "team huddle", "cricket pitch", "sports athlete",
  "cricket bat", "cricket ball", "cricket game", "action shot", "sports crowd",
  "player portrait", "cricket equipment", "fielding action", "umpire signal", "victory moment"
];

function createStat(label: string, value: number, icon?: React.ComponentType<{ className?: string }>): CardStats[keyof CardStats] {
  return { label, value, icon };
}

export function generateDeck(numCards: number = 20): PlayerCard[] {
  const deck: PlayerCard[] = [];
  for (let i = 0; i < numCards; i++) {
    const playerName = playerNames[i % playerNames.length];
    const cardName = `${playerName} #${Math.floor(i / playerNames.length) + 1}`;
    deck.push({
      id: `card-${i + 1}`,
      name: cardName,
      image: `https://placehold.co/300x400.png`, // Placeholder, will add data-ai-hint in component
      dataAiHint: dataAiHints[i % dataAiHints.length],
      stats: {
        batting: createStat("Batting", Math.floor(Math.random() * 70) + 30, BatIcon),
        bowling: createStat("Bowling", Math.floor(Math.random() * 70) + 30, Target), // Target for bowling
        fielding: createStat("Fielding", Math.floor(Math.random() * 70) + 30, ShieldCheck),
      },
    });
  }
  return deck;
}

export function dealCards(deck: PlayerCard[], numPlayers: number): PlayerCard[][] {
  const shuffledDeck = [...deck].sort(() => Math.random() - 0.5);
  const hands: PlayerCard[][] = Array(numPlayers).fill(null).map(() => []);
  shuffledDeck.forEach((card, index) => {
    hands[index % numPlayers].push(card);
  });
  return hands;
}

export function getInitialPlayers(hands: PlayerCard[][]): Player[] {
    return [
        { 
            id: 'player1', 
            name: 'You', 
            isCurrentUser: true, 
            cards: hands[0] || [], 
            avatarUrl: 'https://placehold.co/100x100.png' 
        },
        { 
            id: 'player2', 
            name: 'Opponent', 
            isCurrentUser: false, 
            cards: hands[1] || [], 
            avatarUrl: 'https://placehold.co/100x100.png' 
        },
    ];
}
