export function createAudioSystem({
  state,
  getContemplativePolishProfile,
  SOUNDTRACK_MELODY,
  SOUNDTRACK_BASS,
  SOUNDTRACK_STEP_SECONDS,
  FINAL_MESSAGE_THEME_MELODY,
  FINAL_MESSAGE_THEME_BASS,
  FINAL_MESSAGE_THEME_STEP_SECONDS
}) {
  const audio = {
    context: null,
    soundtrackTimer: null,
    soundtrackStep: 0,
    soundtrackActive: false,
    finalThemeTimer: null,
    finalThemeStep: 0,
    finalThemeActive: false,
    contemplativeActive: false,
    droneOsc: null,
    droneGain: null,
    droneLfo: null,
    droneLfoGain: null,
    unlocked: false
  };

  let contemplativeDroneDuckTimer = null;

  function ensureAudioContext() {
    if (!audio.unlocked) {
      return null;
    }

    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) {
      return null;
    }

    if (!audio.context) {
      audio.context = new AudioContextCtor();
    }

    if (audio.context.state === 'suspended') {
      audio.context.resume().catch(() => {});
    }

    return audio.context;
  }

  function playToneAt(context, startTime, { frequency = 440, duration = 0.08, type = 'square', gain = 0.08, endFrequency = null }) {
    const osc = context.createOscillator();
    const amp = context.createGain();
    const endTime = startTime + duration;

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, startTime);
    if (endFrequency !== null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), endTime);
    }

    amp.gain.setValueAtTime(gain, startTime);
    amp.gain.exponentialRampToValueAtTime(0.0001, endTime);

    osc.connect(amp);
    amp.connect(context.destination);
    osc.start(startTime);
    osc.stop(endTime);
  }

  function playTone({ frequency = 440, duration = 0.08, type = 'square', gain = 0.08, endFrequency = null }) {
    if (!state.settings.musicEnabled) {
      return;
    }

    const context = ensureAudioContext();
    if (!context) {
      return;
    }

    playToneAt(context, context.currentTime, { frequency, duration, type, gain, endFrequency });
  }

  function stopContemplativeDrone() {
    if (contemplativeDroneDuckTimer !== null) {
      window.clearTimeout(contemplativeDroneDuckTimer);
      contemplativeDroneDuckTimer = null;
    }

    if (audio.droneOsc) {
      audio.droneOsc.stop();
      audio.droneOsc.disconnect();
      audio.droneOsc = null;
    }
    if (audio.droneLfo) {
      audio.droneLfo.stop();
      audio.droneLfo.disconnect();
      audio.droneLfo = null;
    }
    if (audio.droneLfoGain) {
      audio.droneLfoGain.disconnect();
      audio.droneLfoGain = null;
    }
    if (audio.droneGain) {
      audio.droneGain.disconnect();
      audio.droneGain = null;
    }
  }

  function duckContemplativeDroneForFinalTheme() {
    if (!audio.droneGain || !audio.context) {
      return;
    }

    const now = audio.context.currentTime;
    try {
      audio.droneGain.gain.cancelScheduledValues(now);
      audio.droneGain.gain.setValueAtTime(Math.max(0.0001, audio.droneGain.gain.value), now);
      audio.droneGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
    } catch {
      stopContemplativeDrone();
      return;
    }

    if (contemplativeDroneDuckTimer !== null) {
      window.clearTimeout(contemplativeDroneDuckTimer);
    }
    contemplativeDroneDuckTimer = window.setTimeout(() => {
      contemplativeDroneDuckTimer = null;
      if (audio.contemplativeActive) {
        stopContemplativeDrone();
      }
    }, 460);
  }

  function startContemplativeDrone() {
    if (audio.droneOsc || !state.settings.musicEnabled) {
      return;
    }

    const context = ensureAudioContext();
    if (!context) {
      return;
    }

    const profile = getContemplativePolishProfile();
    const now = context.currentTime;
    const droneGain = context.createGain();
    droneGain.gain.setValueAtTime(0.0001, now);
    droneGain.gain.exponentialRampToValueAtTime(profile.droneGain, now + profile.droneAttackSeconds);

    const droneOsc = context.createOscillator();
    droneOsc.type = 'triangle';
    droneOsc.frequency.setValueAtTime(58, now);

    const lfo = context.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(profile.droneLfoRate, now);
    const lfoGain = context.createGain();
    lfoGain.gain.setValueAtTime(profile.droneLfoDepth, now);

    lfo.connect(lfoGain);
    lfoGain.connect(droneGain.gain);
    droneOsc.connect(droneGain);
    droneGain.connect(context.destination);

    droneOsc.start(now);
    lfo.start(now);

    audio.droneOsc = droneOsc;
    audio.droneGain = droneGain;
    audio.droneLfo = lfo;
    audio.droneLfoGain = lfoGain;
  }

  function setContemplativeMode(isActive) {
    audio.contemplativeActive = isActive;
    if (isActive && state.settings.musicEnabled && audio.unlocked) {
      startContemplativeDrone();
    } else {
      stopContemplativeDrone();
    }
  }

  function tickFinalMessageTheme() {
    if (!audio.finalThemeActive) {
      return;
    }

    const context = ensureAudioContext();
    if (!context) {
      return;
    }

    const profile = getContemplativePolishProfile();
    const stepIndex = audio.finalThemeStep % FINAL_MESSAGE_THEME_MELODY.length;
    const melodyNote = FINAL_MESSAGE_THEME_MELODY[stepIndex];
    const bassNote = FINAL_MESSAGE_THEME_BASS[stepIndex];
    const now = context.currentTime;

    if (melodyNote) {
      playToneAt(context, now, {
        frequency: melodyNote,
        duration: FINAL_MESSAGE_THEME_STEP_SECONDS * 0.96,
        type: 'triangle',
        gain: profile.droneGain * 1.05
      });
    }

    if (bassNote) {
      playToneAt(context, now, {
        frequency: bassNote,
        duration: FINAL_MESSAGE_THEME_STEP_SECONDS,
        type: 'sine',
        gain: profile.droneGain * 0.75
      });
    }

    audio.finalThemeStep += 1;
  }

  function startFinalMessageTheme() {
    if (audio.finalThemeTimer || !state.settings.musicEnabled) {
      return;
    }

    if (!ensureAudioContext()) {
      return;
    }

    duckContemplativeDroneForFinalTheme();

    audio.finalThemeStep = 0;
    tickFinalMessageTheme();
    audio.finalThemeTimer = window.setInterval(tickFinalMessageTheme, FINAL_MESSAGE_THEME_STEP_SECONDS * 1000);
  }

  function stopFinalMessageTheme() {
    if (!audio.finalThemeTimer) {
      return;
    }

    window.clearInterval(audio.finalThemeTimer);
    audio.finalThemeTimer = null;
  }

  function setFinalMessageThemeActive(isActive) {
    audio.finalThemeActive = isActive;
    if (isActive && state.settings.musicEnabled && audio.unlocked) {
      startFinalMessageTheme();
    } else {
      stopFinalMessageTheme();
    }
  }

  function tickSoundtrack() {
    if (!audio.soundtrackActive) {
      return;
    }

    const context = ensureAudioContext();
    if (!context) {
      return;
    }

    const stepIndex = audio.soundtrackStep % SOUNDTRACK_MELODY.length;
    const melodyNote = SOUNDTRACK_MELODY[stepIndex];
    const bassNote = SOUNDTRACK_BASS[stepIndex];
    const now = context.currentTime;

    if (melodyNote) {
      playToneAt(context, now, {
        frequency: melodyNote,
        duration: SOUNDTRACK_STEP_SECONDS * 0.9,
        type: 'square',
        gain: 0.032
      });
    }

    if (bassNote) {
      playToneAt(context, now, {
        frequency: bassNote,
        duration: SOUNDTRACK_STEP_SECONDS * 0.95,
        type: 'triangle',
        gain: 0.022
      });
    }

    audio.soundtrackStep += 1;
  }

  function startSoundtrack() {
    if (audio.soundtrackTimer) {
      return;
    }

    audio.soundtrackStep = 0;
    audio.soundtrackTimer = window.setInterval(tickSoundtrack, SOUNDTRACK_STEP_SECONDS * 1000);
  }

  function stopSoundtrack() {
    if (!audio.soundtrackTimer) {
      return;
    }

    window.clearInterval(audio.soundtrackTimer);
    audio.soundtrackTimer = null;
  }

  function setSoundtrackActive(isActive) {
    audio.soundtrackActive = isActive;
    if (isActive && state.settings.musicEnabled) {
      if (audio.unlocked) {
        startSoundtrack();
      }
    } else {
      stopSoundtrack();
    }
  }

  function unlockAudioFromGesture() {
    if (audio.unlocked) {
      ensureAudioContext();
      return;
    }

    audio.unlocked = true;
    ensureAudioContext();
    if (audio.soundtrackActive) {
      startSoundtrack();
    }
    if (audio.finalThemeActive) {
      startFinalMessageTheme();
    }
    if (audio.contemplativeActive) {
      startContemplativeDrone();
    }
  }

  function playJumpSfx() {
    playTone({ frequency: 280, endFrequency: 510, duration: 0.1, type: 'square', gain: 0.055 });
  }

  function playFireSfx() {
    playTone({ frequency: 920, endFrequency: 510, duration: 0.045, type: 'square', gain: 0.055 });
    playTone({ frequency: 1220, endFrequency: 680, duration: 0.035, type: 'square', gain: 0.03 });
  }

  function playHitSfx() {
    playTone({ frequency: 210, endFrequency: 85, duration: 0.12, type: 'square', gain: 0.085 });
    playTone({ frequency: 128, endFrequency: 64, duration: 0.14, type: 'triangle', gain: 0.05 });
  }

  function playCollectSfx() {
    playTone({ frequency: 660, endFrequency: 988, duration: 0.07, type: 'square', gain: 0.06 });
    playTone({ frequency: 880, endFrequency: 1244, duration: 0.08, type: 'square', gain: 0.05 });
    playTone({ frequency: 1048, endFrequency: 1568, duration: 0.09, type: 'triangle', gain: 0.04 });
  }

  return {
    ensureAudioContext,
    stopContemplativeDrone,
    startContemplativeDrone,
    setContemplativeMode,
    startFinalMessageTheme,
    stopFinalMessageTheme,
    setFinalMessageThemeActive,
    setSoundtrackActive,
    unlockAudioFromGesture,
    playJumpSfx,
    playFireSfx,
    playHitSfx,
    playCollectSfx,
    isFinalThemeActive: () => audio.finalThemeActive,
    isContemplativeActive: () => audio.contemplativeActive,
    isUnlocked: () => audio.unlocked
  };
}
