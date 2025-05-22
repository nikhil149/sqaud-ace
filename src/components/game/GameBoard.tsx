"use client";

import type { GameState, Player, PlayerCard as PlayerCardType, CardStats, GamePhase } from '@/types/game';
import { useState, useEffect, useCallback } from 'react';
import { PlayerDisplay } from './PlayerDisplay';
import { CricketCard } from './CricketCard';
import { TossDisplay } from './TossDisplay';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { generateDeck, dealCards, getInitialPlayers } from '@/lib/game-data';
import { useToast } from '@/hooks/use-toast';
import { ArrowRightLeft, Info, ShieldAlert, Swords, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const NUM_CARDS_PER_PLAYER = 5; // For demo purposes
const TOTAL_PLAYERS = 2;

export function GameBoard({ squadId }: { squadId: string }) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedCardByCurrentUser, setSelectedCardByCurrentUser] = useState<PlayerCardType | null>(null);
  const { toast } = useToast();

  const initializeGame = useCallback(() => {
    const initialDeck = generateDeck(NUM_CARDS_PER_PLAYER * TOTAL_PLAYERS);
    const hands = dealCards(initialDeck, TOTAL_PLAYERS);
    const players = getInitialPlayers(hands);

    setGameState({
      squadId,
      players,
      deck: initialDeck,
      currentPlayerId: null,
      turnPlayerId: null,
      phase: 'lobby',
      currentSelectedCards: [],
      currentSelectedStatName: null,
      roundMessage: 'Welcome to Squad Ace! Click "Start Game" to begin.',
      gameWinnerId: null,
      inviteCode: `SQD-${squadId.substring(0, 4).toUpperCase()}`,
    });
    setSelectedCardByCurrentUser(null);
  }, [squadId]);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  const updateGameState = (newState: Partial<GameState>) => {
    setGameState(prev => prev ? { ...prev, ...newState } : null);
  };

  const handleStartGame = () => {
    updateGameState({ phase: 'toss', roundMessage: "Let's toss to see who starts!" });
  };

  const handleTossComplete = (tossWinnerPlayerId: string) => {
    const firstPlayer = gameState?.players.find(p => p.id === tossWinnerPlayerId);
    updateGameState({
      currentPlayerId: tossWinnerPlayerId,
      turnPlayerId: tossWinnerPlayerId,
      phase: firstPlayer?.isCurrentUser ? 'player_turn_select_card' : 'opponent_turn_selecting_card',
      roundMessage: `${firstPlayer?.name} won the toss! It's their turn to select a card.`,
    });
    
    if (!firstPlayer?.isCurrentUser) {
      // Simulate opponent's turn after a delay
      setTimeout(simulateOpponentCardSelection, 1500);
    }
  };

  const handleCardSelect = (card: PlayerCardType) => {
    if (gameState?.phase === 'player_turn_select_card' && gameState.turnPlayerId === gameState.players.find(p=>p.isCurrentUser)?.id) {
      setSelectedCardByCurrentUser(card);
      updateGameState({ phase: 'player_turn_select_stat', roundMessage: `You selected ${card.name}. Now pick a stat to challenge with.` });
    }
  };

  const handleStatSelect = (statName: keyof CardStats) => {
    if (gameState?.phase === 'player_turn_select_stat' && selectedCardByCurrentUser) {
      const currentUser = gameState.players.find(p => p.isCurrentUser);
      if (!currentUser) return;

      const newSelectedCards = [{ playerId: currentUser.id, card: selectedCardByCurrentUser }];
      updateGameState({
        currentSelectedCards: newSelectedCards,
        currentSelectedStatName: statName,
        phase: 'opponent_turn_selecting_card', // Now opponent needs to pick a card
        roundMessage: `You chose ${statName}. Opponent is selecting their card...`,
      });
      setSelectedCardByCurrentUser(null); // Clear selection for next round

      // Simulate opponent's response
      setTimeout(simulateOpponentCardSelection, 1500); 
    }
  };
  
  const simulateOpponentCardSelection = () => {
    if (!gameState) return;
    const opponent = gameState.players.find(p => !p.isCurrentUser);
    if (!opponent || opponent.cards.length === 0) {
        // This case should ideally be handled by game over logic
        resolveRound(); 
        return;
    }

    const opponentCard = opponent.cards[Math.floor(Math.random() * opponent.cards.length)];
    
    let updatedSelectedCards = [...gameState.currentSelectedCards];
    // If current user has already selected a card (opponent is responding)
    if (gameState.phase === 'opponent_turn_selecting_card' && gameState.currentSelectedStatName) {
         updatedSelectedCards.push({ playerId: opponent.id, card: opponentCard });
    } else { // If opponent is starting the round
        updatedSelectedCards = [{ playerId: opponent.id, card: opponentCard }];
    }

    // If opponent is starting, they also pick a stat
    let statToChallenge: keyof CardStats | null = gameState.currentSelectedStatName;
    if (!statToChallenge) {
        const statsKeys = Object.keys(opponentCard.stats) as (keyof CardStats)[];
        statToChallenge = statsKeys[Math.floor(Math.random() * statsKeys.length)];
    }
    
    updateGameState({
        currentSelectedCards: updatedSelectedCards,
        currentSelectedStatName: statToChallenge, // Opponent also "selects" a stat if they start
        phase: 'reveal',
        roundMessage: `Opponent selected their card. Let's reveal!`,
    });

    setTimeout(resolveRound, 1500);
  };


  const resolveRound = () => {
    if (!gameState || !gameState.currentSelectedStatName || gameState.currentSelectedCards.length < TOTAL_PLAYERS) {
      // Not enough info to resolve, or perhaps one player has no cards.
      // This might happen if an opponent runs out of cards during their "selection"
      // Or if currentSelectedCards wasn't populated correctly.
      // Check for game over.
      checkGameOver();
      return;
    }

    const statName = gameState.currentSelectedStatName;
    const player1Selection = gameState.currentSelectedCards.find(s => s.playerId === 'player1');
    const player2Selection = gameState.currentSelectedCards.find(s => s.playerId === 'player2');

    if (!player1Selection || !player2Selection) {
        // This means one player didn't play a card, potentially game over state for them
        checkGameOver();
        return;
    }

    const player1Card = player1Selection.card;
    const player2Card = player2Selection.card;

    const player1StatValue = player1Card.stats[statName].value;
    const player2StatValue = player2Card.stats[statName].value;

    let roundWinnerId: string;
    let roundLoserId: string;
    let winningCard: PlayerCardType;
    let losingCard: PlayerCardType;

    if (player1StatValue > player2StatValue) {
      roundWinnerId = 'player1';
      roundLoserId = 'player2';
      winningCard = player1Card;
      losingCard = player2Card;
    } else if (player2StatValue > player1StatValue) {
      roundWinnerId = 'player2';
      roundLoserId = 'player1';
      winningCard = player2Card;
      losingCard = player1Card;
    } else {
      // Draw: cards return to original owners or stay. For simplicity, let's say no change or a specific rule.
      // For this demo, let's say cards return, no change in ownership.
      updateGameState({
        phase: 'round_over',
        roundMessage: `It's a draw on ${statName}! Cards return. Next turn.`,
        currentSelectedCards: [], // Clear for display
      });
      setTimeout(prepareNextTurn, 2000);
      return;
    }

    const winnerPlayer = gameState.players.find(p => p.id === roundWinnerId)!;
    const loserPlayer = gameState.players.find(p => p.id === roundLoserId)!;

    toast({
      title: "Round Result",
      description: `${winnerPlayer.name} wins the round with ${statName} (${winningCard.stats[statName].value} vs ${losingCard.stats[statName].value})!`,
    });

    const updatedPlayers = gameState.players.map(p => {
      if (p.id === roundWinnerId) {
        // Winner gets loser's card
        return { ...p, cards: [...p.cards, losingCard] };
      }
      if (p.id === roundLoserId) {
        // Loser loses their card
        return { ...p, cards: p.cards.filter(c => c.id !== losingCard.id) };
      }
      return p;
    });

    updateGameState({
      players: updatedPlayers,
      phase: 'round_over',
      roundMessage: `${winnerPlayer.name} won the round! They take ${losingCard.name} from ${loserPlayer.name}.`,
    });
    
    setTimeout(checkGameOver, 2000);
  };

  const checkGameOver = () => {
    if(!gameState) return;
    const playerWithAllCards = gameState.players.find(p => p.cards.length === gameState.deck.length);
    const playerWithNoCards = gameState.players.find(p => p.cards.length === 0);

    if (playerWithAllCards) {
      updateGameState({
        phase: 'game_over',
        gameWinnerId: playerWithAllCards.id,
        roundMessage: `${playerWithAllCards.name} has all the cards and wins the game!`,
      });
    } else if (playerWithNoCards && gameState.players.length === TOTAL_PLAYERS) {
      // If a player has no cards, the other player wins
      const winner = gameState.players.find(p => p.id !== playerWithNoCards.id);
      if (winner) {
        updateGameState({
            phase: 'game_over',
            gameWinnerId: winner.id,
            roundMessage: `${playerWithNoCards.name} has no cards left! ${winner.name} wins the game!`,
        });
      }
    } else {
      prepareNextTurn();
    }
  };
  
  const prepareNextTurn = () => {
    if(!gameState) return;
    // Switch turns
    const nextPlayerId = gameState.currentPlayerId === 'player1' ? 'player2' : 'player1';
    const nextPlayer = gameState.players.find(p => p.id === nextPlayerId);

    updateGameState({
      currentPlayerId: nextPlayerId,
      turnPlayerId: nextPlayerId, // This player will select card & stat
      phase: nextPlayer?.isCurrentUser ? 'player_turn_select_card' : 'opponent_turn_selecting_card',
      currentSelectedCards: [], // Clear played cards for display
      currentSelectedStatName: null,
      roundMessage: `It's ${nextPlayer?.name}'s turn.`,
    });

    if (!nextPlayer?.isCurrentUser) {
      setTimeout(simulateOpponentCardSelection, 1500);
    }
  };


  if (!gameState) {
    return <div className="flex items-center justify-center h-screen"><Info className="mr-2" />Loading game...</div>;
  }

  const currentUser = gameState.players.find(p => p.isCurrentUser);
  const opponent = gameState.players.find(p => !p.isCurrentUser);

  const renderGameContent = () => {
    switch (gameState.phase) {
      case 'lobby':
        return (
          <Card className="w-full max-w-md mx-auto text-center shadow-xl">
            <CardHeader>
              <CardTitle className="text-3xl">Squad Ace</CardTitle>
              <CardDescription>Invite Code: <span className="font-bold text-accent">{gameState.inviteCode}</span></CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-6">{gameState.roundMessage}</p>
              <Button onClick={handleStartGame} size="lg" className="w-full">Start Game</Button>
            </CardContent>
          </Card>
        );
      case 'toss':
        return <TossDisplay 
                  onTossComplete={handleTossComplete} 
                  player1Name={currentUser?.name || 'Player 1'} 
                  player2Name={opponent?.name || 'Player 2'} 
                />;
      case 'game_over':
        const winner = gameState.players.find(p => p.id === gameState.gameWinnerId);
        return (
          <Card className="w-full max-w-md mx-auto text-center shadow-xl">
            <CardHeader>
              <Trophy className="h-16 w-16 text-accent mx-auto mb-4" />
              <CardTitle className="text-3xl">Game Over!</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl mb-6">{winner ? `${winner.name} wins!` : "It's a wrap!"}</p>
              <p className="mb-6">{gameState.roundMessage}</p>
              <Button onClick={initializeGame} size="lg" className="w-full">Play Again</Button>
            </CardContent>
          </Card>
        );
      default: // Gameplay phases
        return (
          <div className="space-y-6 md:space-y-8 w-full">
            {/* Opponent Area */}
            {opponent && (
              <PlayerDisplay
                player={opponent}
                isCurrentTurn={gameState.turnPlayerId === opponent.id && (gameState.phase === 'opponent_turn_selecting_card' || gameState.phase === 'opponent_turn_selecting_stat')}
              />
            )}

            {/* Battle Zone / Message Area */}
            <Card className="min-h-[18rem] md:min-h-[24rem] flex flex-col items-center justify-center text-center shadow-lg relative overflow-hidden">
               <CardHeader>
                <CardTitle className="flex items-center justify-center gap-2 text-xl md:text-2xl">
                  {gameState.phase === 'reveal' || gameState.currentSelectedCards.length > 0 ? <Swords /> : <Info />}
                  Battle Arena
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col items-center justify-center w-full p-2 md:p-4">
                {gameState.phase === 'reveal' && gameState.currentSelectedCards.length === TOTAL_PLAYERS && (
                  <div className="flex flex-col md:flex-row items-center justify-around gap-4 md:gap-8 w-full">
                    {gameState.currentSelectedCards.map(selection => (
                      <div key={selection.playerId} className="flex flex-col items-center">
                        <p className="font-semibold mb-1">{gameState.players.find(p=>p.id === selection.playerId)?.name}'s Card</p>
                        <CricketCard card={selection.card} isFaceUp={true} />
                        {gameState.currentSelectedStatName && (
                            <p className="mt-2 text-sm font-medium">
                                {selection.card.stats[gameState.currentSelectedStatName].label}: {selection.card.stats[gameState.currentSelectedStatName].value}
                            </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <p className={cn("mt-4 text-sm md:text-base", 
                    gameState.phase === 'round_over' ? "font-semibold" : "text-muted-foreground"
                )}>
                    {gameState.roundMessage}
                </p>
              </CardContent>
            </Card>
            
            {/* Current User Area */}
            {currentUser && (
              <PlayerDisplay
                player={currentUser}
                isCurrentTurn={gameState.turnPlayerId === currentUser.id && (gameState.phase === 'player_turn_select_card' || gameState.phase === 'player_turn_select_stat')}
                onCardClick={handleCardSelect}
                onStatSelect={handleStatSelect}
                showStatSelectionForCardId={gameState.phase === 'player_turn_select_stat' ? selectedCardByCurrentUser?.id : null}
                selectedCardId={selectedCardByCurrentUser?.id}
              />
            )}
            
            {/* Debug / Helper for current turn */}
            {(gameState.phase === 'player_turn_select_card' || gameState.phase === 'player_turn_select_stat') && gameState.turnPlayerId === currentUser?.id && (
                 <Alert variant="default" className="max-w-md mx-auto">
                    <Info className="h-4 w-4" />
                    <AlertTitle>Your Turn!</AlertTitle>
                    <AlertDescription>
                        {gameState.phase === 'player_turn_select_card' ? "Select a card from your hand to play." : `Selected: ${selectedCardByCurrentUser?.name}. Now pick a stat.`}
                    </AlertDescription>
                </Alert>
            )}
             {gameState.phase === 'round_over' && !checkGameOver() && ( // Temporary, checkGameOver doesn't return a boolean
                <Button onClick={prepareNextTurn} className="mx-auto block" variant="secondary">
                    Next Round <ArrowRightLeft className="ml-2 h-4 w-4"/>
                </Button>
            )}
          </div>
        );
    }
  };

  return (
    <div className="container mx-auto py-4 md:py-8 px-2 md:px-4 flex flex-col items-center">
      {renderGameContent()}
    </div>
  );
}
