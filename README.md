# Interactive AI Portfolio

Status: **Documentation foundation initialized (pre-runtime)**.

This repository is being prepared for an interactive Three.js-based portfolio centered on a symbolic meditating monkey and interactive portfolio gates (AI Guide, Spotify Digger, Haiku Cosmos, Creative AI, Ethics / Life Protection).

## Documentation entrypoint

- Start here: [`docs/README.md`](docs/README.md)
- Active source of truth: [`docs/current/README.md`](docs/current/README.md)

## Runtime status

No Vite/Three.js runtime has been initialized in this task.

## Vite module resolution note

This project vendors Three.js r184 under `vendor/three` and uses a Vite alias so bare imports of `three` (including inside vendored `GLTFLoader.js`) resolve to `vendor/three/three.module.js`.

## Local setup (placeholder)

Runtime setup will be added once the first MVP implementation task starts.

## Next steps

1. Validate and refine the concept/roadmap document.
2. Create first timestamped project snapshot in `docs/current/audits/snapshots/`.
3. Initialize Vite + Vanilla Three.js MVP structure in a separate implementation task.
