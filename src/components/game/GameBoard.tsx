
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
        phase: 'opponent_turn_selecting_card', 
        roundMessage: `You chose ${selectedCardByCurrentUser.stats[statName].label}. Opponent is selecting their card...`,
      });
      setSelectedCardByCurrentUser(null); 

      setTimeout(simulateOpponentCardSelection, 1500); 
    }
  };
  
 const simulateOpponentCardSelection = () => {
    if (!gameState) return;
    const opponent = gameState.players.find(p => !p.isCurrentUser);
    if (!opponent || opponent.cards.length === 0) {
        resolveRound(); 
        return;
    }

    const opponentCard = opponent.cards[Math.floor(Math.random() * opponent.cards.length)];
    
    let updatedSelectedCards = [...gameState.currentSelectedCards];
    let finalStatToChallenge = gameState.currentSelectedStatName;
    let messageForReveal = "";

    if (gameState.phase === 'opponent_turn_selecting_card' && gameState.currentSelectedStatName) {
        // Opponent is responding to user's stat selection
        updatedSelectedCards.push({ playerId: opponent.id, card: opponentCard });
        const statLabel = opponentCard.stats[gameState.currentSelectedStatName].label;
        messageForReveal = `Comparing ${statLabel}!`;
    } else { 
        // Opponent is starting the round: selects a card AND a stat
        updatedSelectedCards = [{ playerId: opponent.id, card: opponentCard }];
        const statsKeys = Object.keys(opponentCard.stats) as (keyof CardStats)[];
        finalStatToChallenge = statsKeys[Math.floor(Math.random() * statsKeys.length)];
        const statLabel = opponentCard.stats[finalStatToChallenge].label;
        messageForReveal = `Opponent challenges with ${statLabel}! Comparing cards.`;
    }
    
    updateGameState({
        currentSelectedCards: updatedSelectedCards,
        currentSelectedStatName: finalStatToChallenge,
        phase: 'reveal',
        roundMessage: messageForReveal,
    });

    setTimeout(resolveRound, 1500);
  };


  const resolveRound = () => {
    if (!gameState || !gameState.currentSelectedStatName || gameState.currentSelectedCards.length < TOTAL_PLAYERS) {
      checkGameOver();
      return;
    }

    const statName = gameState.currentSelectedStatName;
    const player1Selection = gameState.currentSelectedCards.find(s => s.playerId === 'player1');
    const player2Selection = gameState.currentSelectedCards.find(s => s.playerId === 'player2');

    if (!player1Selection || !player2Selection) {
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
      updateGameState({
        phase: 'round_over',
        roundMessage: `It's a draw on ${player1Card.stats[statName].label}! Cards return. Next turn.`,
        // currentSelectedCards are kept to display them during round_over
      });
      setTimeout(checkGameOver, 2000); // checkGameOver will call prepareNextTurn
      return;
    }

    const winnerPlayer = gameState.players.find(p => p.id === roundWinnerId)!;
    const loserPlayer = gameState.players.find(p => p.id === roundLoserId)!;

    toast({
      title: "Round Result",
      description: `${winnerPlayer.name} wins the round with ${winningCard.stats[statName].label} (${winningCard.stats[statName].value} vs ${losingCard.stats[statName].value})!`,
    });

    const updatedPlayers = gameState.players.map(p => {
      if (p.id === roundWinnerId) {
        return { ...p, cards: [...p.cards, losingCard] };
      }
      if (p.id === roundLoserId) {
        return { ...p, cards: p.cards.filter(c => c.id !== losingCard.id) };
      }
      return p;
    });

    updateGameState({
      players: updatedPlayers,
      phase: 'round_over',
      roundMessage: `${winnerPlayer.name} won the round! They take ${losingCard.name} from ${loserPlayer.name}.`,
       // currentSelectedCards are kept to display them during round_over
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
    if(!gameState || gameState.phase === 'game_over') return; // Don't prepare next turn if game is over
    
    const nextPlayerId = gameState.currentPlayerId === 'player1' ? 'player2' : 'player1';
    const nextPlayer = gameState.players.find(p => p.id === nextPlayerId);

    updateGameState({
      currentPlayerId: nextPlayerId,
      turnPlayerId: nextPlayerId, 
      phase: nextPlayer?.isCurrentUser ? 'player_turn_select_card' : 'opponent_turn_selecting_card',
      currentSelectedCards: [], 
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
      default: 
        return (
          <div className="space-y-6 md:space-y-8 w-full">
            {opponent && (
              <PlayerDisplay
                player={opponent}
                isCurrentTurn={gameState.turnPlayerId === opponent.id && (gameState.phase === 'opponent_turn_selecting_card' || gameState.phase === 'opponent_turn_selecting_stat')}
              />
            )}

            <Card className="min-h-[20rem] md:min-h-[26rem] flex flex-col items-center justify-center text-center shadow-lg relative overflow-hidden">
               <CardHeader>
                <CardTitle className="flex items-center justify-center gap-2 text-xl md:text-2xl">
                  {(gameState.phase === 'reveal' || gameState.phase === 'round_over') && gameState.currentSelectedCards.length > 0 ? <Swords /> : <Info />}
                  Battle Arena
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col items-center justify-center w-full p-2 md:p-4">
                {(gameState.phase === 'reveal' || gameState.phase === 'round_over') && 
                 gameState.currentSelectedCards.length === TOTAL_PLAYERS && (
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-around gap-4 md:gap-8 w-full mb-4">
                    {gameState.currentSelectedCards.map(selection => (
                      <div key={selection.playerId} className="flex flex-col items-center">
                        <p className="font-semibold mb-1 text-sm text-foreground/80">
                          {gameState.players.find(p=>p.id === selection.playerId)?.name}'s Card
                        </p>
                        <CricketCard card={selection.card} isFaceUp={true} compact={false} />
                        {gameState.currentSelectedStatName && (
                           <div className="mt-2 p-2 border-2 border-accent rounded-lg bg-accent/10 shadow-md text-center">
                            <p className="text-xs text-accent-foreground/80 uppercase tracking-wider font-medium">
                              {selection.card.stats[gameState.currentSelectedStatName].label}
                            </p>
                            <p className="text-2xl font-bold text-accent-foreground">
                              {selection.card.stats[gameState.currentSelectedStatName].value}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <p className={cn(
                  "mt-2 text-center w-full px-2",
                  (gameState.phase === 'reveal' || (gameState.phase === 'round_over' && gameState.currentSelectedCards.length === TOTAL_PLAYERS))
                    ? "text-lg font-semibold" 
                    : "text-sm text-muted-foreground",
                  gameState.phase === 'reveal' ? "text-accent animate-pulse" : "",
                  gameState.phase === 'round_over' && gameState.gameWinnerId ? "text-2xl font-bold text-primary" : 
                  gameState.phase === 'round_over' ? "text-xl font-bold" : ""
                )}>
                    {gameState.roundMessage}
                </p>
              </CardContent>
            </Card>
            
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
            
            {(gameState.phase === 'player_turn_select_card' || gameState.phase === 'player_turn_select_stat') && gameState.turnPlayerId === currentUser?.id && (
                 <Alert variant="default" className="max-w-md mx-auto">
                    <Info className="h-4 w-4" />
                    <AlertTitle>Your Turn!</AlertTitle>
                    <AlertDescription>
                        {gameState.phase === 'player_turn_select_card' ? "Select a card from your hand to play." : 
                         selectedCardByCurrentUser ? `Selected: ${selectedCardByCurrentUser.name}. Now pick a stat.` : "Pick a stat."}
                    </AlertDescription>
                </Alert>
            )}
            {gameState.phase === 'round_over' && !gameState.gameWinnerId && (
                <Button onClick={prepareNextTurn} className="mx-auto block mt-4" variant="secondary">
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

