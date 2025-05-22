
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
      currentPlayerId: null, // Winner of toss will set this
      turnPlayerId: null, // Who is actively making a decision
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
    if (!firstPlayer) return;

    updateGameState({
      currentPlayerId: tossWinnerPlayerId, // This player won the toss
      turnPlayerId: tossWinnerPlayerId,    // They will make the first move
      phase: firstPlayer.isCurrentUser ? 'player_turn_select_card' : 'opponent_turn_select_card_and_stat',
      roundMessage: `${firstPlayer.name} won the toss! ${firstPlayer.isCurrentUser ? "Select a card." : "Opponent is selecting a card and stat."}`,
    });
    
    if (!firstPlayer.isCurrentUser) {
      setTimeout(simulateOpponentAction, 1500);
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
        phase: 'opponent_turn_selecting_card', // Opponent needs to respond
        turnPlayerId: gameState.players.find(p => !p.isCurrentUser)?.id || null, // Opponent's turn to select card
        roundMessage: `You chose ${selectedCardByCurrentUser.stats[statName].label}. Opponent is selecting their card...`,
      });
      setSelectedCardByCurrentUser(null); 

      setTimeout(simulateOpponentAction, 1500); 
    }
  };

  const handlePlayerResponseToChallenge = (card: PlayerCardType) => {
    if (gameState?.phase === 'player_turn_respond_to_opponent_challenge' && gameState.turnPlayerId === gameState.players.find(p => p.isCurrentUser)?.id) {
      const currentUser = gameState.players.find(p => p.isCurrentUser);
      if (!currentUser || !gameState.currentSelectedStatName) return;

      const updatedSelectedCards = [...gameState.currentSelectedCards, { playerId: currentUser.id, card: card }];
      const statLabel = card.stats[gameState.currentSelectedStatName].label;
      
      updateGameState({
        currentSelectedCards: updatedSelectedCards,
        phase: 'reveal',
        turnPlayerId: null, // No one's specific turn during reveal
        roundMessage: `You responded with ${card.name}. Comparing ${statLabel}!`
      });
      setTimeout(resolveRound, 1500);
    }
  };
  
 const simulateOpponentAction = () => {
    if (!gameState) return;
    const opponent = gameState.players.find(p => !p.isCurrentUser);
    if (!opponent || opponent.cards.length === 0) {
        resolveRound(); // Or check game over if opponent has no cards
        return;
    }

    const opponentCard = opponent.cards[Math.floor(Math.random() * opponent.cards.length)];
    
    if (gameState.phase === 'opponent_turn_select_card_and_stat') {
        // Opponent is starting the round: selects a card AND a stat
        const statsKeys = Object.keys(opponentCard.stats) as (keyof CardStats)[];
        const opponentChosenStat = statsKeys[Math.floor(Math.random() * statsKeys.length)];
        const statLabel = opponentCard.stats[opponentChosenStat].label;

        updateGameState({
            currentSelectedCards: [{ playerId: opponent.id, card: opponentCard }],
            currentSelectedStatName: opponentChosenStat,
            phase: 'player_turn_respond_to_opponent_challenge',
            turnPlayerId: gameState.players.find(p => p.isCurrentUser)?.id || null, // User's turn to respond
            roundMessage: `Opponent selected ${opponentCard.name} and challenges with ${statLabel}. Select your card to respond!`,
        });

    } else if (gameState.phase === 'opponent_turn_selecting_card' && gameState.currentSelectedStatName) {
        // Opponent is responding to user's stat selection
        const updatedSelectedCards = [...gameState.currentSelectedCards, { playerId: opponent.id, card: opponentCard }];
        const statLabel = opponentCard.stats[gameState.currentSelectedStatName].label;
        updateGameState({
            currentSelectedCards: updatedSelectedCards,
            phase: 'reveal',
            turnPlayerId: null, // No one's specific turn during reveal
            roundMessage: `Opponent responded with ${opponentCard.name}. Comparing ${statLabel}!`,
        });
        setTimeout(resolveRound, 1500);
    }
  };


  const resolveRound = () => {
    if (!gameState || !gameState.currentSelectedStatName || gameState.currentSelectedCards.length < TOTAL_PLAYERS) {
      checkGameOver(); // This might happen if a player runs out of cards before selection
      return;
    }

    const statName = gameState.currentSelectedStatName;
    // Ensure selections are ordered by player ID for consistent access if needed, or find by ID.
    const player1 = gameState.players.find(p => p.id === 'player1')!; // Assuming player1 is current user
    const player2 = gameState.players.find(p => p.id === 'player2')!; // Assuming player2 is opponent

    const player1Selection = gameState.currentSelectedCards.find(s => s.playerId === player1.id);
    const player2Selection = gameState.currentSelectedCards.find(s => s.playerId === player2.id);


    if (!player1Selection || !player2Selection) {
        checkGameOver(); // Should not happen if logic is correct, but good failsafe
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
      roundWinnerId = player1.id;
      roundLoserId = player2.id;
      winningCard = player1Card;
      losingCard = player2Card;
    } else if (player2StatValue > player1StatValue) {
      roundWinnerId = player2.id;
      roundLoserId = player1.id;
      winningCard = player2Card;
      losingCard = player1Card;
    } else {
      updateGameState({
        phase: 'round_over',
        turnPlayerId: null, 
        roundMessage: `It's a draw on ${player1Card.stats[statName].label}! Cards return. Next turn determined by previous winner or toss.`,
        // currentSelectedCards are kept to display them during round_over
      });
      setTimeout(checkGameOver, 2500); 
      return;
    }

    const winnerPlayer = gameState.players.find(p => p.id === roundWinnerId)!;
    const loserPlayer = gameState.players.find(p => p.id === roundLoserId)!;
    
    const winningStatLabel = winningCard.stats[statName].label;
    const winningStatValue = winningCard.stats[statName].value;
    const losingStatValue = losingCard.stats[statName].value;

    toast({
      title: "Round Result",
      description: `${winnerPlayer.name} wins the round with ${winningStatLabel} (${winningStatValue} vs ${losingStatValue})! They take ${losingCard.name}.`,
    });

    const roundMessageText = `${winnerPlayer.name} won with ${winningStatLabel} (${winningStatValue} vs ${losingStatValue})! They take ${losingCard.name}.`;

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
      turnPlayerId: null, 
      roundMessage: roundMessageText,
       // currentSelectedCards are kept to display them during round_over
    });
    
    setTimeout(checkGameOver, 2500); // Increased delay to see round message and card state
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
    if(!gameState || gameState.phase === 'game_over') return; 
    
    // Next turn goes to the winner of the previous round, or alternates if draw, or follows toss winner logic.
    // For simplicity, let's alternate for now if not a draw. If draw, keep current player.
    // A more robust system would track the round winner for this. CurrentPlayerId reflects toss winner.
    // Let's make turnPlayerId alternate based on currentPlayerId.
    // The current currentPlayerId is the one who WON THE TOSS or the last round if we update it.
    // Let's assume for now the turn alternates. The player who just had 'currentPlayerId' set by toss or by winning a round.
    
    // If previous round was a draw, the 'currentPlayerId' (who won the toss or last non-draw round) starts again.
    // Otherwise, the turn switches.
    let nextTurnPlayerId = gameState.currentPlayerId; // Default to current toss/round winner
    const lastRoundWasDraw = gameState.roundMessage.toLowerCase().includes("draw");

    if (!lastRoundWasDraw) {
       nextTurnPlayerId = gameState.currentPlayerId === 'player1' ? 'player2' : 'player1';
    }
     // Update currentPlayerId to reflect who will actually play next. This is important for turn logic.
     // However, currentPlayerId was meant for overall game state (like toss winner). Let's use turnPlayerId for actual turns.

    const actualNextPlayerId = lastRoundWasDraw 
      ? gameState.currentPlayerId // Player who had the turn initiative (won toss/last round) plays again on draw
      : (gameState.currentPlayerId === 'player1' ? 'player2' : 'player1');


    const nextPlayerToAct = gameState.players.find(p => p.id === actualNextPlayerId);

    updateGameState({
      currentPlayerId: actualNextPlayerId, // This player has the initiative for the next round
      turnPlayerId: actualNextPlayerId, // This player will act first
      phase: nextPlayerToAct?.isCurrentUser ? 'player_turn_select_card' : 'opponent_turn_select_card_and_stat',
      currentSelectedCards: [], 
      currentSelectedStatName: null,
      roundMessage: `It's ${nextPlayerToAct?.name}'s turn. ${nextPlayerToAct?.isCurrentUser ? "Select your card." : "Opponent is selecting card and stat." }`,
    });

    if (!nextPlayerToAct?.isCurrentUser) {
      setTimeout(simulateOpponentAction, 1500);
    }
  };


  if (!gameState) {
    return <div className="flex items-center justify-center h-screen"><Info className="mr-2" />Loading game...</div>;
  }

  const currentUser = gameState.players.find(p => p.isCurrentUser);
  const opponent = gameState.players.find(p => !p.isCurrentUser);

  const getCurrentUserPlayerDisplayCardClickHandler = () => {
    if (!currentUser || gameState.turnPlayerId !== currentUser.id) return undefined;

    switch (gameState.phase) {
      case 'player_turn_select_card':
        return handleCardSelect;
      case 'player_turn_respond_to_opponent_challenge':
        return handlePlayerResponseToChallenge;
      default:
        return undefined;
    }
  }

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
        const player1Selection = gameState.currentSelectedCards.find(s => s.playerId === 'player1');
        const player2Selection = gameState.currentSelectedCards.find(s => s.playerId === 'player2');
        
        return (
          <div className="space-y-6 md:space-y-8 w-full">
            {opponent && (
              <PlayerDisplay
                player={opponent}
                isCurrentTurn={gameState.turnPlayerId === opponent.id && (gameState.phase === 'opponent_turn_selecting_card' || gameState.phase === 'opponent_turn_select_card_and_stat')}
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
                 gameState.currentSelectedCards.length > 0 && // Check if there are cards to display
                  (
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-around gap-4 md:gap-8 w-full mb-4">
                    {gameState.currentSelectedCards.map(selection => {
                       let isWinningCardInBattle = false;
                       if (gameState.phase === 'round_over' && gameState.currentSelectedStatName && player1Selection && player2Selection) {
                           const p1Val = player1Selection.card.stats[gameState.currentSelectedStatName].value;
                           const p2Val = player2Selection.card.stats[gameState.currentSelectedStatName].value;
                           if (p1Val !== p2Val) { // Not a draw
                             if (p1Val > p2Val && selection.playerId === player1Selection.playerId) isWinningCardInBattle = true;
                             else if (p2Val > p1Val && selection.playerId === player2Selection.playerId) isWinningCardInBattle = true;
                           }
                       }
                      return (
                        <div key={selection.playerId} className={cn(
                            "flex flex-col items-center transition-all duration-300",
                            isWinningCardInBattle ? "transform scale-105 shadow-2xl rounded-lg bg-primary/10 p-1" : ""
                          )}>
                          <p className="font-semibold mb-1 text-sm text-foreground/80">
                            {gameState.players.find(p=>p.id === selection.playerId)?.name}'s Card
                            {isWinningCardInBattle && <span className="ml-2 text-xs font-bold text-primary">(Winner!)</span>}
                          </p>
                          <CricketCard card={selection.card} isFaceUp={true} compact={false} />
                          {gameState.currentSelectedStatName && selection.card.stats[gameState.currentSelectedStatName] && (
                             <div className={cn(
                               "mt-2 p-2 border-2 rounded-lg shadow-md text-center",
                               isWinningCardInBattle ? "border-primary bg-primary/20" : "border-accent bg-accent/10"
                              )}>
                              <p className="text-xs uppercase tracking-wider font-medium">
                                {selection.card.stats[gameState.currentSelectedStatName].label}
                              </p>
                              <p className="text-2xl font-bold">
                                {selection.card.stats[gameState.currentSelectedStatName].value}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                <p className={cn(
                  "mt-2 text-center w-full px-2",
                  (gameState.phase === 'reveal' || (gameState.phase === 'round_over' && gameState.currentSelectedCards.length > 0))
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
                isCurrentTurn={gameState.turnPlayerId === currentUser.id && 
                  (gameState.phase === 'player_turn_select_card' || 
                   gameState.phase === 'player_turn_select_stat' ||
                   gameState.phase === 'player_turn_respond_to_opponent_challenge'
                  )}
                onCardClick={getCurrentUserPlayerDisplayCardClickHandler()}
                onStatSelect={gameState.phase === 'player_turn_select_stat' && gameState.turnPlayerId === currentUser.id ? handleStatSelect : undefined}
                showStatSelectionForCardId={gameState.phase === 'player_turn_select_stat' ? selectedCardByCurrentUser?.id : null}
                selectedCardId={selectedCardByCurrentUser?.id}
              />
            )}
            
            {(gameState.phase === 'player_turn_select_card' || 
              gameState.phase === 'player_turn_select_stat' ||
              gameState.phase === 'player_turn_respond_to_opponent_challenge') && 
              gameState.turnPlayerId === currentUser?.id && (
                 <Alert variant="default" className="max-w-md mx-auto">
                    <Info className="h-4 w-4" />
                    <AlertTitle>Your Turn!</AlertTitle>
                    <AlertDescription>
                        {gameState.phase === 'player_turn_select_card' && "Select a card from your hand to play."}
                        {gameState.phase === 'player_turn_select_stat' && (selectedCardByCurrentUser ? `Selected: ${selectedCardByCurrentUser.name}. Now pick a stat.` : "Pick a stat.")}
                        {gameState.phase === 'player_turn_respond_to_opponent_challenge' && `Opponent has played. Select your card to respond using the challenged stat: ${gameState.currentSelectedStatName ? gameState.players.find(p=>p.isCurrentUser)?.cards[0]?.stats[gameState.currentSelectedStatName]?.label : ''}.`}
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

