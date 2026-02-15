export function createGameFlowController({
  state,
  elements,
  STORY_INTRO_LINES,
  STORY_TYPE_INTERVAL_MS,
  WIN_CHAPTER_TAGS,
  WIN_AFFIRMATIONS,
  GAME_OVER_KOANS,
  KOAN_CHAPTER_TAGS,
  RESPAWN_REFLECTIONS,
  callbacks
}) {
  const {
    gameOverlayEl,
    overlayTitleEl,
    overlayMessageEl,
    overlayButtonEl
  } = elements;

  const {
    setGamePhase,
    showOverlay,
    hideOverlay,
    setStatus,
    setContemplativeMode,
    setFinalMessageThemeActive,
    setSoundtrackActive,
    setContemplativeTypeCursorActive,
    appendSessionJournalEntry,
    drawWithoutImmediateRepeat,
    getContemplativePolishProfile,
    onTitleCountdownComplete
  } = callbacks;

  let storyTypeTimer = null;
  let storyFullText = '';
  let storyTypedChars = 0;
  let titleCountdownTimer = null;
  let titleCountdownValue = 0;
  let respawnCountdownTimer = null;
  let respawnCountdownValue = 0;
  let gameOverKoanTypeTimer = null;
  let gameOverKoanHoldTimer = null;
  let gameOverKoanRevealTimer = null;
  let respawnReflectionTypeTimer = null;
  let respawnReflectionHoldTimer = null;
  let respawnReflectionRevealTimer = null;
  let winAffirmationTypeTimer = null;
  let winAffirmationHoldTimer = null;
  let winAffirmationRevealTimer = null;
  let contemplativePulseTimer = null;

  function clearStoryTypewriter() {
    if (storyTypeTimer !== null) {
      window.clearInterval(storyTypeTimer);
      storyTypeTimer = null;
    }
  }

  function clearTitleCountdown() {
    if (titleCountdownTimer !== null) {
      window.clearInterval(titleCountdownTimer);
      titleCountdownTimer = null;
    }
    titleCountdownValue = 0;
  }

  function clearRespawnCountdown() {
    if (respawnCountdownTimer !== null) {
      window.clearInterval(respawnCountdownTimer);
      respawnCountdownTimer = null;
    }
    respawnCountdownValue = 0;
  }

  function clearRespawnReflectionSequence() {
    if (respawnReflectionTypeTimer !== null) {
      window.clearInterval(respawnReflectionTypeTimer);
      respawnReflectionTypeTimer = null;
    }
    if (respawnReflectionHoldTimer !== null) {
      window.clearTimeout(respawnReflectionHoldTimer);
      respawnReflectionHoldTimer = null;
    }
    if (respawnReflectionRevealTimer !== null) {
      window.clearTimeout(respawnReflectionRevealTimer);
      respawnReflectionRevealTimer = null;
    }
    setContemplativeTypeCursorActive(false);
  }

  function clearWinAffirmationSequence() {
    if (winAffirmationTypeTimer !== null) {
      window.clearInterval(winAffirmationTypeTimer);
      winAffirmationTypeTimer = null;
    }
    if (winAffirmationHoldTimer !== null) {
      window.clearTimeout(winAffirmationHoldTimer);
      winAffirmationHoldTimer = null;
    }
    if (winAffirmationRevealTimer !== null) {
      window.clearTimeout(winAffirmationRevealTimer);
      winAffirmationRevealTimer = null;
    }
    setContemplativeTypeCursorActive(false);
  }

  function pulseExistentialVignette() {
    if (!gameOverlayEl || !gameOverlayEl.classList.contains('existential-koan')) {
      return;
    }

    const profile = getContemplativePolishProfile();
    gameOverlayEl.style.setProperty('--existential-pulse-ms', `${profile.contemplativePulseDurationMs}ms`);

    gameOverlayEl.classList.remove('existential-pulse');
    void gameOverlayEl.offsetWidth;
    gameOverlayEl.classList.add('existential-pulse');

    if (contemplativePulseTimer !== null) {
      window.clearTimeout(contemplativePulseTimer);
    }
    contemplativePulseTimer = window.setTimeout(() => {
      contemplativePulseTimer = null;
      if (gameOverlayEl) {
        gameOverlayEl.classList.remove('existential-pulse');
      }
    }, profile.contemplativePulseDurationMs);
  }

  function clearGameOverKoanSequence() {
    if (gameOverKoanTypeTimer !== null) {
      window.clearInterval(gameOverKoanTypeTimer);
      gameOverKoanTypeTimer = null;
    }
    if (gameOverKoanHoldTimer !== null) {
      window.clearTimeout(gameOverKoanHoldTimer);
      gameOverKoanHoldTimer = null;
    }
    if (gameOverKoanRevealTimer !== null) {
      window.clearTimeout(gameOverKoanRevealTimer);
      gameOverKoanRevealTimer = null;
    }

    if (contemplativePulseTimer !== null) {
      window.clearTimeout(contemplativePulseTimer);
      contemplativePulseTimer = null;
    }

    if (overlayTitleEl) {
      overlayTitleEl.style.opacity = '';
      overlayTitleEl.style.transition = '';
    }
    if (overlayMessageEl) {
      overlayMessageEl.style.opacity = '';
      overlayMessageEl.style.transition = '';
    }
    if (gameOverlayEl) {
      gameOverlayEl.classList.remove('existential-koan');
      gameOverlayEl.classList.remove('existential-pulse');
    }
    setContemplativeTypeCursorActive(false);
  }

  function updateTitleCountdownMessage() {
    if (!overlayMessageEl || state.gamePhase !== 'title') {
      return;
    }

    overlayMessageEl.textContent = `Collect carrots and avoid wolves. ${titleCountdownValue}`;
  }

  function beginTitleCountdown() {
    clearTitleCountdown();
    titleCountdownValue = 3;
    updateTitleCountdownMessage();

    titleCountdownTimer = window.setInterval(() => {
      if (state.gamePhase !== 'title') {
        clearTitleCountdown();
        return;
      }

      titleCountdownValue -= 1;
      if (titleCountdownValue <= 0) {
        clearTitleCountdown();
        onTitleCountdownComplete();
        return;
      }

      updateTitleCountdownMessage();
    }, 1000);
  }

  function completeStoryTyping() {
    clearStoryTypewriter();
    storyTypedChars = storyFullText.length;
    if (overlayMessageEl) {
      overlayMessageEl.textContent = `${storyFullText}\n\n> press enter to continue`;
    }
    if (overlayButtonEl) {
      overlayButtonEl.textContent = 'Continue';
      overlayButtonEl.style.display = 'inline-block';
    }
  }

  function advanceStoryIntro() {
    if (state.gamePhase !== 'story') {
      return;
    }

    if (storyTypedChars < storyFullText.length) {
      completeStoryTyping();
      return;
    }

    clearStoryTypewriter();
    showTitleScreen();
  }

  function showStoryIntro() {
    clearGameOverKoanSequence();
    clearRespawnReflectionSequence();
    clearWinAffirmationSequence();
    setContemplativeMode(false);
    setFinalMessageThemeActive(false);
    clearRespawnCountdown();
    clearTitleCountdown();
    setGamePhase('story');
    state.running = false;
    state.paused = false;
    setSoundtrackActive(false);

    showOverlay('boot@thought-assassin:~$', '', 'Continue');
    if (gameOverlayEl) {
      gameOverlayEl.classList.add('terminal-overlay');
      gameOverlayEl.scrollTop = 0;
    }
    if (overlayButtonEl) {
      overlayButtonEl.style.display = 'none';
    }

    storyFullText = STORY_INTRO_LINES.join('\n');
    storyTypedChars = 0;
    if (overlayMessageEl) {
      overlayMessageEl.textContent = '';
    }

    clearStoryTypewriter();
    storyTypeTimer = window.setInterval(() => {
      if (state.gamePhase !== 'story') {
        clearStoryTypewriter();
        return;
      }

      storyTypedChars = Math.min(storyTypedChars + 1, storyFullText.length);
      if (overlayMessageEl) {
        overlayMessageEl.textContent = storyFullText.slice(0, storyTypedChars);
      }

      if (storyTypedChars >= storyFullText.length) {
        completeStoryTyping();
      }
    }, STORY_TYPE_INTERVAL_MS);

    setStatus('Initializing narrative feed...');
  }

  function showTitleScreen() {
    clearGameOverKoanSequence();
    clearRespawnReflectionSequence();
    clearWinAffirmationSequence();
    setContemplativeMode(false);
    setFinalMessageThemeActive(false);
    clearRespawnCountdown();
    clearStoryTypewriter();
    clearTitleCountdown();
    setGamePhase('title');
    state.running = false;
    state.paused = false;
    setSoundtrackActive(false);
    if (overlayButtonEl) {
      overlayButtonEl.style.display = 'none';
    }
    showOverlay('Thought Assassin', '', 'Start Game');
    beginTitleCountdown();
    setStatus('Get ready...');
  }

  function revealLoseOverlayDetails(finalMessage) {
    if (!overlayMessageEl || !overlayButtonEl) {
      setGamePhase('lose');
      return;
    }

    overlayMessageEl.textContent = finalMessage;
    overlayMessageEl.style.opacity = '1';
    if (gameOverlayEl) {
      gameOverlayEl.classList.remove('existential-koan');
      gameOverlayEl.classList.remove('existential-pulse');
    }
    setContemplativeMode(false);
    setFinalMessageThemeActive(true);
    setGamePhase('lose');
    overlayButtonEl.style.display = 'inline-block';
  }

  function finishGame(reason) {
    clearGameOverKoanSequence();
    clearRespawnReflectionSequence();
    clearWinAffirmationSequence();
    clearRespawnCountdown();
    clearTitleCountdown();
    setContemplativeMode(false);
    setFinalMessageThemeActive(false);
    state.running = false;
    state.paused = false;
    setSoundtrackActive(false);

    if (reason === 'win') {
      const profile = getContemplativePolishProfile();
      const winChapterTag = drawWithoutImmediateRepeat(WIN_CHAPTER_TAGS, 'winChapter');
      const affirmation = drawWithoutImmediateRepeat(WIN_AFFIRMATIONS, 'win');
      const winMessage = `You survived with ${state.score} points.`;
      appendSessionJournalEntry(winChapterTag, affirmation, state.score, 'win');
      setGamePhase('win-affirmation');
      showOverlay('You Win!', '', 'Play Again');
      if (gameOverlayEl) {
        gameOverlayEl.classList.add('existential-koan');
      }

      if (!overlayTitleEl || !overlayMessageEl || !overlayButtonEl) {
        setGamePhase('win');
        showOverlay('You Win!', winMessage, 'Play Again');
        if (overlayButtonEl) {
          overlayButtonEl.style.display = 'inline-block';
        }
        return;
      }

      overlayButtonEl.style.display = 'none';
      overlayTitleEl.style.opacity = '0';
      overlayMessageEl.textContent = '';
      overlayMessageEl.style.opacity = '1';

      let typedChars = 0;
      setContemplativeTypeCursorActive(true);
      winAffirmationTypeTimer = window.setInterval(() => {
        if (state.gamePhase !== 'win-affirmation') {
          clearWinAffirmationSequence();
          return;
        }

        typedChars = Math.min(typedChars + 1, affirmation.length);
        overlayMessageEl.textContent = `${winChapterTag}\n${affirmation.slice(0, typedChars)}`;
        pulseExistentialVignette();

        if (typedChars >= affirmation.length) {
          setContemplativeTypeCursorActive(false);
          window.clearInterval(winAffirmationTypeTimer);
          winAffirmationTypeTimer = null;

          winAffirmationHoldTimer = window.setTimeout(() => {
            if (state.gamePhase !== 'win-affirmation') {
              clearWinAffirmationSequence();
              return;
            }

            overlayTitleEl.style.transition = `opacity ${profile.respawnReflectionFadeDurationMs}ms ease`;
            overlayMessageEl.style.transition = `opacity ${profile.respawnReflectionFadeDurationMs}ms ease`;
            overlayTitleEl.style.opacity = '1';
            overlayMessageEl.style.opacity = '0';

            winAffirmationRevealTimer = window.setTimeout(() => {
              if (state.gamePhase !== 'win-affirmation') {
                clearWinAffirmationSequence();
                return;
              }

              overlayMessageEl.textContent = winMessage;
              overlayMessageEl.style.opacity = '0';
              if (gameOverlayEl) {
                gameOverlayEl.classList.remove('existential-koan');
              }
              setContemplativeMode(false);
              requestAnimationFrame(() => {
                if (state.gamePhase !== 'win-affirmation') {
                  return;
                }
                overlayMessageEl.style.opacity = '1';
              });

              winAffirmationRevealTimer = window.setTimeout(() => {
                if (state.gamePhase !== 'win-affirmation') {
                  clearWinAffirmationSequence();
                  return;
                }

                setGamePhase('win');
                overlayButtonEl.style.display = 'inline-block';
                clearWinAffirmationSequence();
              }, profile.respawnReflectionFadeDurationMs + 40);
            }, profile.respawnReflectionFadeDurationMs + 40);
          }, profile.gameOverKoanReadHoldMs * 0.5);
        }
      }, profile.respawnReflectionTypeIntervalMs);

      return;
    }

    const koan = drawWithoutImmediateRepeat(GAME_OVER_KOANS, 'gameOver');
    const chapterTag = drawWithoutImmediateRepeat(KOAN_CHAPTER_TAGS, 'chapter');
    const profile = getContemplativePolishProfile();
    const finalMessage = `Final score: ${state.score}. Wolves were too much this run.`;
    appendSessionJournalEntry(chapterTag, koan, state.score);
    setGamePhase('lose-koan');
    showOverlay('Game Over', '', 'Play Again');
    if (gameOverlayEl) {
      gameOverlayEl.classList.add('existential-koan');
    }
    setContemplativeMode(true);
    setFinalMessageThemeActive(true);

    if (!overlayTitleEl || !overlayMessageEl || !overlayButtonEl) {
      setGamePhase('lose');
      showOverlay('Game Over', `${finalMessage} ${koan}`, 'Play Again');
      if (overlayButtonEl) {
        overlayButtonEl.style.display = 'inline-block';
      }
      return;
    }

    overlayButtonEl.style.display = 'none';
    overlayTitleEl.style.opacity = '0';
    overlayMessageEl.textContent = '';
    overlayMessageEl.style.opacity = '1';

    let typedChars = 0;
    setContemplativeTypeCursorActive(true);
    gameOverKoanTypeTimer = window.setInterval(() => {
      if (state.gamePhase !== 'lose-koan') {
        clearGameOverKoanSequence();
        return;
      }

      typedChars = Math.min(typedChars + 1, koan.length);
      overlayMessageEl.textContent = `${chapterTag}\n${koan.slice(0, typedChars)}`;
      pulseExistentialVignette();

      if (typedChars >= koan.length) {
        setContemplativeTypeCursorActive(false);
        window.clearInterval(gameOverKoanTypeTimer);
        gameOverKoanTypeTimer = null;

        gameOverKoanHoldTimer = window.setTimeout(() => {
          if (state.gamePhase !== 'lose-koan') {
            clearGameOverKoanSequence();
            return;
          }
          try {
            setFinalMessageThemeActive(true);
            overlayTitleEl.style.transition = `opacity ${profile.gameOverFadeDurationMs}ms ease`;
            overlayMessageEl.style.transition = `opacity ${profile.gameOverFadeDurationMs}ms ease`;
            overlayTitleEl.style.opacity = '1';
            overlayMessageEl.style.opacity = '0';

            gameOverKoanRevealTimer = window.setTimeout(() => {
              if (state.gamePhase !== 'lose-koan') {
                clearGameOverKoanSequence();
                return;
              }

              try {
                setFinalMessageThemeActive(true);
                overlayMessageEl.textContent = finalMessage;
                overlayMessageEl.style.opacity = '0';
                if (gameOverlayEl) {
                  gameOverlayEl.classList.remove('existential-koan');
                }
                setContemplativeMode(false);
                requestAnimationFrame(() => {
                  if (state.gamePhase !== 'lose-koan') {
                    return;
                  }
                  overlayMessageEl.style.opacity = '1';
                });

                gameOverKoanRevealTimer = window.setTimeout(() => {
                  if (state.gamePhase !== 'lose-koan') {
                    clearGameOverKoanSequence();
                    return;
                  }
                  revealLoseOverlayDetails(finalMessage);
                  clearGameOverKoanSequence();
                }, profile.gameOverFadeDurationMs + 40);
              } catch {
                revealLoseOverlayDetails(finalMessage);
                clearGameOverKoanSequence();
              }
            }, profile.gameOverFadeDurationMs + 40);
          } catch {
            revealLoseOverlayDetails(finalMessage);
            clearGameOverKoanSequence();
          }
        }, profile.gameOverKoanReadHoldMs);
      }
    }, profile.gameOverKoanTypeIntervalMs);
  }

  function getRespawnReflection() {
    return drawWithoutImmediateRepeat(RESPAWN_REFLECTIONS, 'respawn');
  }

  function updateRespawnCountdownMessage(livesLeft) {
    if (!overlayMessageEl || state.gamePhase !== 'respawn') {
      return;
    }

    overlayMessageEl.textContent = `Lives left: ${livesLeft}. Respawning in ${respawnCountdownValue}`;
  }

  function beginRespawnCountdown(livesLeft) {
    clearRespawnCountdown();
    clearRespawnReflectionSequence();
    setGamePhase('respawn-reflection');
    showOverlay('', '', 'Continue');
    if (gameOverlayEl) {
      gameOverlayEl.classList.add('existential-koan');
    }
    setContemplativeMode(true);

    const reflection = getRespawnReflection();
    const profile = getContemplativePolishProfile();
    if (overlayButtonEl) {
      overlayButtonEl.style.display = 'none';
    }
    if (!overlayTitleEl || !overlayMessageEl) {
      setGamePhase('respawn');
      respawnCountdownValue = 3;
      updateRespawnCountdownMessage(livesLeft);
      respawnCountdownTimer = window.setInterval(() => {
        if (state.gamePhase !== 'respawn') {
          clearRespawnCountdown();
          return;
        }

        respawnCountdownValue -= 1;
        if (respawnCountdownValue <= 0) {
          clearRespawnCountdown();
          hideOverlay();
          setGamePhase('playing');
          state.running = true;
          state.paused = false;
          setContemplativeMode(false);
          setSoundtrackActive(true);
          setStatus('Collect targets and survive.');
          return;
        }

        updateRespawnCountdownMessage(livesLeft);
      }, 1000);
      return;
    }

    if (overlayTitleEl) {
      overlayTitleEl.textContent = 'Breathe. Return.';
      overlayTitleEl.style.opacity = '0';
    }
    if (overlayMessageEl) {
      overlayMessageEl.textContent = '';
      overlayMessageEl.style.opacity = '1';
    }

    let typedChars = 0;
    setContemplativeTypeCursorActive(true);
    respawnReflectionTypeTimer = window.setInterval(() => {
      if (state.gamePhase !== 'respawn-reflection' || !overlayMessageEl) {
        clearRespawnReflectionSequence();
        return;
      }

      typedChars = Math.min(typedChars + 1, reflection.length);
      overlayMessageEl.textContent = reflection.slice(0, typedChars);
      pulseExistentialVignette();

      if (typedChars >= reflection.length) {
        setContemplativeTypeCursorActive(false);
        window.clearInterval(respawnReflectionTypeTimer);
        respawnReflectionTypeTimer = null;

        respawnReflectionHoldTimer = window.setTimeout(() => {
          if (state.gamePhase !== 'respawn-reflection' || !overlayMessageEl) {
            clearRespawnReflectionSequence();
            return;
          }

          if (overlayTitleEl) {
            overlayTitleEl.style.transition = `opacity ${profile.respawnReflectionFadeDurationMs}ms ease`;
            overlayTitleEl.style.opacity = '1';
          }
          overlayMessageEl.style.transition = `opacity ${profile.respawnReflectionFadeDurationMs}ms ease`;
          overlayMessageEl.style.opacity = '0';

          respawnReflectionRevealTimer = window.setTimeout(() => {
            if (state.gamePhase !== 'respawn-reflection' || !overlayMessageEl) {
              clearRespawnReflectionSequence();
              return;
            }

            setGamePhase('respawn');
            respawnCountdownValue = 3;
            updateRespawnCountdownMessage(livesLeft);
            overlayMessageEl.style.opacity = '0';

            requestAnimationFrame(() => {
              if (state.gamePhase !== 'respawn') {
                return;
              }
              overlayMessageEl.style.opacity = '1';
            });

            respawnCountdownTimer = window.setInterval(() => {
              if (state.gamePhase !== 'respawn') {
                clearRespawnCountdown();
                return;
              }

              respawnCountdownValue -= 1;
              if (respawnCountdownValue <= 0) {
                clearRespawnCountdown();
                clearRespawnReflectionSequence();
                hideOverlay();
                setGamePhase('playing');
                state.running = true;
                state.paused = false;
                setContemplativeMode(false);
                setSoundtrackActive(true);
                setStatus('Collect targets and survive.');
                return;
              }

              updateRespawnCountdownMessage(livesLeft);
            }, 1000);
          }, profile.respawnReflectionFadeDurationMs + 60);
        }, profile.respawnReflectionReadHoldMs);
      }
    }, profile.respawnReflectionTypeIntervalMs);
  }

  return {
    clearStoryTypewriter,
    clearTitleCountdown,
    clearRespawnCountdown,
    clearRespawnReflectionSequence,
    clearWinAffirmationSequence,
    clearGameOverKoanSequence,
    advanceStoryIntro,
    showStoryIntro,
    showTitleScreen,
    finishGame,
    beginRespawnCountdown
  };
}
