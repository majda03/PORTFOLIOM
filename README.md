# Majda Kapetanović — Digital experiences, with intention.

An independent frontend developer and visual designer's portfolio. The kinetic atelier redesign pairs a near-black and burgundy visual identity with editorial typography, an original interactive ribbon sculpture, and project stories.

Production domain: https://majdakapetanovic.com

## Experience

- Individually choreographed headline letters and progressive section reveals
- Original parametric 3D ribbon rendered locally in Canvas 2D with studio-style reflections; no external model or WebGL dependency
- Pointer-reactive sculpture, pause/play, system reduced-motion preference, offscreen and background-tab suspension
- Selected projects: Afterlight, Aurelis, Oddly Human and Offing Line
- Five project stories, including Royal Cosmetics, plus the previous six archive projects
- Filterable project archive, native disclosure interactions, mobile navigation
- Contact enquiry connected to the existing Formspree endpoint, with honest success/failure feedback and email fallback
- Local licensed fonts, WebP project imagery, semantic HTML and per-route canonical metadata

Projects are labelled as independent concepts. Royal Cosmetics uses simulated checkout. ONYX 500 is awaiting its verified live URL before inclusion.

## Local checks and preview

No dependency installation is required.

```sh
node --check atelier.js
node scripts/check-atelier.mjs
node scripts/build-static.mjs
```

Serve `dist/` using a static HTTP server. The source can also be served directly at its root. Vercel uses the existing static project configuration.

`atelier.css` and `atelier.js` are the active design and interaction layer. Older style/script files are retained for repository history and are not loaded by the redesigned pages. Historic visual tests target the previous design; `check-atelier.mjs` is the current structural check.

## Verification

The redesign is reviewed in a real browser at desktop width and inside responsive viewport frames. Navigation, filtering, disclosure controls, motion pause/play and empty-form validation are checked. A real contact enquiry is not sent during QA. Hardware-specific mobile performance and screen-reader testing have not been independently measured.
