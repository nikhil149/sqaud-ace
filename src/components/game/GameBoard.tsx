
"use client";

import type { GameState, Player, PlayerCard as PlayerCardType, CardStats, GamePhase } from '@/types/game';
import { useState, useEffect, useCallback, useRef } from 'react';
import { PlayerDisplay } from './PlayerDisplay';
import { CricketCard } from './CricketCard';
import { TossDisplay } from './TossDisplay';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { generateDeck, dealCards, getInitialPlayers } from '@/lib/game-data';
import { useToast } from '@/hooks/use-toast';
import { ArrowRightLeft, Info, ShieldAlert, Swords, Trophy, TimerIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const NUM_CARDS_PER_PLAYER = 5;
const TOTAL_PLAYERS = 2;
const TURN_DURATION_SECONDS = 10;

// Delays for AI and game flow
const AI_ACTION_DELAY = 1000; // 1 second
const REVEAL_DELAY = 1000; // 1 second
const ROUND_END_DELAY_DRAW = 2000; // 2 seconds
const ROUND_END_DELAY_WIN_LOSS = 2500; // 2.5 seconds

export function GameBoard({ squadId }: { squadId: string }) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedCardByCurrentUser, setSelectedCardByCurrentUser] = useState<PlayerCardType | null>(null);
  const { toast } = useToast();

  const [countdown, setCountdown] = useState<number | null>(null);
  const turnTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const updateGameState = useCallback((newState: Partial<GameState>) => {
    setGameState(prev => {
      if (!prev) return null;
      // Ensure players array always has a new reference if it's part of newState and is actually different
      // This is a bit of a shallow merge, deeper changes to player objects within players array might need more care
      // if strict reference equality is used in dependencies. For now, spreading newState should be okay.
      return { ...prev, ...newState };
    });
  }, []);

  const clearTurnTimers = useCallback(() => {
    if (turnTimerRef.current) {
      clearTimeout(turnTimerRef.current);
      turnTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setCountdown(null);
  }, []);

  const resolveRound = useCallback(() => {
    clearTurnTimers();
    if (!gameState || !gameState.currentSelectedStatName || gameState.currentSelectedCards.length < TOTAL_PLAYERS) {
      checkGameOver();
      return;
    }

    const statName = gameState.currentSelectedStatName;
    const player1 = gameState.players.find(p => p.id === 'player1')!;
    const player2 = gameState.players.find(p => p.id === 'player2')!;

    const player1Selection = gameState.currentSelectedCards.find(s => s.playerId === player1.id);
    const player2Selection = gameState.currentSelectedCards.find(s => s.playerId === player2.id);

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
    let roundMessageText = "";

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
       roundMessageText = `It's a draw on ${player1Card.stats[statName].label} (${player1StatValue} vs ${player2StatValue})! Cards return.`;
      updateGameState({
        phase: 'round_over',
        turnPlayerId: null,
        currentSelectedCards: gameState.currentSelectedCards, // Keep showing cards for the draw
        roundMessage: roundMessageText,
      });
      setTimeout(() => checkGameOver(), ROUND_END_DELAY_DRAW);
      return;
    }

    const winnerPlayer = gameState.players.find(p => p.id === roundWinnerId)!;
    const loserPlayer = gameState.players.find(p => p.id === roundLoserId)!;

    const winningStatLabel = winningCard.stats[statName].label;
    const winningStatValue = winningCard.stats[statName].value;
    const losingStatValue = losingCard.stats[statName].value;
    
    roundMessageText = `${winnerPlayer.name} won with ${winningStatLabel} (${winningStatValue} vs ${losingStatValue}) and takes ${losingCard.name}!`;
    
    toast({
      title: "Round Result",
      description: roundMessageText,
    });


    const updatedPlayers = gameState.players.map(p => {
      if (p.id === roundWinnerId) {
        let newHand = p.cards.filter(c => c.id !== losingCard.id); // Ensure winning card isn't accidentally removed if it's the one being "taken" (it's not, loser's card is taken)
        newHand.push(losingCard); // Add losing card to winner's hand
         // Ensure the winner's originally played card is still in their hand (it should be, unless it was the card they won, which is impossible)
         if (!newHand.find(c => c.id === winningCard.id)) {
             newHand.push(winningCard);
         }
        // Remove duplicates just in case, though logic should prevent it.
        const uniqueCards = newHand.reduce((acc, current) => {
            if (!acc.find(item => item.id === current.id)) {
                acc.push(current);
            }
            return acc;
        }, [] as PlayerCardType[]);
        return { ...p, cards: uniqueCards };

      }
      if (p.id === roundLoserId) {
        // Remove the losing card from the loser's hand
        return { ...p, cards: p.cards.filter(c => c.id !== losingCard.id) };
      }
      return p;
    });


    updateGameState({
      players: updatedPlayers,
      phase: 'round_over',
      turnPlayerId: null,
      currentSelectedCards: gameState.currentSelectedCards, // Keep showing cards for the result
      roundMessage: roundMessageText,
    });

    setTimeout(() => checkGameOver(), ROUND_END_DELAY_WIN_LOSS);
  }, [gameState, toast, updateGameState, clearTurnTimers]); // checkGameOver removed for now to break potential cycle if it's also useCallback

  const prepareNextTurn = useCallback(() => {
    clearTurnTimers();
    if(!gameState || gameState.phase === 'game_over') return;

    let actualNextPlayerId = gameState.currentPlayerId;
    const lastRoundWasDraw = gameState.roundMessage.toLowerCase().includes("draw");

    if (!lastRoundWasDraw) {
       actualNextPlayerId = gameState.players.find(p => p.id !== gameState.currentPlayerId)?.id || 'player1';
    }

    const nextPlayerToAct = gameState.players.find(p => p.id === actualNextPlayerId);
    setSelectedCardByCurrentUser(null);

    updateGameState({
      currentPlayerId: actualNextPlayerId,
      turnPlayerId: actualNextPlayerId,
      phase: nextPlayerToAct?.isCurrentUser ? 'player_turn_select_card' : 'opponent_turn_select_card_and_stat',
      currentSelectedCards: [],
      currentSelectedStatName: null,
      roundMessage: `It's ${nextPlayerToAct?.name}'s turn. ${nextPlayerToAct?.isCurrentUser ? "Select your card." : "Opponent is selecting card and stat." }`,
    });

    if (!nextPlayerToAct?.isCurrentUser) {
      setTimeout(() => simulateOpponentAction(), AI_ACTION_DELAY);
    }
  }, [gameState, clearTurnTimers, updateGameState, setSelectedCardByCurrentUser]); // simulateOpponentAction removed for now

  const checkGameOver = useCallback(() => {
    clearTurnTimers();
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
  }, [gameState, updateGameState, prepareNextTurn, clearTurnTimers]);


  const simulateOpponentAction = useCallback(() => {
    if (!gameState) return;
    const opponent = gameState.players.find(p => !p.isCurrentUser);
    if (!opponent || opponent.cards.length === 0) {
        resolveRound(); // Opponent has no cards, proceed to resolve/game over check
        return;
    }

    const opponentCard = opponent.cards[Math.floor(Math.random() * opponent.cards.length)];

    if (gameState.phase === 'opponent_turn_select_card_and_stat') {
        // Opponent is initiating the challenge
        const statsKeys = Object.keys(opponentCard.stats) as (keyof CardStats)[];
        if (statsKeys.length === 0) {
            console.error("Opponent card has no stats to select from:", opponentCard);
            prepareNextTurn(); // Should not happen with valid card data
            return;
        }
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
        // Opponent is responding to user's challenge
        const userCardSelection = gameState.currentSelectedCards.find(sc => sc.playerId === gameState.players.find(p => p.isCurrentUser)?.id);
        if (!userCardSelection) {
            console.error("User card selection not found in opponent_turn_selecting_card");
            prepareNextTurn(); // Should not happen
            return;
        }
        
        const userChosenStatLabel = gameState.currentSelectedStatName && userCardSelection.card.stats[gameState.currentSelectedStatName]
                                  ? userCardSelection.card.stats[gameState.currentSelectedStatName].label
                                  : 'selected stat';


        const updatedSelectedCards = [userCardSelection, { playerId: opponent.id, card: opponentCard }];
        
        updateGameState({
            currentSelectedCards: updatedSelectedCards,
            phase: 'reveal',
            turnPlayerId: null, // No one's turn specifically during reveal
            roundMessage: `Opponent responded with ${opponentCard.name}. Comparing your chosen stat: ${userChosenStatLabel}!`,
        });
        setTimeout(() => resolveRound(), REVEAL_DELAY);
    }
  }, [gameState, updateGameState, resolveRound, prepareNextTurn]);

  const handleCardSelect = useCallback((card: PlayerCardType) => {
    if (gameState?.phase === 'player_turn_select_card' && gameState.players.find(p=>p.isCurrentUser)?.id === gameState.turnPlayerId) {
      clearTurnTimers();
      setSelectedCardByCurrentUser(card);
      updateGameState({ phase: 'player_turn_select_stat', roundMessage: `You selected ${card.name}. Now pick a stat to challenge with.` });
    }
  }, [gameState, clearTurnTimers, setSelectedCardByCurrentUser, updateGameState]);

  const handleStatSelect = useCallback((statName: keyof CardStats) => {
    if (gameState?.phase === 'player_turn_select_stat' && selectedCardByCurrentUser) {
      clearTurnTimers();
      const currentUser = gameState.players.find(p => p.isCurrentUser);
      if (!currentUser) return;

      const newSelectedCards = [{ playerId: currentUser.id, card: selectedCardByCurrentUser }];
      updateGameState({
        currentSelectedCards: newSelectedCards,
        currentSelectedStatName: statName,
        phase: 'opponent_turn_selecting_card', // Opponent's turn to select their card
        turnPlayerId: gameState.players.find(p => !p.isCurrentUser)?.id || null,
        roundMessage: `You chose ${selectedCardByCurrentUser.stats[statName].label}. Opponent is selecting their card...`,
      });

      setTimeout(() => simulateOpponentAction(), AI_ACTION_DELAY);
    }
  }, [gameState, selectedCardByCurrentUser, clearTurnTimers, updateGameState, simulateOpponentAction]);

  const handlePlayerResponseToChallenge = useCallback((card: PlayerCardType) => {
    if (gameState?.phase === 'player_turn_respond_to_opponent_challenge' && gameState.players.find(p => p.isCurrentUser)?.id === gameState.turnPlayerId) {
      clearTurnTimers();
      const currentUser = gameState.players.find(p => p.isCurrentUser);
      if (!currentUser || !gameState.currentSelectedStatName) return; // Stat name should be set by opponent

      // Opponent's card is already in currentSelectedCards from their initiating move
      const opponentCardSelection = gameState.currentSelectedCards.find(sc => sc.playerId !== currentUser.id);
      if (!opponentCardSelection) {
        // This should not happen if opponent initiated correctly
        console.error("Opponent's card selection not found during player response");
        resolveRound(); // Or some other error state handling
        return;
      }

      // Add player's responding card
      const updatedSelectedCards = [opponentCardSelection, { playerId: currentUser.id, card: card }];
      const statLabel = gameState.currentSelectedStatName && card.stats[gameState.currentSelectedStatName] 
                        ? card.stats[gameState.currentSelectedStatName].label 
                        : 'selected stat';


      updateGameState({
        currentSelectedCards: updatedSelectedCards,
        phase: 'reveal',
        turnPlayerId: null,
        roundMessage: `You responded with ${card.name}. Comparing ${statLabel}!`
      });
      setTimeout(() => resolveRound(), REVEAL_DELAY);
    }
  }, [gameState, clearTurnTimers, updateGameState, resolveRound]);


  const handleTimeout = useCallback(() => {
    if (!gameState) return;
    const currentUser = gameState.players.find(p => p.isCurrentUser);
    // Ensure currentUser.id is checked against gameState.turnPlayerId from the current gameState, not a stale one.
    if (!currentUser || currentUser.id !== gameState.turnPlayerId) return; 

    toast({
      title: "Time's up!",
      variant: "destructive",
    });

    // Use gameState.phase from current gameState
    if (gameState.phase === 'player_turn_select_card') {
      if (currentUser.cards.length > 0) {
        const randomCard = currentUser.cards[Math.floor(Math.random() * currentUser.cards.length)];
        toast({ description: `Auto-selected ${randomCard.name}.` });
        handleCardSelect(randomCard);
      } else {
        // If no cards, prepareNextTurn might be called, which depends on gameState.
        prepareNextTurn(); 
      }
    } else if (gameState.phase === 'player_turn_select_stat' && selectedCardByCurrentUser) {
      const statsKeys = Object.keys(selectedCardByCurrentUser.stats) as (keyof CardStats)[];
      if (statsKeys.length > 0) {
        const randomStat = statsKeys[Math.floor(Math.random() * statsKeys.length)];
        toast({ description: `Auto-selected ${selectedCardByCurrentUser.stats[randomStat].label}.` });
        handleStatSelect(randomStat);
      } else {
         prepareNextTurn(); 
      }
    } else if (gameState.phase === 'player_turn_respond_to_opponent_challenge') {
      if (currentUser.cards.length > 0) {
        const randomCard = currentUser.cards[Math.floor(Math.random() * currentUser.cards.length)];
        toast({ description: `Auto-responded with ${randomCard.name}.` });
        handlePlayerResponseToChallenge(randomCard);
      } else {
        prepareNextTurn(); 
      }
    }
    clearTurnTimers();
  }, [
    gameState?.phase, 
    gameState?.turnPlayerId, 
    gameState?.players, 
    selectedCardByCurrentUser, 
    toast, 
    clearTurnTimers, 
    prepareNextTurn, 
    handleCardSelect, 
    handleStatSelect, 
    handlePlayerResponseToChallenge
  ]); 


  const initializeGame = useCallback(() => {
    clearTurnTimers();
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
  }, [squadId, clearTurnTimers, updateGameState]); // updateGameState added as it uses setGameState

  useEffect(() => {
    initializeGame();
    return () => {
      clearTurnTimers(); // Cleanup on unmount
    };
  }, [initializeGame]); // initializeGame already includes clearTurnTimers

  // Effect to manage the turn timer and countdown
  useEffect(() => {
    clearTurnTimers(); 
    if (gameState && gameState.players && gameState.turnPlayerId) {
      const playerWhoseTurnItIs = gameState.players.find(p => p.id === gameState.turnPlayerId);
      const isCurrentUserTurnToAct = playerWhoseTurnItIs?.isCurrentUser &&
        (gameState.phase === 'player_turn_select_card' ||
         gameState.phase === 'player_turn_select_stat' ||
         gameState.phase === 'player_turn_respond_to_opponent_challenge');

      if (isCurrentUserTurnToAct) {
        setCountdown(TURN_DURATION_SECONDS);
        countdownIntervalRef.current = setInterval(() => {
          setCountdown(prev => (prev !== null && prev > 0 ? prev - 1 : 0));
        }, 1000);
        turnTimerRef.current = setTimeout(handleTimeout, TURN_DURATION_SECONDS * 1000);
      }
    }
    // Cleanup function for this effect
    return () => {
      clearTurnTimers();
    };
  }, [gameState?.phase, gameState?.turnPlayerId, gameState?.players, clearTurnTimers, handleTimeout]);

  const handleStartGame = () => {
    clearTurnTimers();
    updateGameState({ phase: 'toss', roundMessage: "Let's toss to see who starts!" });
  };

  const handleTossComplete = (tossWinnerPlayerId: string) => {
    clearTurnTimers();
    const firstPlayer = gameState?.players.find(p => p.id === tossWinnerPlayerId);
    if (!firstPlayer) return;

    updateGameState({
      currentPlayerId: tossWinnerPlayerId,
      turnPlayerId: tossWinnerPlayerId,
      phase: firstPlayer.isCurrentUser ? 'player_turn_select_card' : 'opponent_turn_select_card_and_stat',
      roundMessage: `${firstPlayer.name} won the toss! ${firstPlayer.isCurrentUser ? "Select a card." : "Opponent is selecting a card and stat."}`,
    });

    if (!firstPlayer.isCurrentUser) {
      setTimeout(() => simulateOpponentAction(), AI_ACTION_DELAY);
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
  
  const getBattleArenaIconAndTitle = () => {
    if ((gameState.phase === 'opponent_turn_select_card_and_stat' && gameState.turnPlayerId === opponent?.id) ||
        (gameState.phase === 'opponent_turn_selecting_card' && gameState.turnPlayerId === opponent?.id)) {
        return { icon: <TimerIcon className="animate-pulse text-accent" />, title: "Opponent Thinking..." };
    }
    // Show Swords if cards are selected and it's reveal, round_over, or user needs to respond, or opponent is picking response
    if (gameState.currentSelectedCards.length > 0 && 
        (gameState.phase === 'reveal' || 
         gameState.phase === 'round_over' || 
         gameState.phase === 'player_turn_respond_to_opponent_challenge' ||
         (gameState.phase === 'opponent_turn_selecting_card' && gameState.turnPlayerId !== opponent?.id) 
        )) {
        return { icon: <Swords className="text-primary"/>, title: "Battle Arena" };
    }
    // Default for Battle Arena title
    return { icon: <Info className="text-muted-foreground" />, title: "Battle Arena" };
  };


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

        // Determine when to show cards in the battle arena
        let showBattleArenaCards = false;
        if (gameState.currentSelectedCards.length > 0) {
            if (gameState.phase === 'reveal' || gameState.phase === 'round_over') {
                showBattleArenaCards = true;
            } else if (gameState.phase === 'player_turn_respond_to_opponent_challenge' && gameState.currentSelectedCards.some(sel => sel.playerId === opponent?.id)) {
                // Show opponent's initiating card
                showBattleArenaCards = true;
            } else if ((gameState.phase === 'opponent_turn_selecting_card' || gameState.phase === 'player_turn_select_stat') && gameState.currentSelectedCards.some(sel => sel.playerId === currentUser?.id) ) {
                 // Show current user's selected card while waiting for opponent or for user to pick stat
                showBattleArenaCards = true;
            }
        }
        
        const { icon: arenaIcon, title: arenaTitle } = getBattleArenaIconAndTitle();

        return (
          <div className="space-y-6 md:space-y-8 w-full">
            {opponent && (
              <PlayerDisplay
                player={opponent}
                isCurrentTurn={gameState.turnPlayerId === opponent.id && (gameState.phase === 'opponent_turn_selecting_card' || gameState.phase === 'opponent_turn_select_card_and_stat')}
                // Only show opponent's played card if it's in currentSelectedCards and it's a relevant phase
                playedCard={
                  (gameState.phase === 'reveal' || gameState.phase === 'round_over' || gameState.phase === 'player_turn_respond_to_opponent_challenge') &&
                  gameState.currentSelectedCards.find(sel => sel.playerId === opponent.id)?.card || null
                }
                isBattleZoneCard={
                  (gameState.phase === 'reveal' || gameState.phase === 'round_over' || gameState.phase === 'player_turn_respond_to_opponent_challenge') &&
                  !!gameState.currentSelectedCards.find(sel => sel.playerId === opponent.id)
                }
              />
            )}

            <Card className="min-h-[20rem] md:min-h-[26rem] flex flex-col items-center justify-center text-center shadow-lg relative overflow-hidden">
               <CardHeader>
                <CardTitle className="flex items-center justify-center gap-2 text-xl md:text-2xl">
                  {arenaIcon}
                  {arenaTitle}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col items-center justify-center w-full p-2 md:p-4">
                {showBattleArenaCards && (
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-around gap-4 md:gap-8 w-full mb-4">
                    {gameState.currentSelectedCards.map(selection => {
                       let isWinningCardInBattle = false;
                       if (gameState.phase === 'round_over' && gameState.currentSelectedStatName && player1Selection && player2Selection) {
                           const p1Val = player1Selection.card.stats[gameState.currentSelectedStatName].value;
                           const p2Val = player2Selection.card.stats[gameState.currentSelectedStatName].value;
                           if (p1Val !== p2Val) { // Only highlight if not a draw
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
                          {gameState.currentSelectedStatName && selection.card.stats[gameState.currentSelectedStatName] &&
                           // Show stat if: reveal, round_over, player responding, or user has picked card and is selecting stat, or opponent is selecting response
                           (gameState.phase === 'reveal' || 
                            gameState.phase === 'round_over' || 
                            gameState.phase === 'player_turn_respond_to_opponent_challenge' ||
                            (gameState.phase === 'player_turn_select_stat' && selection.playerId === currentUser?.id) ||
                            (gameState.phase === 'opponent_turn_selecting_card' && selection.playerId === currentUser?.id)
                            ) &&
                           (
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
                  (showBattleArenaCards || gameState.phase === 'reveal' || gameState.phase === 'round_over')
                    ? "text-lg font-semibold"
                    : "text-sm text-muted-foreground",
                  gameState.phase === 'reveal' ? "text-accent animate-pulse" : "",
                  gameState.phase === 'round_over' && gameState.gameWinnerId ? "text-2xl font-bold text-primary" :
                  gameState.phase === 'round_over' && gameState.currentSelectedCards.length > 0 ? "text-xl font-bold" : "" // Ensure round_over message is bold when cards shown
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
                // Only show user's played card if it's in currentSelectedCards and it's a relevant phase
                playedCard={
                  (gameState.phase === 'reveal' || gameState.phase === 'round_over' || gameState.phase === 'opponent_turn_selecting_card' || gameState.phase === 'player_turn_select_stat') && // also show if user picked card/stat
                  gameState.currentSelectedCards.find(sel => sel.playerId === currentUser.id)?.card || null
                }
                isBattleZoneCard={
                  (gameState.phase === 'reveal' || gameState.phase === 'round_over' || gameState.phase === 'opponent_turn_selecting_card' || gameState.phase === 'player_turn_select_stat') && // also show if user picked card/stat
                  !!gameState.currentSelectedCards.find(sel => sel.playerId === currentUser.id)
                }
              />
            )}

            {(gameState.phase === 'player_turn_select_card' ||
              gameState.phase === 'player_turn_select_stat' ||
              gameState.phase === 'player_turn_respond_to_opponent_challenge') &&
              gameState.turnPlayerId === currentUser?.id && (
                 <Alert variant="default" className="max-w-md mx-auto">
                    <TimerIcon className="h-4 w-4" />
                    <AlertTitle>
                        Your Turn! {countdown !== null && `(${countdown}s)`}
                    </AlertTitle>
                    <AlertDescription>
                        {gameState.phase === 'player_turn_select_card' && "Select a card from your hand to play."}
                        {gameState.phase === 'player_turn_select_stat' && (selectedCardByCurrentUser ? `Selected: ${selectedCardByCurrentUser.name}. Now pick a stat.` : "Pick a stat.")}
                        {gameState.phase === 'player_turn_respond_to_opponent_challenge' &&
                          `Opponent has played. Select your card to respond using the challenged stat: ${
                            gameState.currentSelectedStatName && gameState.currentSelectedCards.length > 0 && opponent && gameState.currentSelectedCards.find(c => c.playerId === opponent.id)?.card?.stats[gameState.currentSelectedStatName]
                              ? gameState.currentSelectedCards.find(c => c.playerId === opponent.id)!.card.stats[gameState.currentSelectedStatName]!.label
                              : 'Error: Stat not found'
                          }.`
                        }
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

