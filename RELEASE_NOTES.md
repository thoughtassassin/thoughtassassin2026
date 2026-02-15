# Thought Assassin — Release v0.3.0

## Highlights
- Added full rabbit elimination sequence (spiral shrink, poof, angel rise) on every life loss.
- Added post-death reflective respawn flow with existential quote, gameplay pause, and `3-2-1` return countdown.
- Added final-loss Zen koan presentation with chapter tags, typewriter reveal, hold, fade, then game-over handoff.
- Added pre-win affirmation sequence with rotating Dawn Note chapter tags before final win message.

## Audio & Atmosphere
- Added contemplative drone layer and profile-driven pacing (`balanced`, `serene`, `dramatic`) for reflective transitions.
- Added final message theme and tuned timing so dramatic motif begins with the koan phase.
- Added contemplative cursor, vignette darkening, and pulse effects during reflective overlays.

## Journal & Continuity
- Added session-scoped journal panel to capture win/fall reflections with chapter, quote/affirmation, and score.
- Added clear-journal control and no-immediate-repeat rotation for koans, respawn reflections, and chapter tags.

## Stability
- Fixed transition edge case where final game-over details could fail to reveal after koan flow.
- Added defensive reveal fallback logic around staged lose transition callbacks.

# Thought Assassin — Release v0.2.0

## Highlights
- Added terminal-style story intro with typewriter text and skip/continue behavior.
- Replaced manual start flow with an automatic title countdown (`3-2-1`) into gameplay.
- Added explicit `Play Again` visibility on game-over/win overlays for faster restart flow.
- Added fullscreen toggle in the top settings bar with live ON/OFF state updates.

## Visual/UX Polish
- Refined sun glow/ray blending and removed inner dotted ring artifacts.
- Kept post-intro title messaging minimal and focused.

## Stability
- Diagnostics checked clean after the latest UI and flow changes.

# Thought Assassin — Release v0.1.0

## Highlights
- Upgraded visual direction to a polished retro-arcade style with atmospheric sky, mountain, and cloud rendering.
- Added refined sun treatment with hazy sunburst blending and reduced ring artifacts.
- Improved gameplay feel with hit-stop, hit flash, screen shake, and tuned SFX cadence.
- Added rabbit perspective scaling by depth to improve scene realism.
- Removed startup stage banner so rounds begin immediately.

## Asset/Code Cleanup
- Removed legacy/unused old videogame scripts and styles.
- Removed unused legacy image assets and retained only current runtime assets.
- Removed unused Express boilerplate routes and simplified server to static hosting.

## Stability
- Increased render vertex headroom to prevent geometry budget starvation in dense scenes.
- Workspace diagnostics: no errors.