
import type { PlayerCard, CardStats, Player } from '@/types/game';
import { BatIcon } from '@/components/icons/BatIcon';
import { Target, TrendingUp, Zap, Award, Clock } from 'lucide-react'; // ShieldCheck removed, added others

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

const hintToImageMap: Record<string, string> = {
  "sports athlete": "https://images.unsplash.com/photo-1479741789870-7e3f31a2ed07?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxMHx8c3BvcnRzJTIwYXRobGV0ZXxlbnwwfHx8fDE3NDc5MzcyNDB8MA&ixlib=rb-4.1.0&q=80&w=1080",
  "wicketkeeper action": "https://images.unsplash.com/photo-1490775696818-7832285c7240?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHx3aWNrZXRrZWVwZXIlMjBhY3Rpb258ZW58MHx8fHwxNzQ3OTM3MjM5fDA&ixlib=rb-4.1.0&q=80&w=1080",
  "cricket pitch": "https://images.unsplash.com/photo-1531415074968-036ba1b575da?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHxjcmlja2V0JTIwcGl0Y2h8ZW58MHx8fHwxNzQ3OTM3MjQwfDA&ixlib=rb-4.1.0&q=80&w=1080",
  "team huddle": "https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHx0ZWFtJTIwaHVkZGxlfGVufDB8fHx8MTc0NzkzNzI0MHww&ixlib=rb-4.1.0&q=80&w=1080",
  "cricket celebration": "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw5fHxjcmlja2V0JTIwY2VsZWJyYXRpb258ZW58MHx8fHwxNzQ3OTM3MjQwfDA&ixlib=rb-4.1.0&q=80&w=1080",
};


function createStat(label: string, value: number, icon?: React.ComponentType<{ className?: string }>): CardStats[keyof CardStats] {
  return { label, value, icon };
}

export function generateDeck(numCards: number = 20): PlayerCard[] {
  const deck: PlayerCard[] = [];
  for (let i = 0; i < numCards; i++) {
    const playerName = playerNames[i % playerNames.length];
    const cardName = `${playerName} #${Math.floor(i / playerNames.length) + 1}`;
    const currentHint = dataAiHints[i % dataAiHints.length];
    const cardImage = hintToImageMap[currentHint] || `https://placehold.co/300x400.png`;

    deck.push({
      id: `card-${i + 1}`,
      name: cardName,
      image: cardImage,
      dataAiHint: currentHint,
      stats: {
        runs: createStat("Runs", Math.floor(Math.random() * 1000) + 50, TrendingUp),
        battingAverage: createStat("Bat Avg", Math.floor(Math.random() * 40) + 20, BatIcon), // e.g. 20-60
        bowlingAverage: createStat("Bowl Avg", Math.floor(Math.random() * 35) + 15, Target), // e.g. 15-50 (lower is better)
        wickets: createStat("Wickets", Math.floor(Math.random() * 150) + 10, Target),
        battingStrikerate: createStat("Bat SR", Math.floor(Math.random() * 100) + 60, Zap), // e.g. 60-160
        bowlingStrikerate: createStat("Bowl SR", Math.floor(Math.random() * 50) + 20, Zap), // e.g. 20-70 (lower is better)
        num100s: createStat("100s", Math.floor(Math.random() * 20), Award),
        num50s: createStat("50s", Math.floor(Math.random() * 40), Award),
        oversBowled: createStat("Overs", Math.floor(Math.random() * 500) + 100, Clock),
      },
    });
  }
  return deck;
}

/**
 * Deals cards from the deck to the specified number of players.
 * Ensures that cards are distributed as evenly as possible, resulting in players
 * starting with an equal number of cards if the total number of cards is divisible
 * by the number of players.
 * This comment was added to clarify the existing behavior based on user feedback.
 */
export function dealCards(deck: PlayerCard[], numPlayers: number): PlayerCard[][] {
  const shuffledDeck = [...deck].sort(() => Math.random() - 0.5);
  const hands: PlayerCard[][] = Array(numPlayers).fill(null).map(() => []);
  shuffledDeck.forEach((card, index) => {
    hands[index % numPlayers].push(card);
  });
  return hands;
}

/**
 * Initializes player objects with their dealt hands.
 * Both players (user and opponent) receive cards from the 'hands' array,
 * ensuring they start with the cards allocated by the dealCards function.
 * This comment was added to clarify the existing behavior based on user feedback.
 */
export function getInitialPlayers(hands: PlayerCard[][]): Player[] {
    return [
        {
            id: 'player1',
            name: 'You',
            isCurrentUser: true,
            cards: hands[0] || [], // Player 1 gets the first hand
            avatarUrl: 'https://placehold.co/100x100.png'
        },
        {
            id: 'player2',
            name: 'Opponent',
            isCurrentUser: false,
            cards: hands[1] || [], // Player 2 gets the second hand
            avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw1fHxwbGF5ZXIlMjBhdmF0YXJ8ZW58MHx8fHwxNzQ3OTM3MjQwfDA&ixlib=rb-4.1.0&q=80&w=1080'
        },
    ];
}
