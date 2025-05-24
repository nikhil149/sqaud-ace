
export interface PlayerStat {
  label: string;
  value: number;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface CardStats {
  runs: PlayerStat;
  battingAverage: PlayerStat;
  bowlingAverage: PlayerStat; // Lower is better
  wickets: PlayerStat;
  battingStrikerate: PlayerStat;
  bowlingStrikerate: PlayerStat; // Lower is better
  num100s: PlayerStat;
  num50s: PlayerStat;
  oversBowled: PlayerStat;
  // [key: string]: PlayerStat; // Index signature can be removed if all stats are explicit
}

export interface PlayerCard {
  id: string;
  name: string;
  image: string;
  dataAiHint: string;
  stats: CardStats;
}

export interface Player {
  id: string;
  name: string;
  isCurrentUser: boolean;
  cards: PlayerCard[];
  avatarUrl: string;
}

export type GamePhase =
  | "lobby"
  | "toss"
  | "player_turn_select_card"
  | "player_turn_select_stat"
  | "opponent_turn_selecting_card"
  | "opponent_turn_select_card_and_stat"
  | "player_turn_respond_to_opponent_challenge"
  | "reveal"
  | "round_over"
  | "game_over";

export interface GameState {
  squadId: string;
  players: Player[];
  deck: PlayerCard[];
  currentPlayerId: string | null;
  turnPlayerId: string | null;
  phase: GamePhase;
  currentSelectedCards: { playerId: string; card: PlayerCard }[];
  currentSelectedStatName: keyof CardStats | null;
  roundMessage: string;
  gameWinnerId: string | null;
  inviteCode: string;
  lastRoundWinnerId: string | null;
  isPaused: boolean;
}
