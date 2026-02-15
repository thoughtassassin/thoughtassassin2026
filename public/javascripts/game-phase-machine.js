const PHASE_TRANSITIONS = {
  title: ['story', 'playing'],
  story: ['title', 'playing'],
  playing: ['respawn-reflection', 'lose-koan', 'lose', 'win-affirmation', 'win'],
  'respawn-reflection': ['respawn', 'playing', 'lose-koan', 'lose'],
  respawn: ['playing', 'lose-koan', 'lose'],
  'lose-koan': ['lose', 'playing', 'title'],
  lose: ['title', 'story', 'playing'],
  'win-affirmation': ['win', 'playing', 'title'],
  win: ['title', 'story', 'playing']
};

function createTransitionSet(additionalTransitions = {}) {
  const merged = {};
  for (const [phase, transitions] of Object.entries(PHASE_TRANSITIONS)) {
    const extra = additionalTransitions[phase] || [];
    merged[phase] = new Set([...transitions, ...extra]);
  }

  for (const [phase, transitions] of Object.entries(additionalTransitions)) {
    if (!merged[phase]) {
      merged[phase] = new Set(transitions || []);
    }
  }

  return merged;
}

export function createGamePhaseMachine(options = {}) {
  const {
    initialPhase = 'title',
    additionalTransitions = {},
    onInvalidTransition = null
  } = options;

  const transitionSet = createTransitionSet(additionalTransitions);
  let currentPhase = initialPhase;

  return {
    get current() {
      return currentPhase;
    },
    canTransition(nextPhase) {
      const next = transitionSet[currentPhase];
      return Boolean(next && next.has(nextPhase));
    },
    transition(nextPhase) {
      if (nextPhase === currentPhase) {
        return currentPhase;
      }

      if (this.canTransition(nextPhase)) {
        currentPhase = nextPhase;
        return currentPhase;
      }

      if (typeof onInvalidTransition === 'function') {
        onInvalidTransition({ from: currentPhase, to: nextPhase });
      }

      return currentPhase;
    }
  };
}
