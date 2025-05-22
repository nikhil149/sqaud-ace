export interface PlayerStat {
  label: string;
  value: number;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface CardStats {
  batting: PlayerStat;
  bowling: PlayerStat;
  fielding: PlayerStat;
  [key: string]: PlayerStat; // Index signature
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
  | "opponent_turn_selecting_card" // Opponent is selecting a card to respond to user's stat challenge
  | "opponent_turn_select_card_and_stat" // Opponent is starting the round, selecting card and stat
  | "player_turn_respond_to_opponent_challenge" // Player needs to select a card to respond to opponent's challenge
  | "reveal"
  | "round_over"
  | "game_over";

export interface GameState {
  squadId: string;
  players: Player[];
  deck: PlayerCard[]; // All unique cards in the game
  currentPlayerId: string | null; // Tracks overall current player (e.g., after toss)
  turnPlayerId: string | null; // Tracks whose specific action it is (select card, select stat)
  phase: GamePhase;
  currentSelectedCards: { playerId: string; card: PlayerCard }[]; // Cards selected this round
  currentSelectedStatName: keyof CardStats | null;
  roundMessage: string; // Message for toss result, round winner, etc.
  gameWinnerId: string | null;
  inviteCode: string;
}
