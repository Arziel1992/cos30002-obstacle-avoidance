# COS30002 — Local Space Obstacle Avoidance

Interactive visualisation of Craig Reynolds' local-space obstacle avoidance algorithm for COS30002 Artificial Intelligence for Games, Module 7.

## Features

- **Five-phase Reynolds algorithm** with annotated telemetry showing which phase is active
- **Detection box** projected ahead of the agent — highlights red on an active threat
- **Local axes** overlay: heading (+X, blue) and side (+Y, green) vectors
- **Force decomposition**: braking (red), lateral (purple), world-space resultant (orange)
- **Wander** steering when no target is placed (jittered circle projection)
- **Target seek** when a target is placed; avoidance forces take priority
- **Place/remove obstacles** by clicking in obstacle mode
- **Live telemetry**: speed, heading, detection box length, active phase, braking/lateral magnitudes
- **Glossary modal** with nine definitions

## Usage

```
npm install
npm run dev
```

Open `http://localhost:5173/cos30002-obstacle-avoidance/`.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| T | Toggle agent trail |
| B | Toggle detection box |
| L | Toggle local axes |
| F | Toggle force vectors |
| R | Reset simulation |
| O | Obstacle placement mode |
| G | Target placement mode |
| Esc | Return to observe mode |

## Controls

| Parameter | Description |
|-----------|-------------|
| Max Speed | Agent velocity cap (px/s) |
| Max Force | Steering acceleration cap — lower = sluggish turns |
| Bounding Radius | Agent body size, inflates obstacle radii during intersection check |
| Box Length | Detection box lookahead distance (px) |
| Braking Weight | Scales the −X (deceleration) force |
| Lateral Multiplier | Scales the ±Y (sideways steering) force |
| Obstacle Avoidance | Global weight on the avoidance steering output |
| Target Seek | Weight on seek behaviour (active when target is placed) |
| Wander | Weight on wander behaviour (active when no target is placed) |

## Stack

- Svelte 5 (runes)
- Vite
- Biome (linting)

## References

- Reynolds, C. (1999). *Steering Behaviors for Autonomous Characters*. GDC 1999.
- Buckland, M. (2005). *Programming Game AI by Example*. Wordware Publishing.
