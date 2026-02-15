export function createUiSystem({
  state,
  elements,
  GAME_WIDTH,
  GAME_HEIGHT,
  DIFFICULTY_PROFILES,
  SESSION_JOURNAL_MAX_ENTRIES,
  SETTINGS_STORAGE_KEY,
  SESSION_JOURNAL_STORAGE_KEY
}) {
  const {
    scoreEl,
    highScoreEl,
    livesEl,
    timeEl,
    statusEl,
    stageWrapEl,
    gamePageEl,
    touchControlsEl,
    musicToggleEl,
    difficultyToggleEl,
    fullscreenToggleEl,
    journalListEl
  } = elements;

  function updateHud() {
    scoreEl.textContent = String(state.score);
    if (highScoreEl) {
      highScoreEl.textContent = String(state.highScore);
    }
    livesEl.textContent = String(state.lives);
    timeEl.textContent = String(state.timeLeft);
  }

  function fitStageToViewport() {
    if (!stageWrapEl || !gamePageEl) {
      return;
    }

    const aspect = GAME_WIDTH / GAME_HEIGHT;
    const pageStyle = window.getComputedStyle(gamePageEl);
    const pagePaddingTop = parseFloat(pageStyle.paddingTop) || 0;
    const pagePaddingBottom = parseFloat(pageStyle.paddingBottom) || 0;

    let controlsHeight = 0;
    if (touchControlsEl) {
      const controlsStyle = window.getComputedStyle(touchControlsEl);
      if (controlsStyle.display !== 'none') {
        controlsHeight = touchControlsEl.offsetHeight + 12;
      }
    }

    const horizontalMargin = 16;
    const verticalMargin = 14;
    const availableWidth = Math.max(280, window.innerWidth - horizontalMargin * 2 - pagePaddingTop);
    const availableHeight = Math.max(180, window.innerHeight - verticalMargin * 2 - pagePaddingTop - pagePaddingBottom - controlsHeight);

    let targetWidth = availableWidth;
    let targetHeight = targetWidth / aspect;

    if (targetHeight > availableHeight) {
      targetHeight = availableHeight;
      targetWidth = targetHeight * aspect;
    }

    stageWrapEl.style.width = `${Math.floor(targetWidth)}px`;
    stageWrapEl.style.height = `${Math.floor(targetHeight)}px`;
  }

  function updateSettingsUI() {
    if (musicToggleEl) {
      musicToggleEl.textContent = `Music: ${state.settings.musicEnabled ? 'ON' : 'OFF'} (M)`;
      musicToggleEl.classList.toggle('off', !state.settings.musicEnabled);
    }

    if (difficultyToggleEl) {
      const profile = DIFFICULTY_PROFILES[state.settings.difficulty] ?? DIFFICULTY_PROFILES.normal;
      difficultyToggleEl.textContent = `Difficulty: ${profile.label}`;
    }

    if (fullscreenToggleEl) {
      const isFullscreen = Boolean(document.fullscreenElement);
      fullscreenToggleEl.textContent = `Fullscreen: ${isFullscreen ? 'ON' : 'OFF'}`;
    }
  }

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        if (stageWrapEl && stageWrapEl.requestFullscreen) {
          await stageWrapEl.requestFullscreen();
        }
      } else if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.warn('Fullscreen toggle failed:', error);
    }

    fitStageToViewport();
    updateSettingsUI();
  }

  function saveSettings() {
    try {
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(state.settings));
    } catch {
      return;
    }
  }

  function loadSettings() {
    try {
      const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!raw) {
        updateSettingsUI();
        return;
      }

      const parsed = JSON.parse(raw);
      if (typeof parsed.musicEnabled === 'boolean') {
        state.settings.musicEnabled = parsed.musicEnabled;
      }
      if (typeof parsed.difficulty === 'string' && DIFFICULTY_PROFILES[parsed.difficulty]) {
        state.settings.difficulty = parsed.difficulty;
      }
    } catch {
      // no-op: keep defaults
    }

    updateSettingsUI();
  }

  function saveSessionJournal() {
    try {
      window.sessionStorage.setItem(SESSION_JOURNAL_STORAGE_KEY, JSON.stringify(state.sessionJournal));
    } catch {
      return;
    }
  }

  function loadSessionJournal() {
    try {
      const raw = window.sessionStorage.getItem(SESSION_JOURNAL_STORAGE_KEY);
      if (!raw) {
        state.sessionJournal = [];
        return;
      }

      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        state.sessionJournal = parsed
          .filter((entry) => entry && entry.chapter && entry.koan)
          .map((entry) => ({
            chapter: entry.chapter,
            koan: entry.koan,
            score: entry.score,
            outcome: entry.outcome === 'win' ? 'win' : 'loss'
          }))
          .slice(0, SESSION_JOURNAL_MAX_ENTRIES);
      } else {
        state.sessionJournal = [];
      }
    } catch {
      state.sessionJournal = [];
    }
  }

  function renderSessionJournal() {
    if (!journalListEl) {
      return;
    }

    journalListEl.replaceChildren();
    if (state.sessionJournal.length === 0) {
      const emptyItem = document.createElement('li');
      emptyItem.textContent = 'No entries yet. Survive, fall, and reflect.';
      journalListEl.appendChild(emptyItem);
      return;
    }

    for (const entry of state.sessionJournal) {
      const item = document.createElement('li');
      const meta = document.createElement('span');
      const outcomeLabel = entry.outcome === 'win' ? 'Win' : 'Fall';
      meta.textContent = `${outcomeLabel} • ${entry.chapter} • Score ${entry.score}`;
      const text = document.createElement('div');
      text.textContent = entry.koan;
      item.append(meta, text);
      journalListEl.appendChild(item);
    }
  }

  function appendSessionJournalEntry(chapter, koan, score, outcome = 'loss') {
    state.sessionJournal.unshift({
      chapter,
      koan,
      score,
      outcome
    });

    if (state.sessionJournal.length > SESSION_JOURNAL_MAX_ENTRIES) {
      state.sessionJournal.length = SESSION_JOURNAL_MAX_ENTRIES;
    }

    saveSessionJournal();
    renderSessionJournal();
  }

  function clearSessionJournal() {
    state.sessionJournal = [];
    saveSessionJournal();
    renderSessionJournal();
  }

  function setStatus(message) {
    statusEl.textContent = message;
  }

  return {
    updateHud,
    fitStageToViewport,
    updateSettingsUI,
    toggleFullscreen,
    saveSettings,
    loadSettings,
    saveSessionJournal,
    loadSessionJournal,
    renderSessionJournal,
    appendSessionJournalEntry,
    clearSessionJournal,
    setStatus
  };
}
