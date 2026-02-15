# Thought Assassin — Release v0.3.8

## Highlights
- Added a global typewriter speed multiplier in flow control so all narrative typing sequences can be tuned consistently.
- Applied faster typing cadence in Canvas compatibility mode across intro, koan, respawn reflection, and win affirmation overlays.
- Kept WebGPU/default pacing unchanged while fallback mode now uses a dedicated accelerated multiplier.

## Stability
- Version metadata updated to `0.3.8` and release tagged as `v0.3.8`.

# Thought Assassin — Release v0.3.7

## Highlights
- Fixed Canvas fallback black-ground issue by increasing geometry buffer capacity and stabilizing frame clear behavior.
- Increased story typewriter speed in Canvas compatibility mode to better match perceived pacing.
- Removed the rabbit highlight oval in Canvas fallback for cleaner sprite presentation.

## Stability
- Version metadata updated to `0.3.7` and release tagged as `v0.3.7`.

# Thought Assassin — Release v0.3.6

## Highlights
- Updated Canvas compatibility mode to render background, wolves, and carrots using the same shared geometry/color paths as the WebGPU renderer.
- Improved visual parity by rasterizing shared triangle data on Canvas2D, reducing style drift between fallback and native WebGPU paths.
- Kept existing rabbit sprite-sheet parity and fallback mode behavior intact.

## Stability
- Version metadata updated to `0.3.6` and release tagged as `v0.3.6`.

# Thought Assassin — Release v0.3.5

## Highlights
- Fixed Canvas fallback rabbit rendering to use the exact same sprite-sheet frame selection fields as WebGPU (`frameX`, `frameY`, `frameWidth`, `frameHeight`).
- Preserved a safe fallback rabbit silhouette only when sprite assets are unavailable or invalid.
- Added a lightweight on-screen `Renderer: Canvas Compatibility` badge for QA/debug visibility when fallback mode is active.

## Stability
- Version metadata updated to `0.3.5` and release tagged as `v0.3.5`.

# Thought Assassin — Release v0.3.4

## Highlights
- Fixed Canvas compatibility rabbit visibility by validating sprite-frame bounds and falling back to a procedural rabbit when sprite sampling is invalid.
- Improved Canvas fallback visual quality with richer cloud layering, horizon glow, textured ground passes, and upgraded carrot/wolf shading.
- Enhanced fallback effect readability with improved collect sparkles and stronger character silhouette separation.

## Stability
- Version metadata updated to `0.3.4` and release tagged as `v0.3.4`.

# Thought Assassin — Release v0.3.3

## Highlights
- Added a Canvas2D compatibility renderer path so gameplay runs when WebGPU is unavailable (including PlayStation browser scenarios).
- Updated startup flow to try WebGPU first, then automatically switch to Canvas mode on initialization failure.
- Reused existing simulation/input/gameplay systems in compatibility mode so controls, scoring, and enemy logic remain consistent.

## Stability
- Version metadata updated to `0.3.3` and release tagged as `v0.3.3`.

# Thought Assassin — Release v0.3.2

## Highlights
- Fixed directional keyboard input conflicts so pressing one direction clears its opposite, preventing stuck downward movement states.
- Added graceful unsupported-browser handling for non-WebGPU environments with a clear overlay message and status update.
- Improved startup error path so WebGPU initialization failures now present player-facing guidance instead of a silent/console-only failure mode.

## Stability
- Version metadata updated to `0.3.2` and tag `v0.3.2` published.

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