# Majda Kapetanović — Dimensional studio

Local review on `design/dimensional-studio`. This revision is not approved for publication. Do not push, deploy, merge or change the main domain. Verified recovery points are in ROLLBACK.md.

## Design

Graphite surfaces, cool blue accents and local Nimbus Sans typography. A finite, skippable opening introduces the identity. An original platinum MK sculpture responds to pointer movement or an accessible angle slider. Its nine physically rendered Blender views are blended on a Canvas 2D surface; this is a rendered-view interaction, not a live WebGL model. The still image remains available if decoding or Canvas is unavailable.

The six-project browser uses small thumbnails and one compact detail panel. The interface playground changes the actual composition, palette and transition speed. The archive retains twelve projects. Six project pages explain intent and implementation. Contact uses the existing Formspree endpoint, validation, an accessible native dialog and an email fallback.

Afterlight uses Majda’s supplied real 3D capture. Aurelis uses the project’s own watch render. ONYX links to the supplied live experience; its preview is explicitly typographic because the review environment could not capture its original WebGL scene. No invented headphone image is presented as project output.

## Source and checks

- `studio.css`, `studio.js`: active visual system and interactions
- `index.html`, `all-work.html`, `work/`: eight pages
- `assets/monogram/`: nine original rendered views
- `scripts/render-monogram.py`: portable Blender scene recreation
- `assets/fonts/LICENSE.txt`: Nimbus Sans license

```sh
node --check studio.js
node scripts/check-atelier.mjs
node scripts/build-static.mjs
```

Source validation covers local references, project routes, metadata, duplicate IDs, anchors, project images, original ONYX URL, form fields and the nine rendered assets. It does not establish browser layout, touch behavior, accessibility conformance or performance.

The final browser review of this revision is pending because the CUA browser tool became unavailable. No substitute browser process was launched. No real enquiry was sent. Test desktop and phone layouts, keyboard project selection, playground changes, dialog focus, reduced motion and provider responses before proposing publication.

To recreate the monogram, run Blender 4.3 or compatible with `blender -b -t 8 --python scripts/render-monogram.py`. `MK_RENDER_OUTPUT` selects the PNG output directory. Convert each rendered PNG to 900×525 WebP with a 3px median filter, quality 91. The repository already contains the resulting assets; rendering is not required to run the site.
