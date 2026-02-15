export const FINAL_MESSAGE_THEME_MELODY = [196, 220, 247, 220, null, 196, 175, 165, null, 220, 247, 196, null, 165, 147, null];
export const FINAL_MESSAGE_THEME_BASS = [98, null, 98, null, 92, null, 92, null, 87, null, 87, null, 82, null, 82, null];

export const STORY_INTRO_LINES = [
  '> sunrise over the prairie should have meant peace,',
  '> but something old and hungry woke in the grass.',
  '',
  '> the thought-wolves are not flesh alone —',
  '> they are panic, doubt, and the voices that say you should stop.',
  '',
  '> the carrots are memory cores, scattered when the system fractured.',
  '> recover them before the fear-loop deepens and the field collapses.',
  '',
  '> you are RABBIT-01.',
  '> keep moving. keep breathing. keep firing.'
];

export const SOUNDTRACK_MELODY = [659, null, 784, 659, 988, 784, 659, 523, 587, null, 659, 587, 523, 440, 392, null];
export const SOUNDTRACK_BASS = [165, 165, 196, 196, 220, 220, 196, 196, 147, 147, 165, 165, 196, 196, 147, 147];

export const DIFFICULTY_PROFILES = {
  easy: { label: 'Easy', maxMultiplier: 1.35, extraWolfTime: 38 },
  normal: { label: 'Normal', maxMultiplier: 1.85, extraWolfTime: 20 },
  hard: { label: 'Hard', maxMultiplier: 2.35, extraWolfTime: 8 }
};

export const DIFFICULTY_SEQUENCE = ['easy', 'normal', 'hard'];

export const RESPAWN_REFLECTIONS = [
  'The thought-wolves devoured our moment, not our meaning.',
  'I doubt, therefore I rise again against the wolves.',
  'When the abyss of thought stared back, we chose return.',
  'Absurd teeth found us — still, we answer with another step.',
  'What consumed us now will forge the will to continue.',
  'The buried fear wore a wolf-mask; we name it, and stand again.',
  'No script saves us but the one we choose with our next step.',
  'The will aches and asks for rest; still we walk into another dawn.'
];

export const GAME_OVER_KOANS = [
  'Two wolves meet at an empty gate; which one arrives?',
  'The mind runs from fear—who is left to be chased?',
  'When no thought is fed, where does the wolf sleep?',
  'Before the howl is heard, who is listening?',
  'You drop the burden of self; what still needs defending?',
  'If the shadow is yours, why does it bite like a stranger?',
  'No essence waits in the grass; what you choose is what remains.',
  'The will clings, suffers, and clings again—what loosens first?'
];

export const KOAN_CHAPTER_TAGS = [
  'Chapter I: The Empty Gate',
  'Chapter II: The Chasing Mind',
  'Chapter III: The Quiet Wolf',
  'Chapter IV: Before the Howl',
  'Chapter V: Laying Down the Self'
];

export const WIN_CHAPTER_TAGS = [
  'Dawn Note I: Breath Returned',
  'Dawn Note II: Chosen Meaning',
  'Dawn Note III: Quiet Will',
  'Dawn Note IV: Fear Outwalked',
  'Dawn Note V: Self Kept'
];

export const WIN_AFFIRMATIONS = [
  'You faced what rose from within and answered it with motion.',
  'You were not handed meaning; you made it, one choice at a time.',
  'The will pressed hard, and you taught it to become grace.',
  'Fear spoke loudly, but your actions spoke last.',
  'You crossed the field without abandoning yourself.'
];

export const CONTEMPLATIVE_POLISH_PROFILES = {
  balanced: {
    gameOverKoanTypeIntervalMs: 38,
    gameOverKoanReadHoldMs: 3900,
    gameOverFadeDurationMs: 760,
    respawnReflectionTypeIntervalMs: 34,
    respawnReflectionReadHoldMs: 1800,
    respawnReflectionFadeDurationMs: 620,
    contemplativePulseDurationMs: 520,
    droneGain: 0.017,
    droneAttackSeconds: 0.26,
    droneLfoRate: 0.2,
    droneLfoDepth: 0.009
  },
  serene: {
    gameOverKoanTypeIntervalMs: 42,
    gameOverKoanReadHoldMs: 4800,
    gameOverFadeDurationMs: 900,
    respawnReflectionTypeIntervalMs: 36,
    respawnReflectionReadHoldMs: 2100,
    respawnReflectionFadeDurationMs: 700,
    contemplativePulseDurationMs: 620,
    droneGain: 0.015,
    droneAttackSeconds: 0.35,
    droneLfoRate: 0.14,
    droneLfoDepth: 0.008
  },
  dramatic: {
    gameOverKoanTypeIntervalMs: 32,
    gameOverKoanReadHoldMs: 3200,
    gameOverFadeDurationMs: 680,
    respawnReflectionTypeIntervalMs: 30,
    respawnReflectionReadHoldMs: 1400,
    respawnReflectionFadeDurationMs: 520,
    contemplativePulseDurationMs: 440,
    droneGain: 0.02,
    droneAttackSeconds: 0.2,
    droneLfoRate: 0.26,
    droneLfoDepth: 0.011
  }
};

export const ACTIVE_CONTEMPLATIVE_POLISH_PROFILE = 'serene';

export function getContemplativePolishProfile() {
  return CONTEMPLATIVE_POLISH_PROFILES[ACTIVE_CONTEMPLATIVE_POLISH_PROFILE] ?? CONTEMPLATIVE_POLISH_PROFILES.serene;
}

export const RABBIT_ANIMATIONS = {
  idle: {
    fps: 2,
    right: [1],
    left: [1]
  },
  walk: {
    fps: 12,
    right: [1, 2, 3, 4, 5, 6, 7],
    left: [1, 2, 3, 4, 5, 6, 7]
  },
  hurt: {
    fps: 10,
    right: [1, 0],
    left: [1, 0]
  },
  jump: {
    fps: 1,
    right: [3],
    left: [3]
  }
};
