# Maze Lab: Full-Stack Revamp with Claude Code

A detailed breakdown of every system design, architecture, and design decision made while revamping a legacy graph algorithm visualizer into a polished, production-grade web application — entirely through AI-assisted development using Claude Code.

---

## Table of Contents

1. [Project Context](#project-context)
2. [Architecture Decisions](#architecture-decisions)
3. [Design System](#design-system)
4. [Frontend Architecture](#frontend-architecture)
5. [JavaScript Refactoring](#javascript-refactoring)
6. [Animation & Visual Effects Pipeline](#animation--visual-effects-pipeline)
7. [Performance Considerations](#performance-considerations)
8. [Infrastructure & Deployment](#infrastructure--deployment)
9. [Security Posture](#security-posture)
10. [Code Cleanup & Dead Code Elimination](#code-cleanup--dead-code-elimination)

---

## Project Context

**Before:** A vanilla HTML/CSS/JS maze algorithm visualizer built as a coding sample. Three `<canvas>` elements rendered side-by-side using `<body>` as a flex container, with hardcoded colors, no responsive behavior, no stats, and a minimal control panel. The visual design was functional but dated — a dark navy background (`#003049`) with uppercase everything and no clear design language.

**After:** A Dracula-themed, responsive, card-based visualizer with a layered atmospheric effects pipeline (fog, grain, procedural bat animations), live algorithm stats, a unified design system, and automated deployment to Vercel.

**Constraint:** The entire project stays vanilla HTML/CSS/JS — no build tools, no frameworks, no bundlers. This was intentional. The app's scope doesn't justify a React/Vue/Svelte setup, and keeping it zero-dependency means the deployment is a static file serve with no build step. The simplest architecture that serves the use case.

---

## Architecture Decisions

### Why No Framework

This is a 4-file static site. Introducing a framework would add:
- A build step (webpack/vite/turbopack)
- A `node_modules` directory
- A package.json with dependency management
- Framework-specific abstractions around Canvas 2D, which the algorithms interact with directly

The Canvas 2D API is inherently imperative — you call `fillRect()`, `clearRect()`, etc. React's declarative model doesn't add value here; it would just wrap imperative canvas calls in `useEffect` hooks. The decision to stay vanilla was deliberate, not a legacy constraint.

### File Separation Strategy

The codebase was restructured into clear responsibility boundaries:

| File | Responsibility |
|------|---------------|
| `index.html` | Semantic document structure, canvas elements, control wiring |
| `style.css` | Full design system via CSS custom properties, layout, animations, fog effects |
| `script.js` | Maze generation (Prim's algorithm), pathfinding algorithms (DFS, BFS, Bidirectional BFS), canvas rendering, UI state |
| `bats.js` | Isolated procedural bat animation system — self-contained IIFE with zero coupling to the maze logic |

`bats.js` is deliberately isolated as an IIFE (Immediately Invoked Function Expression). It has no shared state with `script.js`, no imports, and no exports. It grabs its own canvas element and runs an independent `requestAnimationFrame` loop. This separation means the atmospheric effect can be removed by deleting one `<script>` tag and one `<canvas>` element with zero side effects on the maze functionality.

---

## Design System

### Dracula Color Palette

The project adopts the [Dracula](https://draculatheme.com) color specification, which provides a well-documented, community-maintained palette:

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg` | `#0d1117` | Page background (darker variant used on alextong.me) |
| `--bg-card` | `#1e1e2e` | Card surfaces |
| `--current-line` | `#44475a` | Borders, slider track |
| `--foreground` | `#f8f8f2` | Primary text, maze path color |
| `--comment` | `#6272a4` | Muted text, descriptions, bat fill color |
| `--pink` | `#ff79c6` | Solution path, card badges, canvas corner accents |
| `--purple` | `#bd93f9` | Buttons, slider thumb, interactive accents |
| `--green` | `#50fa7b` | End marker, stat values |
| `--cyan` | `#8be9fd` | Start marker |
| `--orange` | `#ffb86c` | Explored nodes (algorithm visualization) |

Every color is defined as a CSS custom property in `:root`, enabling theme-wide changes from a single location. The page background uses `#0d1117` rather than Dracula's standard `#282a36` — this matches the alextong.me portfolio site and provides stronger contrast for the card-based layout. The standard `#282a36` is used for the canvas backgrounds where the maze renders, creating a subtle depth distinction between card surface and maze viewport.

### Typography

Two fonts from the DM family (matching alextong.me):
- **DM Sans** (400–700): Body text, headings — a geometric humanist sans-serif with good legibility at small sizes
- **DM Mono** (300–500): Labels, stats, code-like elements, badges — reinforces the technical/laboratory aesthetic

Both are loaded via Google Fonts with `preconnect` hints to `fonts.googleapis.com` and `fonts.gstatic.com` for optimal loading performance.

### Canvas Color Mapping

The maze visualization maps directly to Dracula tokens:

| Visual Element | Color | Dracula Token |
|---------------|-------|---------------|
| Start node | `#8be9fd` | Cyan |
| End node | `#50fa7b` | Green |
| Maze paths & walls | `#f8f8f2` | Foreground |
| Explored cells | `#ffb86c` | Orange |
| Solution path | `#ff79c6` | Pink |
| Canvas background | `#282a36` | Background (standard) |

---

## Frontend Architecture

### Layout System

The layout uses CSS Grid for the main algorithm cards and Flexbox for everything else:

```
header          → centered flex column
controls        → flex row (wraps to column on mobile)
legend          → centered flex row (wraps)
main.grid       → CSS Grid, 3 columns
  article.card  → flex column internally
footer          → centered flex row
```

**Responsive breakpoints:**
- `> 1100px`: 3-column grid (all cards side-by-side)
- `700px – 1100px`: 2-column grid, third card centered spanning full width at 50% max-width
- `< 700px`: Single column stack, controls stack vertically

### Semantic HTML

The original markup used `<body>` as the layout container with `<div class="container">` wrappers. The revamp uses semantic elements:
- `<header>` for title/subtitle
- `<section>` for controls
- `<main>` for the algorithm grid
- `<article>` for each algorithm card (self-contained, meaningful on its own)
- `<footer>` for attribution

### Canvas Scaling Strategy

Each canvas has a fixed resolution of `395×395` pixels (set via HTML attributes), which matches the maze grid math: 40 cells × 5px per cell × 2 spacing = 400px. CSS scales them to fill their container with `width: 100%; height: auto;`, which means:
- The canvas pixel buffer stays fixed at 395×395 regardless of display size
- The browser scales the rendered output via CSS — no JS resize logic needed
- The maze drawing code works with the same coordinate system at every viewport width

This is a deliberate tradeoff: at very large displays the maze will appear slightly soft due to CSS upscaling, but it avoids the complexity of dynamically recalculating canvas resolution and redrawing.

### Staggered Entry Animations

Cards use CSS custom properties for animation delay:

```html
<article class="card" style="--delay: 0">
<article class="card" style="--delay: 1">
<article class="card" style="--delay: 2">
```

```css
.card {
    animation: fadeUp 0.5s calc(var(--delay) * 0.12s + 0.2s) ease-out both;
}
```

This creates a staggered cascade effect where each card fades up 120ms after the previous one. The `both` fill mode ensures cards stay invisible before their delay kicks in and remain in their final position after.

---

## JavaScript Refactoring

### Extracted `runMaze()` Function

The original code duplicated the entire maze initialization sequence: once at page load and once in the refresh button handler. The revamp extracts this into a single `runMaze()` function called from both paths, eliminating ~30 lines of duplicated code.

### Added Algorithm Statistics

A `nodesExplored` counter was added to the `Maze` class, incremented in each search method (`depthFirstSearch`, `breadthFirstSearch`, `bidirectionalSearch`) at the point where a node is visited. After each solve, `updateStats()` writes the explored count and solution path length to the DOM.

This enables direct comparison between algorithms on the same maze:
- **DFS** typically explores many nodes but doesn't guarantee shortest path
- **BFS** explores layer-by-layer and guarantees shortest path
- **Bidirectional BFS** explores from both ends simultaneously, reducing the search space

### Maze Generation Algorithm

The maze uses **Randomized Prim's Algorithm** — a spanning tree algorithm that:
1. Starts with a single cell in the tree
2. Maintains a list of edges adjacent to the tree
3. Randomly selects an edge, adds the connected cell to the tree
4. Filters out edges that would create cycles
5. Repeats until all cells are connected

This produces a perfect maze (exactly one path between any two cells) with a natural-looking distribution of corridors.

### Animation Timing Architecture

The `makeDelayedExec()` closure creates a queue-based animation system:
- Each algorithm call pushes rendering callbacks to a queue
- A `setInterval` dequeues and executes one callback per tick
- The interval duration (controlled by the speed slider) determines animation speed
- At speed 0, all callbacks execute on the next interval tick (effectively instant)

This decouples algorithm execution from rendering — the algorithms run synchronously to completion, but their visual output is replayed asynchronously through the queue.

### Dead Reference Cleanup

The original code referenced `incrementSpeed` and `decrementSpeed` elements that didn't exist in the HTML. These were removed. The `async-fun.js` file (121 lines, entirely commented-out scratch code including closure experiments and graph traversal notes) was deleted.

---

## Animation & Visual Effects Pipeline

The visual atmosphere is built from four independent layers, composited via z-index stacking:

```
z-index: 9999  →  Grain overlay (body::before pseudo-element)
z-index: 10    →  Page content (header, cards, controls, footer)
z-index: 2     →  Bat canvas (procedural animation)
z-index: 1     →  Fog wrapper (3-layer CSS animation)
(base)         →  Body background (#0d1117)
```

### Layer 1: Fog System

Three independent fog layers using two texture images (`fog1.png`, `fog2.png`). Each layer:
- Is `200%` width with two `50%`-width children (creating a seamless loop)
- Drifts left via `fog-drift` keyframe animation
- Has an independent opacity pulse cycle

| Layer | Texture | Drift Speed | Opacity Range | Pulse Duration |
|-------|---------|-------------|---------------|----------------|
| 1 | fog1.png | 60s/cycle | 0.35 – 0.60 | 30s |
| 2 | fog2.png | 45s/cycle | 0.20 – 0.45 | 42s |
| 3 | fog2.png | 35s/cycle | 0.20 – 0.35 | 36s |

The fog wrapper applies a composite CSS filter: `blur(2px) saturate(1.3) hue-rotate(220deg) brightness(1.1)`. The `hue-rotate(220deg)` shifts the neutral fog textures into Dracula's purple range. Each fog image uses a CSS `mask-image` gradient that fades to transparent at the left/right edges, preventing hard seams during the loop.

### Layer 2: Procedural Bat Animation

10 procedurally-drawn bat silhouettes rendered on a fixed `<canvas>` element via `requestAnimationFrame`. Each bat has:

- **Flight path**: Cubic bezier curve with randomized control points
- **Wing animation**: Cosine-driven flap cycle with per-bat frequency and phase offset
- **Body shape**: Procedurally drawn using quadratic bezier curves — ears, wing scallops (3 segments per wing), and body are all parametric based on wingspan
- **Movement modifiers**: Sinusoidal bobbing, rotational wobble, and scale breathing
- **Lifecycle**: Fade in over first 10% of flight, fade out over last 10%, respawn with new random parameters after a 15–40 second delay

The bats are filled with `#6272a4` (Dracula comment color) at low opacity (12–35%), making them subtle atmospheric elements rather than focal points. The entire system respects `prefers-reduced-motion` — if the user has reduced motion enabled, the bat animation doesn't initialize at all.

### Layer 3: Film Grain

An inline SVG data URI using `feTurbulence` (fractal noise, base frequency 0.9, 4 octaves) rendered as a `body::before` pseudo-element at 3% opacity. This adds subtle texture that prevents the dark backgrounds from appearing flat, matching the grain effect used on alextong.me.

---

## Performance Considerations

### GPU Compositing for Fog

Fog layers use `will-change: left, opacity` and `transform: translateZ(0)` to hint the browser to promote them to their own compositor layers. This prevents the fog animations from triggering layout recalculations on the main thread — they run entirely on the GPU compositor.

### Canvas vs. DOM for Bat Animation

The bats use a `<canvas>` element rather than DOM elements because:
- 10 simultaneously animating entities with complex paths would cause significant layout thrashing as DOM nodes
- Canvas compositing is a single rasterization pass per frame
- The procedural wing geometry (20+ bezier curve calls per bat) maps directly to the Canvas 2D API

### Animation Frame Budget

The bat animation runs at display refresh rate (typically 60fps). Each frame clears the canvas and redraws up to 10 bats. The per-bat cost is:
- 1 bezier path evaluation (4 multiplications)
- 4 trig function calls (sin for bob, wobble, scale)
- ~20 quadratic bezier curve path commands
- 1 fill operation

This is well within a 16ms frame budget even on modest hardware.

### Script Loading

Both scripts use the `defer` attribute, meaning they:
- Download in parallel with HTML parsing
- Execute in order after the DOM is fully parsed
- Don't block rendering

`bats.js` loads before `script.js` in document order, but since the bat IIFE and the maze code operate on separate canvas elements with no shared state, execution order between them doesn't matter functionally. The `defer` ordering just ensures predictable initialization.

---

## Infrastructure & Deployment

### Vercel Configuration

The project deploys to Vercel as a static site with zero configuration:
- No `vercel.json` needed — Vercel auto-detects static files
- No build command — files are served directly from the repository root
- Output directory: `.` (root)
- Production URL: `maze-lab-one.vercel.app`

Vercel's GitHub integration (once connected via the dashboard) provides automatic deployments on every push to the `master` branch, with preview deployments for PRs.

### Why Vercel for Static Sites

Vercel's edge network serves static assets from the nearest PoP (Point of Presence), meaning the HTML, CSS, JS, and fog texture images are cached globally. For a static site with no server-side logic, this provides near-optimal latency without any CDN configuration. The free tier covers this use case.

---

## Security Posture

### GitHub Repository Security

Two security features were enabled via the GitHub API:

1. **Secret Scanning**: Monitors all pushed commits for patterns matching known credential formats (API keys, tokens, private keys). If a secret is detected, GitHub creates a security alert.

2. **Push Protection**: Blocks pushes that contain detected secrets before they reach the repository. This is a pre-receive hook that runs server-side — it prevents secrets from ever entering the git history, which is significantly better than detecting them after the fact (since git history is immutable without force-pushing).

These were enabled via the GitHub REST API:
```
PATCH /repos/{owner}/{repo}
{ "security_and_analysis": { "secret_scanning": { "status": "enabled" }, "secret_scanning_push_protection": { "status": "enabled" } } }
```

---

## Code Cleanup & Dead Code Elimination

| What was removed | Why |
|-----------------|-----|
| `async-fun.js` (121 lines) | Entirely commented-out scratch code — closure experiments, graph traversal notes. Not referenced by any file. |
| `incrementSpeed` / `decrementSpeed` references in JS | Referenced DOM elements that didn't exist in the HTML. Dead code from a previous iteration of the speed controls. |
| `"AIRBNB CODING SAMPLE"` comment markers | Meta-comments about the code's origin that don't belong in a production codebase. |
| Duplicated maze initialization logic | The refresh handler was a copy-paste of the initial setup. Extracted into `runMaze()`. |
| Quicksand font import | Replaced by DM Sans + DM Mono to match the portfolio site's design system. |
| IE compatibility meta tag | `<meta http-equiv="X-UA-Compatible" content="IE=edge">` — Internet Explorer is end-of-life. |
