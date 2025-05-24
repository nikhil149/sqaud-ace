
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
import { ArrowRightLeft, Info, Swords, Trophy, TimerIcon, Pause, Play, ListChecks } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const NUM_CARDS_PER_PLAYER = 5; // This will generate 10 cards total if TOTAL_PLAYERS is 2
const TOTAL_PLAYERS = 2;
const TURN_DURATION_SECONDS = 10;

const AI_ACTION_DELAY = 1000;
const REVEAL_DELAY = 1000;
const ROUND_END_DELAY_DRAW = 2000;
const ROUND_END_DELAY_WIN_LOSS = 2500;


export function GameBoard({ squadId }: { squadId: string }) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const { toast } = useToast();
  const gameStateRef = useRef(gameState);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);


  const [countdown, setCountdown] = useState<number | null>(null);
  const [pausedCountdownValue, setPausedCountdownValue] = useState<number | null>(null);
  const turnTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);


  const updateGameState = useCallback((newState: Partial<GameState>) => {
    setGameState(prev => {
      if (!prev && Object.keys(newState).length === 0) return null;
      const updatedState = { ...(prev || {}), ...newState } as GameState;
       // Ensure players array always exists, even if empty, to prevent undefined errors
      if (!updatedState.players) {
        updatedState.players = [];
      }
      return updatedState;
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


  const _handleCardSelectLogic = useCallback(() => {
    if (!gameStateRef.current || gameStateRef.current.isPaused) return;
    const currentGameState = gameStateRef.current;

    if (currentGameState.phase !== 'player_turn_select_card' || currentGameState.players.find(p => p.isCurrentUser)?.id !== currentGameState.turnPlayerId) return;

    const currentUser = currentGameState.players.find(p => p.isCurrentUser);
    if (!currentUser || currentUser.cards.length === 0) {
      _checkGameOverLogicRef.current();
      return;
    }
    const cardToPlay = currentUser.cards[0];

    clearTurnTimers();
    updateGameState({
      phase: 'player_turn_select_stat',
      roundMessage: `You selected ${cardToPlay.name}. Now pick a stat to challenge with.`,
      currentSelectedCards: [{ playerId: currentUser.id, card: cardToPlay }],
      turnPlayerId: currentUser.id, // Ensure turnPlayerId is correctly set for stat selection
    });
  }, [updateGameState, clearTurnTimers]);
  const handleCardSelectRef = useRef(_handleCardSelectLogic);
  useEffect(() => { handleCardSelectRef.current = _handleCardSelectLogic; }, [_handleCardSelectLogic]);


  const _handleStatSelectLogic = useCallback((statName: keyof CardStats) => {
    if (!gameStateRef.current || gameStateRef.current.isPaused) return;
    const currentGameState = gameStateRef.current;
    const selectedUserCard = currentGameState.currentSelectedCards.find(sel => sel.playerId === currentGameState.players.find(p => p.isCurrentUser)?.id)?.card;

    if (currentGameState.phase !== 'player_turn_select_stat' || !selectedUserCard) return;

    clearTurnTimers();
    const currentUser = currentGameState.players.find(p => p.isCurrentUser);
    if (!currentUser) return;

    const statLabel = selectedUserCard.stats[statName] ? selectedUserCard.stats[statName].label : 'selected stat';

    updateGameState({
      currentSelectedCards: [{ playerId: currentUser.id, card: selectedUserCard }],
      currentSelectedStatName: statName,
      phase: 'opponent_turn_selecting_card',
      turnPlayerId: currentGameState.players.find(p => !p.isCurrentUser)?.id || null,
      roundMessage: `You chose ${statLabel}. Opponent is selecting their card...`,
    });
    setTimeout(() => _simulateOpponentActionLogicRef.current(), AI_ACTION_DELAY);
  }, [updateGameState, clearTurnTimers]);
  const handleStatSelectRef = useRef(_handleStatSelectLogic);
  useEffect(() => { handleStatSelectRef.current = _handleStatSelectLogic; }, [_handleStatSelectLogic]);


  const _handlePlayerResponseToChallengeLogic = useCallback(() => {
    if (!gameStateRef.current || gameStateRef.current.isPaused) return;
    const currentGameState = gameStateRef.current;

    if (currentGameState.phase !== 'player_turn_respond_to_opponent_challenge' || currentGameState.players.find(p => p.isCurrentUser)?.id !== currentGameState.turnPlayerId) return;

    const currentUser = currentGameState.players.find(p => p.isCurrentUser);
    if (!currentUser || currentUser.cards.length === 0 || !currentGameState.currentSelectedStatName) {
      _checkGameOverLogicRef.current();
      return;
    }
    const cardToPlay = currentUser.cards[0];

    clearTurnTimers();

    const opponentCardSelection = currentGameState.currentSelectedCards.find(sc => sc.playerId !== currentUser.id);
    if (!opponentCardSelection) {
      _resolveRoundLogicRef.current();
      return;
    }

    const updatedSelectedCards = [opponentCardSelection, { playerId: currentUser.id, card: cardToPlay }];
    const statLabel = cardToPlay.stats[currentGameState.currentSelectedStatName]
      ? cardToPlay.stats[currentGameState.currentSelectedStatName].label
      : 'selected stat';

    updateGameState({
      currentSelectedCards: updatedSelectedCards,
      phase: 'reveal',
      turnPlayerId: null,
      roundMessage: `You responded with ${cardToPlay.name}. Comparing ${statLabel}!`
    });
    setTimeout(() => _resolveRoundLogicRef.current(), REVEAL_DELAY);
  }, [updateGameState, clearTurnTimers]);
  const handlePlayerResponseToChallengeRef = useRef(_handlePlayerResponseToChallengeLogic);
  useEffect(() => { handlePlayerResponseToChallengeRef.current = _handlePlayerResponseToChallengeLogic; }, [_handlePlayerResponseToChallengeLogic]);


  const _simulateOpponentActionLogic = useCallback(() => {
     if (!gameStateRef.current || gameStateRef.current.isPaused) return;
    const currentGameState = gameStateRef.current;


    if (!currentGameState.players) {
      _checkGameOverLogicRef.current();
      return;
    }

    const opponent = currentGameState.players.find(p => !p.isCurrentUser);
    if (!opponent || opponent.cards.length === 0) {
      _checkGameOverLogicRef.current();
      return;
    }
    const opponentCardToPlay = opponent.cards[0];
     if (!opponentCardToPlay) {
        _checkGameOverLogicRef.current();
        return;
    }


    if (currentGameState.phase === 'opponent_turn_select_card_and_stat') {
      const statsKeys = Object.keys(opponentCardToPlay.stats) as (keyof CardStats)[];
      if (statsKeys.length === 0) {
        _prepareNextTurnLogicRef.current();
        return;
      }
      const opponentChosenStat = statsKeys[Math.floor(Math.random() * statsKeys.length)];
      const statLabel = opponentCardToPlay.stats[opponentChosenStat]?.label || 'a stat';

      updateGameState({
        currentSelectedCards: [{ playerId: opponent.id, card: opponentCardToPlay }],
        currentSelectedStatName: opponentChosenStat,
        phase: 'player_turn_respond_to_opponent_challenge',
        turnPlayerId: currentGameState.players.find(p => p.isCurrentUser)?.id || null,
        roundMessage: `Opponent selected ${opponentCardToPlay.name} and challenges with ${statLabel}. Play your top card to respond!`,
      });

    } else if (currentGameState.phase === 'opponent_turn_selecting_card' && currentGameState.currentSelectedStatName) {
      const userCardSelection = currentGameState.currentSelectedCards.find(sc => sc.playerId === currentGameState.players.find(p => p.isCurrentUser)?.id);
      if (!userCardSelection) {
        _prepareNextTurnLogicRef.current();
        return;
      }

      const userChosenStatLabel = userCardSelection.card.stats[currentGameState.currentSelectedStatName]
        ? userCardSelection.card.stats[currentGameState.currentSelectedStatName].label
        : 'selected stat';

      const updatedSelectedCards = [userCardSelection, { playerId: opponent.id, card: opponentCardToPlay }];

      updateGameState({
        currentSelectedCards: updatedSelectedCards,
        phase: 'reveal',
        turnPlayerId: null,
        roundMessage: `Opponent responded with ${opponentCardToPlay.name}. Comparing your chosen stat: ${userChosenStatLabel}!`,
      });
      setTimeout(() => _resolveRoundLogicRef.current(), REVEAL_DELAY);
    } else {
      _checkGameOverLogicRef.current();
    }
  }, [updateGameState]);
  const _simulateOpponentActionLogicRef = useRef(_simulateOpponentActionLogic);
  useEffect(() => { _simulateOpponentActionLogicRef.current = _simulateOpponentActionLogic; }, [_simulateOpponentActionLogic]);


  const _resolveRoundLogic = useCallback(() => {
    if (!gameStateRef.current || gameStateRef.current.isPaused) return;
    clearTurnTimers();
    const currentGameState = gameStateRef.current;

    if (!currentGameState.currentSelectedStatName || !currentGameState.currentSelectedCards || currentGameState.currentSelectedCards.length < TOTAL_PLAYERS || !currentGameState.players) {
      _checkGameOverLogicRef.current();
      return;
    }

    const statName = currentGameState.currentSelectedStatName;
    const playersCopy = currentGameState.players.map(player => ({
      ...player,
      cards: [...player.cards]
    }));

    const player1 = playersCopy.find(p => p.id === 'player1')!;
    const player2 = playersCopy.find(p => p.id === 'player2')!;

    const player1Selection = currentGameState.currentSelectedCards.find(s => s.playerId === player1.id);
    const player2Selection = currentGameState.currentSelectedCards.find(s => s.playerId === player2.id);

    if (!player1Selection || !player2Selection) {
      _checkGameOverLogicRef.current();
      return;
    }

    const player1PlayedCard = player1Selection.card;
    const player2PlayedCard = player2Selection.card;

    if (!player1PlayedCard.stats[statName] || !player2PlayedCard.stats[statName]) {
      toast({ title: "Error", description: "A card was played without the required stat. Round resolved as draw.", variant: "destructive" });
      player1.cards = player1.cards.filter(c => c.id !== player1PlayedCard.id);
      player1.cards.push(player1PlayedCard);
      player2.cards = player2.cards.filter(c => c.id !== player2PlayedCard.id);
      player2.cards.push(player2PlayedCard);
      updateGameState({
        players: playersCopy,
        phase: 'round_over',
        turnPlayerId: null,
        currentSelectedCards: currentGameState.currentSelectedCards,
        roundMessage: "Error: Stat missing on card. Round is a draw. Cards returned to bottom of decks.",
        lastRoundWinnerId: null,
      });
      setTimeout(() => _checkGameOverLogicRef.current(), ROUND_END_DELAY_DRAW);
      return;
    }

    const player1StatValue = player1PlayedCard.stats[statName].value;
    const player2StatValue = player2PlayedCard.stats[statName].value;

    let roundMessageText = "";
    let roundEndDelay = ROUND_END_DELAY_WIN_LOSS;
    let currentRoundWinnerId: string | null = null;
    let player1WonRound: boolean;

    const lowerIsBetter = statName === 'bowlingAverage' || statName === 'bowlingStrikerate';

    if (player1StatValue === player2StatValue) { // Draw
      player1WonRound = false; // Explicitly false for draw
    } else if (lowerIsBetter) {
      player1WonRound = player1StatValue < player2StatValue;
    } else {
      player1WonRound = player1StatValue > player2StatValue;
    }

    const statLabelForMessage = player1PlayedCard.stats[statName].label;
    const comparisonText = lowerIsBetter ? "(lower is better)" : "";

    if (player1StatValue === player2StatValue) { // Draw
      roundMessageText = `It's a draw on ${statLabelForMessage} ${comparisonText} (${player1StatValue} vs ${player2StatValue})! Cards return to bottom of decks.`;
      roundEndDelay = ROUND_END_DELAY_DRAW;
      currentRoundWinnerId = null;
      player1.cards = player1.cards.filter(c => c.id !== player1PlayedCard.id);
      player1.cards.push(player1PlayedCard);
      player2.cards = player2.cards.filter(c => c.id !== player2PlayedCard.id);
      player2.cards.push(player2PlayedCard);
    } else if (player1WonRound) {
      currentRoundWinnerId = player1.id;
      roundMessageText = `${player1.name} won with ${statLabelForMessage} ${comparisonText} (${player1StatValue} vs ${player2StatValue}) and takes ${player2PlayedCard.name}!`;
      player1.cards = player1.cards.filter(c => c.id !== player1PlayedCard.id);
      player1.cards.push(player1PlayedCard);
      player1.cards.push(player2PlayedCard);
      player2.cards = player2.cards.filter(c => c.id !== player2PlayedCard.id);
    } else { // Player 2 won
      currentRoundWinnerId = player2.id;
      roundMessageText = `${player2.name} won with ${statLabelForMessage} ${comparisonText} (${player2StatValue} vs ${player1StatValue}) and takes ${player1PlayedCard.name}!`;
      player2.cards = player2.cards.filter(c => c.id !== player2PlayedCard.id);
      player2.cards.push(player2PlayedCard);
      player2.cards.push(player1PlayedCard);
      player1.cards = player1.cards.filter(c => c.id !== player1PlayedCard.id);
    }

    toast({
      title: "Round Result",
      description: roundMessageText,
    });

    updateGameState({
      players: playersCopy,
      phase: 'round_over',
      turnPlayerId: null,
      currentSelectedCards: currentGameState.currentSelectedCards,
      roundMessage: roundMessageText,
      lastRoundWinnerId: currentRoundWinnerId,
    });

    setTimeout(() => _checkGameOverLogicRef.current(), roundEndDelay);
  }, [toast, updateGameState, clearTurnTimers]);
  const _resolveRoundLogicRef = useRef(_resolveRoundLogic);
  useEffect(() => { _resolveRoundLogicRef.current = _resolveRoundLogic; }, [_resolveRoundLogic]);


  const _prepareNextTurnLogic = useCallback(() => {
    if (!gameStateRef.current || gameStateRef.current.isPaused) return;
    clearTurnTimers();
    const currentGameState = gameStateRef.current;

    if (currentGameState.phase === 'game_over' || !currentGameState.players || !currentGameState.deck) return;

    let actualNextPlayerId: string;

    if (currentGameState.lastRoundWinnerId) {
      actualNextPlayerId = currentGameState.lastRoundWinnerId;
    } else {
      actualNextPlayerId = currentGameState.currentPlayerId!;
    }

    if (!currentGameState.players.find(p => p.id === actualNextPlayerId)) {
      actualNextPlayerId = currentGameState.players[0]?.id || 'player1';
    }

    const nextPlayerToAct = currentGameState.players.find(p => p.id === actualNextPlayerId);

    updateGameState({
      currentPlayerId: actualNextPlayerId,
      turnPlayerId: actualNextPlayerId,
      phase: nextPlayerToAct?.isCurrentUser ? 'player_turn_select_card' : 'opponent_turn_select_card_and_stat',
      currentSelectedCards: [],
      currentSelectedStatName: null,
      roundMessage: `It's ${nextPlayerToAct?.name}'s turn. ${nextPlayerToAct?.isCurrentUser ? "Play your top card." : "Opponent is selecting card and stat."}`,
    });

    if (nextPlayerToAct && !nextPlayerToAct.isCurrentUser) {
      setTimeout(() => _simulateOpponentActionLogicRef.current(), AI_ACTION_DELAY);
    }
  }, [clearTurnTimers, updateGameState]);
  const _prepareNextTurnLogicRef = useRef(_prepareNextTurnLogic);
  useEffect(() => { _prepareNextTurnLogicRef.current = _prepareNextTurnLogic; }, [_prepareNextTurnLogic]);


  const _checkGameOverLogic = useCallback(() => {
    if (!gameStateRef.current || gameStateRef.current.isPaused) return;
    clearTurnTimers();
    const currentGameState = gameStateRef.current;

    if (!currentGameState.players || !currentGameState.deck) {
      return;
    }

    const totalCardsInGame = currentGameState.deck.length;
    const playerWithAllCards = currentGameState.players.find(p => p.cards.length === totalCardsInGame);
    const playerWithNoCards = currentGameState.players.find(p => p.cards.length === 0);

    if (playerWithAllCards) {
      updateGameState({
        phase: 'game_over',
        gameWinnerId: playerWithAllCards.id,
        roundMessage: `${playerWithAllCards.name} has all the cards and wins the game!`,
      });
    } else if (playerWithNoCards && currentGameState.players.length === TOTAL_PLAYERS) {
      const winner = currentGameState.players.find(p => p.id !== playerWithNoCards.id);
      if (winner) {
        updateGameState({
          phase: 'game_over',
          gameWinnerId: winner.id,
          roundMessage: `${playerWithNoCards.name} has no cards left! ${winner.name} wins the game!`,
        });
      } else {
        _prepareNextTurnLogicRef.current();
      }
    } else {
      _prepareNextTurnLogicRef.current();
    }
  }, [updateGameState, clearTurnTimers]);
  const _checkGameOverLogicRef = useRef(_checkGameOverLogic);
  useEffect(() => { _checkGameOverLogicRef.current = _checkGameOverLogic; }, [_checkGameOverLogic]);


  const _handleTimeoutLogic = useCallback(() => {
    if (!gameStateRef.current || gameStateRef.current.isPaused) return;
    const currentGameState = gameStateRef.current;
    const currentUser = currentGameState.players?.find(p => p.isCurrentUser);

    if (!currentUser || currentUser.id !== currentGameState.turnPlayerId || currentGameState.phase === 'game_over' || currentGameState.phase === 'lobby' || currentGameState.phase === 'toss') {
      return;
    }

    toast({
      title: "Time's up!",
      description: "A random move was made for you.",
      variant: "destructive",
    });

    if (currentGameState.phase === 'player_turn_select_card') {
      if (currentUser.cards.length > 0) {
        handleCardSelectRef.current();
      } else {
        _checkGameOverLogicRef.current();
      }
    } else if (currentGameState.phase === 'player_turn_select_stat' && currentGameState.currentSelectedCards.find(sel => sel.playerId === currentUser.id)?.card) {
      const selectedUserCard = currentGameState.currentSelectedCards.find(sel => sel.playerId === currentUser.id)!.card;
      const statsKeys = Object.keys(selectedUserCard.stats) as (keyof CardStats)[];
      if (statsKeys.length > 0) {
        const randomStat = statsKeys[Math.floor(Math.random() * statsKeys.length)];
        handleStatSelectRef.current(randomStat);
      } else {
        _checkGameOverLogicRef.current();
      }
    } else if (currentGameState.phase === 'player_turn_respond_to_opponent_challenge') {
      if (currentUser.cards.length > 0) {
        handlePlayerResponseToChallengeRef.current();
      } else {
        _checkGameOverLogicRef.current();
      }
    }
  }, [toast]);
  const handleTimeoutRef = useRef(_handleTimeoutLogic);
  useEffect(() => { handleTimeoutRef.current = _handleTimeoutLogic; }, [_handleTimeoutLogic]);


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
      isPaused: false,
    });
    setPausedCountdownValue(null);
  }, [squadId, clearTurnTimers, updateGameState]);

  useEffect(() => {
    initializeGame();
    return () => {
      clearTurnTimers();
    };
  }, [initializeGame]);

  const togglePauseHandler = useCallback(() => {
    const currentGameState = gameStateRef.current;
    if (!currentGameState) return;

    if (currentGameState.isPaused) { // Resuming
      updateGameState({ isPaused: false });
      // Timer restart logic is handled by the useEffect below
    } else { // Pausing
      setPausedCountdownValue(countdown); // Store current live countdown
      clearTurnTimers(); // This will set live countdown to null
      updateGameState({ isPaused: true });
    }
  }, [countdown, updateGameState, clearTurnTimers]);


  useEffect(() => {
    const currentGameState = gameStateRef.current;
    if (!currentGameState || !currentGameState.players || !currentGameState.turnPlayerId) {
      clearTurnTimers();
      return;
    }

    const playerWhoseTurnItIs = currentGameState.players.find(p => p.id === currentGameState.turnPlayerId);
    const isCurrentUserTurnToAct = playerWhoseTurnItIs?.isCurrentUser &&
      (currentGameState.phase === 'player_turn_select_card' ||
        currentGameState.phase === 'player_turn_select_stat' ||
        currentGameState.phase === 'player_turn_respond_to_opponent_challenge');

    if (currentGameState.isPaused || !isCurrentUserTurnToAct) {
      clearTurnTimers(); // Clears timers and sets live countdown to null
      return;
    }

    // If resuming and there was a paused value, use it. Otherwise, start fresh.
    const duration = pausedCountdownValue !== null ? pausedCountdownValue : TURN_DURATION_SECONDS;
    setPausedCountdownValue(null); // Clear paused value as it's now being used or was null

    setCountdown(duration);
    countdownIntervalRef.current = setInterval(() => {
      setCountdown(prev => (prev !== null && prev > 0 ? prev - 1 : (prev === 0 ? 0 : null)));
    }, 1000);
    turnTimerRef.current = setTimeout(() => handleTimeoutRef.current(), duration * 1000);


    return () => {
      clearTurnTimers();
    };
  }, [gameStateRef.current?.phase, gameStateRef.current?.turnPlayerId, gameStateRef.current?.isPaused, gameStateRef.current?.players, clearTurnTimers]);


  const handleStartGame = () => {
    if (gameStateRef.current?.isPaused) return;
    clearTurnTimers();
    updateGameState({ phase: 'toss', roundMessage: "Let's toss to see who starts!" });
  };

  const handleTossComplete = (tossWinnerPlayerId: string) => {
    if (gameStateRef.current?.isPaused) return;
    clearTurnTimers();
    const currentGameState = gameStateRef.current;
    if (!currentGameState) return;
    const firstPlayer = currentGameState.players.find(p => p.id === tossWinnerPlayerId);
    if (!firstPlayer) return;

    updateGameState({
      currentPlayerId: tossWinnerPlayerId,
      turnPlayerId: tossWinnerPlayerId,
      phase: firstPlayer.isCurrentUser ? 'player_turn_select_card' : 'opponent_turn_select_card_and_stat',
      roundMessage: `${firstPlayer.name} won the toss! ${firstPlayer.isCurrentUser ? "Play your top card." : "Opponent is selecting a card and stat."}`,
    });

    if (!firstPlayer.isCurrentUser) {
      setTimeout(() => _simulateOpponentActionLogicRef.current(), AI_ACTION_DELAY);
    }
  };


  if (!gameState) {
    return <div className="flex items-center justify-center h-screen"><Info className="mr-2" />Loading game...</div>;
  }

  const currentUser = gameState.players.find(p => p.isCurrentUser);
  const opponent = gameState.players.find(p => !p.isCurrentUser);
  const isGameActive = gameState.phase !== 'lobby' && gameState.phase !== 'toss' && gameState.phase !== 'game_over';


  const getCurrentUserPlayerDisplayCardClickHandler = () => {
    if (!currentUser || gameState.turnPlayerId !== currentUser.id || currentUser.cards.length === 0 || gameState.isPaused) return undefined;

    switch (gameState.phase) {
      case 'player_turn_select_card':
        return () => handleCardSelectRef.current();
      case 'player_turn_respond_to_opponent_challenge':
        return () => handlePlayerResponseToChallengeRef.current();
      default:
        return undefined;
    }
  }

  const getBattleArenaIconAndTitle = () => {
    if (!opponent && gameState.phase !== 'player_turn_select_stat') return { icon: <Info className="text-muted-foreground" />, title: "Battle Arena" };
     if (gameState.phase === 'player_turn_select_stat') {
      return { icon: <ListChecks className="text-accent" />, title: "Choose Stat" };
    }
    if (((gameState.phase === 'opponent_turn_select_card_and_stat' && gameState.turnPlayerId === opponent?.id) ||
      (gameState.phase === 'opponent_turn_selecting_card' && gameState.turnPlayerId === opponent?.id))
      && !gameState.currentSelectedCards.find(sel => sel.playerId === opponent?.id)
    ) {
      return { icon: <TimerIcon className="animate-pulse text-accent" />, title: "Opponent Thinking..." };
    }
    if (gameState.currentSelectedCards.length > 0 &&
      (gameState.phase === 'reveal' ||
        gameState.phase === 'round_over' ||
        gameState.phase === 'player_turn_respond_to_opponent_challenge' ||
        (gameState.phase === 'opponent_turn_selecting_card' && gameState.currentSelectedCards.some(sel => sel.playerId === currentUser?.id))
      )) {
      return { icon: <Swords className="text-primary" />, title: "Battle Arena" };
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
        if (gameState.phase === 'reveal' || gameState.phase === 'round_over') {
          showBattleArenaCards = true;
        } else if (gameState.phase === 'player_turn_respond_to_opponent_challenge' && gameState.currentSelectedCards.some(sel => sel.playerId === opponent?.id)) {
          showBattleArenaCards = true;
        } else if (gameState.phase === 'opponent_turn_selecting_card' && gameState.currentSelectedCards.some(sel => sel.playerId === currentUser?.id)) {
          showBattleArenaCards = true;
        }

        const { icon: arenaIcon, title: arenaTitle } = getBattleArenaIconAndTitle();

        return (
          <div className="space-y-6 md:space-y-8 w-full">
            {opponent && (
              <PlayerDisplay
                player={opponent}
                isCurrentTurn={gameState.turnPlayerId === opponent.id && (gameState.phase === 'opponent_turn_selecting_card' || gameState.phase === 'opponent_turn_select_card_and_stat')}
                playedCard={
                  (showBattleArenaCards && player2Selection?.card) || null
                }
                isBattleZoneCard={showBattleArenaCards && !!player2Selection}
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
                      if (gameState.phase === 'round_over' && gameState.currentSelectedStatName && player1Selection && player2Selection && player1Selection.card.stats[gameState.currentSelectedStatName] && player2Selection.card.stats[gameState.currentSelectedStatName]) {
                        const p1Val = player1Selection.card.stats[gameState.currentSelectedStatName].value;
                        const p2Val = player2Selection.card.stats[gameState.currentSelectedStatName].value;
                        const lowerIsBetter = gameState.currentSelectedStatName === 'bowlingAverage' || gameState.currentSelectedStatName === 'bowlingStrikerate';

                        if (p1Val !== p2Val) {
                           if (lowerIsBetter) {
                             if (p1Val < p2Val && selection.playerId === player1Selection.playerId) isWinningCardInBattle = true;
                             else if (p2Val < p1Val && selection.playerId === player2Selection.playerId) isWinningCardInBattle = true;
                           } else {
                             if (p1Val > p2Val && selection.playerId === player1Selection.playerId) isWinningCardInBattle = true;
                             else if (p2Val > p1Val && selection.playerId === player2Selection.playerId) isWinningCardInBattle = true;
                           }
                        }
                      }
                      return (
                        <div key={selection.playerId} className={cn(
                          "flex flex-col items-center transition-all duration-300",
                          isWinningCardInBattle ? "transform scale-105 shadow-2xl rounded-lg bg-primary/10 p-1" : ""
                        )}>
                          <p className="font-semibold mb-1 text-sm text-foreground/80">
                            {gameState.players.find(p => p.id === selection.playerId)?.name}'s Card
                            {isWinningCardInBattle && <span className="ml-2 text-xs font-bold text-primary">(Winner!)</span>}
                          </p>
                          <CricketCard card={selection.card} isFaceUp={true} compact={false} />
                          {gameState.currentSelectedStatName && selection.card.stats[gameState.currentSelectedStatName] &&
                            (gameState.phase === 'reveal' ||
                              gameState.phase === 'round_over' ||
                              (gameState.phase === 'player_turn_respond_to_opponent_challenge' && selection.card.stats[gameState.currentSelectedStatName]) ||
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
                    gameState.phase === 'round_over' && gameState.lastRoundWinnerId ? "text-xl font-bold text-primary" :
                      gameState.phase === 'round_over' && !gameState.lastRoundWinnerId ? "text-xl font-bold" : ""
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
                onStatSelect={
                  (gameState.phase === 'player_turn_select_stat' && gameState.turnPlayerId === currentUser?.id && !gameState.isPaused)
                    ? handleStatSelectRef.current
                    : undefined
                }
                showStatSelectionForCardId={
                    (gameState.phase === 'player_turn_select_stat' && gameState.currentSelectedCards.find(sel => sel.playerId === currentUser.id)?.card?.id) || null
                }
                selectedCardId={gameState.currentSelectedCards.find(sel => sel.playerId === currentUser.id)?.card?.id}
                playedCard={
                  (showBattleArenaCards && player1Selection?.card) || null
                }
                isBattleZoneCard={showBattleArenaCards && !!player1Selection}
              />
            )}

            {(gameState.phase === 'player_turn_select_card' ||
              gameState.phase === 'player_turn_select_stat' ||
              gameState.phase === 'player_turn_respond_to_opponent_challenge') &&
              gameState.turnPlayerId === currentUser?.id && countdown !== null && !gameState.isPaused && (
                <Alert variant="default" className="max-w-md mx-auto">
                  <TimerIcon className="h-4 w-4" />
                  <AlertTitle>
                    Your Turn! ({countdown}s)
                  </AlertTitle>
                  <AlertDescription>
                    {gameState.phase === 'player_turn_select_card' && "Play your top card."}
                    {gameState.phase === 'player_turn_select_stat' && (gameState.currentSelectedCards.find(sel => sel.playerId === currentUser.id)?.card ? `Selected: ${gameState.currentSelectedCards.find(sel => sel.playerId === currentUser.id)!.card.name}. Now pick a stat.` : "Pick a stat.")}
                    {gameState.phase === 'player_turn_respond_to_opponent_challenge' &&
                      `Opponent has played. Play your top card to respond using the challenged stat: ${gameState.currentSelectedStatName && opponent && gameState.currentSelectedCards.find(c => c.playerId === opponent.id)?.card?.stats[gameState.currentSelectedStatName]
                        ? gameState.currentSelectedCards.find(c => c.playerId === opponent.id)!.card.stats[gameState.currentSelectedStatName]!.label
                        : 'Error: Stat not found'
                      }.`
                    }
                  </AlertDescription>
                </Alert>
              )}
            {gameState.phase === 'round_over' && !gameState.gameWinnerId && (
              <Button onClick={() => _prepareNextTurnLogicRef.current()} className="mx-auto block mt-4" variant="secondary" disabled={gameState.isPaused}>
                Next Round <ArrowRightLeft className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        );
    }
  };

  return (
    <div className="container mx-auto py-4 md:py-8 px-2 md:px-4 flex flex-col items-center relative">
      {isGameActive && !gameState.isPaused && (
        <Button
          onClick={togglePauseHandler}
          variant="outline"
          size="icon"
          className="fixed top-4 right-4 z-40 bg-background/80 hover:bg-background text-foreground"
        >
          <Pause className="h-5 w-5" />
          <span className="sr-only">Pause Game</span>
        </Button>
      )}

      {gameState.isPaused && (
        <div className="fixed inset-0 bg-black/70 flex flex-col items-center justify-center z-50 space-y-4">
          <h2 className="text-4xl font-bold text-primary-foreground">Game Paused</h2>
          <Button onClick={togglePauseHandler} size="lg" variant="secondary">
            <Play className="mr-2 h-5 w-5" /> Resume Game
          </Button>
        </div>
      )}
      {renderGameContent()}
    </div>
  );
}

