
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
import { ArrowRightLeft, Info, Swords, Trophy, TimerIcon } from 'lucide-react';
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
  // Removed lastPlayedCardIdByCurrentUser
  const { toast } = useToast();

  const [countdown, setCountdown] = useState<number | null>(null);
  const turnTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const updateGameState = useCallback((newState: Partial<GameState>) => {
    setGameState(prev => {
      if (!prev && Object.keys(newState).length === 0) return null;
      if (!prev && Object.keys(newState).length > 0) return newState as GameState;
      if (!prev) return null;
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

  const simulateOpponentActionRef = useRef<() => void>(() => {});
  const resolveRoundRef = useRef<() => void>(() => {});
  const checkGameOverRef = useRef<() => void>(() => {});
  const prepareNextTurnRef = useRef<() => void>(() => {});


  const handleCardSelect = useCallback(() => { // Removed card parameter
    if (!gameState || gameState.phase !== 'player_turn_select_card' || gameState.players.find(p=>p.isCurrentUser)?.id !== gameState.turnPlayerId) return;

    const currentUser = gameState.players.find(p => p.isCurrentUser);
    if (!currentUser || currentUser.cards.length === 0) {
      checkGameOverRef.current();
      return;
    }
    const cardToPlay = currentUser.cards[0]; // Always play the top card

    clearTurnTimers();
    setSelectedCardByCurrentUser(cardToPlay);
    updateGameState({ phase: 'player_turn_select_stat', roundMessage: `You selected ${cardToPlay.name}. Now pick a stat to challenge with.` });
  }, [gameState?.phase, gameState?.turnPlayerId, gameState?.players, clearTurnTimers, updateGameState]);

  const handleStatSelect = useCallback((statName: keyof CardStats) => {
    if (!gameState || gameState.phase !== 'player_turn_select_stat' || !selectedCardByCurrentUser) return;
    
    clearTurnTimers();
    const currentUser = gameState.players.find(p => p.isCurrentUser);
    if (!currentUser) return;

    // selectedCardByCurrentUser is already the top card due to handleCardSelect logic
    const newSelectedCards = [{ playerId: currentUser.id, card: selectedCardByCurrentUser }];
    const statLabel = selectedCardByCurrentUser.stats[statName] ? selectedCardByCurrentUser.stats[statName].label : 'selected stat';
    
    updateGameState({
      currentSelectedCards: newSelectedCards,
      currentSelectedStatName: statName,
      phase: 'opponent_turn_selecting_card',
      turnPlayerId: gameState.players.find(p => !p.isCurrentUser)?.id || null,
      roundMessage: `You chose ${statLabel}. Opponent is selecting their card...`,
    });
    setTimeout(() => simulateOpponentActionRef.current(), AI_ACTION_DELAY);
  }, [gameState?.phase, gameState?.players, selectedCardByCurrentUser, clearTurnTimers, updateGameState]);

  const handlePlayerResponseToChallenge = useCallback(() => { // Removed card parameter
    if (!gameState || gameState.phase !== 'player_turn_respond_to_opponent_challenge' || gameState.players.find(p => p.isCurrentUser)?.id !== gameState.turnPlayerId) return;

    const currentUser = gameState.players.find(p => p.isCurrentUser);
    if (!currentUser || currentUser.cards.length === 0 || !gameState.currentSelectedStatName) {
        checkGameOverRef.current();
        return;
    }
    const cardToPlay = currentUser.cards[0]; // Always play the top card

    clearTurnTimers();

    const opponentCardSelection = gameState.currentSelectedCards.find(sc => sc.playerId !== currentUser.id);
    if (!opponentCardSelection) {
      console.error("Opponent's card selection not found during player response");
      resolveRoundRef.current();
      return;
    }

    const updatedSelectedCards = [opponentCardSelection, { playerId: currentUser.id, card: cardToPlay }];
    const statLabel = cardToPlay.stats[gameState.currentSelectedStatName]
                      ? cardToPlay.stats[gameState.currentSelectedStatName].label
                      : 'selected stat';

    updateGameState({
      currentSelectedCards: updatedSelectedCards,
      phase: 'reveal',
      turnPlayerId: null,
      roundMessage: `You responded with ${cardToPlay.name}. Comparing ${statLabel}!`
    });
    setTimeout(() => resolveRoundRef.current(), REVEAL_DELAY);
  }, [gameState?.phase, gameState?.turnPlayerId, gameState?.players, gameState?.currentSelectedCards, gameState?.currentSelectedStatName, clearTurnTimers, updateGameState]);


  const _simulateOpponentActionLogic = useCallback(() => {
    if (!gameState || !gameState.players) {
        console.warn("Simulate opponent action called without game state or players");
        checkGameOverRef.current();
        return;
    }

    const currentPhase = gameState.phase;
    const currentPlayers = gameState.players;
    const currentStatName = gameState.currentSelectedStatName;
    const currentSelectedBattleCards = gameState.currentSelectedCards;

    const opponent = currentPlayers.find(p => !p.isCurrentUser);
    if (!opponent || opponent.cards.length === 0) {
      checkGameOverRef.current();
      return;
    }

    const opponentCardToPlay = opponent.cards[0]; // Opponent always plays their top card
    if (!opponentCardToPlay) {
        console.error("CRITICAL: Opponent has cards, but failed to select top card.", opponent.cards);
        checkGameOverRef.current();
        return;
    }

    if (currentPhase === 'opponent_turn_select_card_and_stat') {
        const statsKeys = Object.keys(opponentCardToPlay.stats) as (keyof CardStats)[];
        if (statsKeys.length === 0) {
            console.error("Opponent card has no stats to select from:", opponentCardToPlay);
            prepareNextTurnRef.current();
            return;
        }
        const opponentChosenStat = statsKeys[Math.floor(Math.random() * statsKeys.length)];
        const statLabel = opponentCardToPlay.stats[opponentChosenStat].label;

        updateGameState({
            currentSelectedCards: [{ playerId: opponent.id, card: opponentCardToPlay }],
            currentSelectedStatName: opponentChosenStat,
            phase: 'player_turn_respond_to_opponent_challenge',
            turnPlayerId: currentPlayers.find(p => p.isCurrentUser)?.id || null,
            roundMessage: `Opponent selected ${opponentCardToPlay.name} and challenges with ${statLabel}. Select your card to respond!`,
        });

    } else if (currentPhase === 'opponent_turn_selecting_card' && currentStatName) {
        const userCardSelection = currentSelectedBattleCards.find(sc => sc.playerId === currentPlayers.find(p => p.isCurrentUser)?.id);
        if (!userCardSelection) {
            console.error("User card selection not found in opponent_turn_selecting_card");
            prepareNextTurnRef.current();
            return;
        }
        
        const userChosenStatLabel = userCardSelection.card.stats[currentStatName]
                                  ? userCardSelection.card.stats[currentStatName].label
                                  : 'selected stat';

        const updatedSelectedCards = [userCardSelection, { playerId: opponent.id, card: opponentCardToPlay }];
        
        updateGameState({
            currentSelectedCards: updatedSelectedCards,
            phase: 'reveal',
            turnPlayerId: null,
            roundMessage: `Opponent responded with ${opponentCardToPlay.name}. Comparing your chosen stat: ${userChosenStatLabel}!`,
        });
        setTimeout(() => resolveRoundRef.current(), REVEAL_DELAY);
    } else {
      console.warn(`Opponent action logic called in unexpected phase: ${currentPhase} or with missing stat for response. Current stat: ${currentStatName}`);
      checkGameOverRef.current();
    }
  }, [
    gameState?.phase,
    gameState?.players,
    gameState?.currentSelectedStatName,
    gameState?.currentSelectedCards,
    updateGameState,
  ]);

  useEffect(() => {
    simulateOpponentActionRef.current = _simulateOpponentActionLogic;
  }, [_simulateOpponentActionLogic]);


  const _resolveRoundLogic = useCallback(() => {
    clearTurnTimers();
    if (!gameState || !gameState.currentSelectedStatName || !gameState.currentSelectedCards || gameState.currentSelectedCards.length < TOTAL_PLAYERS || !gameState.players) {
      console.warn("Resolve round called with incomplete state.");
      checkGameOverRef.current();
      return;
    }

    const statName = gameState.currentSelectedStatName;
    let playersCopy = JSON.parse(JSON.stringify(gameState.players)) as Player[]; // Deep copy for mutation

    const player1 = playersCopy.find(p => p.id === 'player1')!;
    const player2 = playersCopy.find(p => p.id === 'player2')!;

    const player1Selection = gameState.currentSelectedCards.find(s => s.playerId === player1.id);
    const player2Selection = gameState.currentSelectedCards.find(s => s.playerId === player2.id);

    if (!player1Selection || !player2Selection) {
        console.warn("Player selections not found in resolveRound.");
        checkGameOverRef.current();
        return;
    }

    const player1PlayedCard = player1Selection.card; // This was player1.cards[0]
    const player2PlayedCard = player2Selection.card; // This was player2.cards[0]

    const player1StatValue = player1PlayedCard.stats[statName].value;
    const player2StatValue = player2PlayedCard.stats[statName].value;

    let roundMessageText = "";
    let roundEndDelay = ROUND_END_DELAY_WIN_LOSS;
    let lastRoundWinnerForStateUpdate: string | null = null;


    if (player1StatValue > player2StatValue) { // Player 1 (User) wins
      lastRoundWinnerForStateUpdate = player1.id;
      roundMessageText = `${player1.name} won with ${player1PlayedCard.stats[statName].label} (${player1StatValue} vs ${player2StatValue}) and takes ${player2PlayedCard.name}!`;

      // Update player 1's hand: remove played, add played to bottom, add won card to bottom
      player1.cards = player1.cards.filter(c => c.id !== player1PlayedCard.id); // Remove played card
      player1.cards.push(player1PlayedCard); // Add played card to bottom
      player1.cards.push(player2PlayedCard); // Add won card to bottom

      // Update player 2's hand: remove lost card
      player2.cards = player2.cards.filter(c => c.id !== player2PlayedCard.id);

    } else if (player2StatValue > player1StatValue) { // Player 2 (Opponent) wins
      lastRoundWinnerForStateUpdate = player2.id;
      roundMessageText = `${player2.name} won with ${player2PlayedCard.stats[statName].label} (${player2StatValue} vs ${player1StatValue}) and takes ${player1PlayedCard.name}!`;

      // Update player 2's hand
      player2.cards = player2.cards.filter(c => c.id !== player2PlayedCard.id);
      player2.cards.push(player2PlayedCard);
      player2.cards.push(player1PlayedCard);

      // Update player 1's hand
      player1.cards = player1.cards.filter(c => c.id !== player1PlayedCard.id);

    } else { // Draw
      roundMessageText = `It's a draw on ${player1PlayedCard.stats[statName].label} (${player1StatValue} vs ${player2StatValue})! Cards return to bottom of decks.`;
      roundEndDelay = ROUND_END_DELAY_DRAW;
      lastRoundWinnerForStateUpdate = null;

      // Player 1: played card to bottom
      player1.cards = player1.cards.filter(c => c.id !== player1PlayedCard.id);
      player1.cards.push(player1PlayedCard);

      // Player 2: played card to bottom
      player2.cards = player2.cards.filter(c => c.id !== player2PlayedCard.id);
      player2.cards.push(player2PlayedCard);
    }
    
    toast({
      title: "Round Result",
      description: roundMessageText,
    });
    
    updateGameState({
      players: playersCopy,
      phase: 'round_over',
      turnPlayerId: null,
      currentSelectedCards: gameState.currentSelectedCards,
      roundMessage: roundMessageText,
      lastRoundWinnerId: lastRoundWinnerForStateUpdate,
    });

    setTimeout(() => checkGameOverRef.current(), roundEndDelay);
  }, [
    gameState?.players,
    gameState?.currentSelectedCards,
    gameState?.currentSelectedStatName,
    toast,
    updateGameState,
    clearTurnTimers
]);
  
  useEffect(() => {
    resolveRoundRef.current = _resolveRoundLogic;
  }, [_resolveRoundLogic]);


  const _prepareNextTurnLogic = useCallback(() => {
    clearTurnTimers();
    if(!gameState || gameState.phase === 'game_over' || !gameState.players || !gameState.deck) return;

    let actualNextPlayerId: string;

    if (gameState.lastRoundWinnerId) {
      actualNextPlayerId = gameState.lastRoundWinnerId;
    } else {
      actualNextPlayerId = gameState.currentPlayerId!;
    }
    
    if (!gameState.players.find(p => p.id === actualNextPlayerId)) {
        actualNextPlayerId = gameState.players[0]?.id || 'player1';
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

    if (nextPlayerToAct && !nextPlayerToAct.isCurrentUser) {
      setTimeout(() => simulateOpponentActionRef.current(), AI_ACTION_DELAY);
    }
  }, [
    gameState?.phase,
    gameState?.currentPlayerId,
    gameState?.lastRoundWinnerId,
    gameState?.players,
    gameState?.deck,
    clearTurnTimers,
    updateGameState,
  ]);

  useEffect(() => {
    prepareNextTurnRef.current = _prepareNextTurnLogic;
  }, [_prepareNextTurnLogic]);


  const _checkGameOverLogic = useCallback(() => {
    clearTurnTimers();
    if(!gameState || !gameState.players || !gameState.deck) {
        console.warn("Check game over called with incomplete state.");
        return;
    }
    
    const currentPlayers = gameState.players;
    // The deck length check for game over might need adjustment if cards are not removed from a central deck,
    // but rather just exchanged between players. Game ends when one player has all cards (or opponent has none).
    const totalCardsInGame = gameState.deck.length; // Assuming deck contains all unique cards that were initially dealt.

    const playerWithAllCards = currentPlayers.find(p => p.cards.length === totalCardsInGame);
    const playerWithNoCards = currentPlayers.find(p => p.cards.length === 0);

    if (playerWithAllCards) {
      updateGameState({
        phase: 'game_over',
        gameWinnerId: playerWithAllCards.id,
        roundMessage: `${playerWithAllCards.name} has all the cards and wins the game!`,
      });
    } else if (playerWithNoCards && currentPlayers.length === TOTAL_PLAYERS) {
      const winner = currentPlayers.find(p => p.id !== playerWithNoCards.id);
      if (winner) {
        updateGameState({
            phase: 'game_over',
            gameWinnerId: winner.id,
            roundMessage: `${playerWithNoCards.name} has no cards left! ${winner.name} wins the game!`,
        });
      } else {
        console.error("Error in game over logic: Player has no cards, but no winner found.");
        prepareNextTurnRef.current();
      }
    } else {
      prepareNextTurnRef.current();
    }
  }, [
    gameState?.players,
    gameState?.deck,
    updateGameState,
    clearTurnTimers
  ]);

  useEffect(() => {
    checkGameOverRef.current = _checkGameOverLogic;
  }, [_checkGameOverLogic]);

  const handleTimeout = useCallback(() => {
    if (!gameState) return;
    const currentUser = gameState.players?.find(p => p.isCurrentUser);
    
    if (!currentUser || currentUser.id !== gameState.turnPlayerId || gameState.phase === 'game_over' || gameState.phase === 'lobby' || gameState.phase === 'toss') {
      return;
    }

    toast({
      title: "Time's up!",
      variant: "destructive",
    });
    
    if (gameState.phase === 'player_turn_select_card') {
      if (currentUser.cards.length > 0) {
        // With top card rule, handleCardSelect() will automatically use cards[0]
        handleCardSelect();
      } else {
        checkGameOverRef.current();
      }
    } else if (gameState.phase === 'player_turn_select_stat' && selectedCardByCurrentUser) {
      const statsKeys = Object.keys(selectedCardByCurrentUser.stats) as (keyof CardStats)[];
      if (statsKeys.length > 0) {
        const randomStat = statsKeys[Math.floor(Math.random() * statsKeys.length)];
        handleStatSelect(randomStat);
      } else {
         checkGameOverRef.current();
      }
    } else if (gameState.phase === 'player_turn_respond_to_opponent_challenge') {
      if (currentUser.cards.length > 0) {
         // With top card rule, handlePlayerResponseToChallenge() will automatically use cards[0]
        handlePlayerResponseToChallenge();
      } else {
        checkGameOverRef.current();
      }
    }
  }, [
    gameState?.phase,
    gameState?.turnPlayerId,
    gameState?.players,
    selectedCardByCurrentUser,
    toast,
    handleCardSelect,
    handleStatSelect,
    handlePlayerResponseToChallenge,
    checkGameOverRef
  ]); 


  const initializeGame = useCallback(() => {
    clearTurnTimers();
    const initialDeck = generateDeck(NUM_CARDS_PER_PLAYER * TOTAL_PLAYERS);
    const hands = dealCards(initialDeck, TOTAL_PLAYERS);
    const playersData = getInitialPlayers(hands);

    updateGameState({
      squadId,
      players: playersData,
      deck: initialDeck,
      currentPlayerId: null,
      turnPlayerId: null,
      phase: 'lobby',
      currentSelectedCards: [],
      currentSelectedStatName: null,
      roundMessage: 'Welcome to Squad Ace! Click "Start Game" to begin.',
      gameWinnerId: null,
      inviteCode: `SQD-${squadId.substring(0, 4).toUpperCase()}`,
      lastRoundWinnerId: null,
    });
    setSelectedCardByCurrentUser(null);
    // setLastPlayedCardIdByCurrentUser(null); // Removed
  }, [squadId, clearTurnTimers, updateGameState]);

  useEffect(() => {
    initializeGame();
    return () => {
      clearTurnTimers();
    };
  }, [initializeGame]);

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
          setCountdown(prev => (prev !== null && prev > 0 ? prev - 1 : (prev === 0 ? 0 : null) ));
        }, 1000);
        turnTimerRef.current = setTimeout(() => handleTimeoutRef.current(), TURN_DURATION_SECONDS * 1000);
      }
    }
    return () => {
      clearTurnTimers();
    };
  }, [gameState?.phase, gameState?.turnPlayerId, gameState?.players, clearTurnTimers]); // Removed handleTimeout from deps, using ref

  const handleTimeoutRef = useRef(handleTimeout);
  useEffect(() => {
    handleTimeoutRef.current = handleTimeout;
  }, [handleTimeout]);

  const handleStartGame = () => {
    clearTurnTimers();
    updateGameState({ phase: 'toss', roundMessage: "Let's toss to see who starts!" });
  };

  const handleTossComplete = (tossWinnerPlayerId: string) => {
    clearTurnTimers();
    const firstPlayer = gameState?.players.find(p => p.id === tossWinnerPlayerId);
    if (!firstPlayer || !gameState) return;

    updateGameState({
      currentPlayerId: tossWinnerPlayerId,
      turnPlayerId: tossWinnerPlayerId,
      phase: firstPlayer.isCurrentUser ? 'player_turn_select_card' : 'opponent_turn_select_card_and_stat',
      roundMessage: `${firstPlayer.name} won the toss! ${firstPlayer.isCurrentUser ? "Select a card." : "Opponent is selecting a card and stat."}`,
    });

    if (!firstPlayer.isCurrentUser) {
      setTimeout(() => simulateOpponentActionRef.current(), AI_ACTION_DELAY);
    }
  };
  

  if (!gameState) {
    return <div className="flex items-center justify-center h-screen"><Info className="mr-2" />Loading game...</div>;
  }

  const currentUser = gameState.players.find(p => p.isCurrentUser);
  const opponent = gameState.players.find(p => !p.isCurrentUser);

  const getCurrentUserPlayerDisplayCardClickHandler = () => {
    if (!currentUser || gameState.turnPlayerId !== currentUser.id || currentUser.cards.length === 0) return undefined;

    // With top card rule, any card click on player's display triggers the top card action
    switch (gameState.phase) {
      case 'player_turn_select_card':
        return () => handleCardSelect(); // Pass a function that calls handleCardSelect without args
      case 'player_turn_respond_to_opponent_challenge':
        return () => handlePlayerResponseToChallenge(); // Same for response
      default:
        return undefined;
    }
  }
  
  const getBattleArenaIconAndTitle = () => {
    if (!opponent) return { icon: <Info className="text-muted-foreground" />, title: "Battle Arena" };
    
    if (((gameState.phase === 'opponent_turn_select_card_and_stat' && gameState.turnPlayerId === opponent.id) ||
        (gameState.phase === 'opponent_turn_selecting_card' && gameState.turnPlayerId === opponent.id))
        && !gameState.currentSelectedCards.find(sel => sel.playerId === opponent.id)
        ) {
        return { icon: <TimerIcon className="animate-pulse text-accent" />, title: "Opponent Thinking..." };
    }
    if (gameState.currentSelectedCards.length > 0 &&
        (gameState.phase === 'reveal' ||
         gameState.phase === 'round_over' ||
         gameState.phase === 'player_turn_respond_to_opponent_challenge' ||
         (gameState.phase === 'opponent_turn_selecting_card' && gameState.currentSelectedCards.some(sel => sel.playerId === currentUser?.id)) ||
         (gameState.phase === 'player_turn_select_stat' && gameState.currentSelectedCards.some(sel => sel.playerId === currentUser?.id))
        )) {
        return { icon: <Swords className="text-primary"/>, title: "Battle Arena" };
    }
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

        let showBattleArenaCards = false;
        if (gameState.currentSelectedCards.length > 0) {
            if (gameState.phase === 'reveal' || gameState.phase === 'round_over') {
                showBattleArenaCards = true;
            } else if (gameState.phase === 'player_turn_respond_to_opponent_challenge' && gameState.currentSelectedCards.some(sel => sel.playerId === opponent?.id)) {
                showBattleArenaCards = true;
            } else if ((gameState.phase === 'opponent_turn_selecting_card' || gameState.phase === 'player_turn_select_stat') && gameState.currentSelectedCards.some(sel => sel.playerId === currentUser?.id) ) {
                showBattleArenaCards = true;
            }
        }
        
        const { icon: arenaIcon, title: arenaTitle } = getBattleArenaIconAndTitle();
        
        // For PlayerDisplay, the playedCard prop should be the top card if it's being shown in battle zone
        const currentUserTopCard = currentUser && currentUser.cards.length > 0 ? currentUser.cards[0] : null;
        const opponentTopCard = opponent && opponent.cards.length > 0 ? opponent.cards[0] : null;


        return (
          <div className="space-y-6 md:space-y-8 w-full">
            {opponent && (
              <PlayerDisplay
                player={opponent}
                isCurrentTurn={gameState.turnPlayerId === opponent.id && (gameState.phase === 'opponent_turn_selecting_card' || gameState.phase === 'opponent_turn_select_card_and_stat')}
                // Display opponent's top card if it's part of the current battle selection
                playedCard={
                  (gameState.phase === 'reveal' || gameState.phase === 'round_over' || gameState.phase === 'player_turn_respond_to_opponent_challenge') &&
                  player2Selection?.card || null
                }
                isBattleZoneCard={
                  (gameState.phase === 'reveal' || gameState.phase === 'round_over' || gameState.phase === 'player_turn_respond_to_opponent_challenge') &&
                  !!player2Selection
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
                           if (p1Val !== p2Val) {
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
                  gameState.phase === 'round_over' && gameState.currentSelectedCards.length > 0 ? "text-xl font-bold" : ""
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
                showStatSelectionForCardId={gameState.phase === 'player_turn_select_stat' ? selectedCardByCurrentUser?.id : null} // selectedCardByCurrentUser is user's top card
                selectedCardId={selectedCardByCurrentUser?.id}
                playedCard={
                  (gameState.phase === 'reveal' || gameState.phase === 'round_over' || gameState.phase === 'opponent_turn_selecting_card' || gameState.phase === 'player_turn_select_stat') &&
                  player1Selection?.card || null
                }
                isBattleZoneCard={
                  (gameState.phase === 'reveal' || gameState.phase === 'round_over' || gameState.phase === 'opponent_turn_selecting_card' || gameState.phase === 'player_turn_select_stat') &&
                  !!player1Selection
                }
              />
            )}

            {(gameState.phase === 'player_turn_select_card' ||
              gameState.phase === 'player_turn_select_stat' ||
              gameState.phase === 'player_turn_respond_to_opponent_challenge') &&
              gameState.turnPlayerId === currentUser?.id && countdown !== null && (
                 <Alert variant="default" className="max-w-md mx-auto">
                    <TimerIcon className="h-4 w-4" />
                    <AlertTitle>
                        Your Turn! ({countdown}s)
                    </AlertTitle>
                    <AlertDescription>
                        {gameState.phase === 'player_turn_select_card' && "Play your top card."}
                        {gameState.phase === 'player_turn_select_stat' && (selectedCardByCurrentUser ? `Selected: ${selectedCardByCurrentUser.name}. Now pick a stat.` : "Pick a stat.")}
                        {gameState.phase === 'player_turn_respond_to_opponent_challenge' &&
                          `Opponent has played. Play your top card to respond using the challenged stat: ${
                            gameState.currentSelectedStatName && opponent && gameState.currentSelectedCards.find(c => c.playerId === opponent.id)?.card?.stats[gameState.currentSelectedStatName]
                              ? gameState.currentSelectedCards.find(c => c.playerId === opponent.id)!.card.stats[gameState.currentSelectedStatName]!.label
                              : 'Error: Stat not found'
                          }.`
                        }
                    </AlertDescription>
                </Alert>
            )}
            {gameState.phase === 'round_over' && !gameState.gameWinnerId && (
                <Button onClick={() => prepareNextTurnRef.current()} className="mx-auto block mt-4" variant="secondary">
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

    