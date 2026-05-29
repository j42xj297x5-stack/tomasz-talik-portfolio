# Interactive AI Portfolio

Status: **Vite + Vanilla JS + Three.js runtime initialized**.

This repository is being prepared for an interactive Three.js-based portfolio centered on a symbolic meditating monkey and interactive portfolio gates (AI Guide, Spotify Digger, Haiku Cosmos, Creative AI, Ethics / Life Protection).

## Documentation entrypoint

- Start here: [`docs/README.md`](docs/README.md)
- Active source of truth: [`docs/current/README.md`](docs/current/README.md)

## Runtime status

The runtime is a Vite + Vanilla JavaScript modules + Three.js scene. Public runtime assets are loaded from `public/` with URLs normalized through `import.meta.env.BASE_URL` for GitHub Pages.

## Vite module resolution note

This project vendors Three.js r184 under `vendor/three` and uses a Vite alias so bare imports of `three` (including inside vendored `GLTFLoader.js`) resolve to `vendor/three/three.module.js`.

## Local setup and deployment

- Install dependencies: `npm ci`
- Local development: `npm run dev`
- Production build: `npm run build`
- Production preview: `npm run preview`

GitHub Pages uses the Vite base path `/tomasz-talik-portfolio/`. Files in `public/` are exposed from the runtime root, so URLs must not include a `public` segment. Use `publicPath(...)` for dynamic JavaScript asset URLs such as GLB models and the vendored GLTFLoader.

## Next steps

1. Keep binary runtime assets tracked under `public/glb/`, `public/png/`, `public/textures/`, `public/audio/`, or `public/fonts/`.
2. After pushing to the deployment branch, verify the GitHub Actions Pages workflow and check model URLs in browser DevTools.
