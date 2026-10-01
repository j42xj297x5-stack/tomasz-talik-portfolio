# Tomasz Talik — Interactive Portfolio

An interactive portfolio built as three complementary experiences: a lightweight 2D interface, an exploratory 3D environment, and a standalone WebXR experience — **Orange Monkey VR**.

The project is written in vanilla JavaScript and built around Three.js, WebXR and the browser platform. It started as an experiment in presenting portfolio work spatially and gradually evolved into a complete interactive environment with its own narrative, tools, puzzles, audio design and VR progression.

## Three ways to enter

| Mode                 | Description                                                                                                                |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Classic 2D**       | A lightweight, responsive portfolio for conventional browsing. No Three.js runtime is loaded.                              |
| **Experience 3D**    | A desktop Three.js environment where portfolio projects are explored as objects within an animated spatial scene.          |
| **Orange Monkey VR** | A standalone WebXR experience designed around tracked controllers, spatial interaction and an original progression system. |

## Orange Monkey VR

Orange Monkey VR grew out of the portfolio and became a project of its own.

The player enters a symbolic world accompanied by the Orange Monkey and gradually learns how to interact with its objects and systems. The experience uses controller raycasting, spatial audio, physical-scale interaction, collectible crystals, glyphs, an Astro Furnace, Rune Stones and the Asterion Resonator.

The final progression is built around discovering how these systems relate to one another rather than following a conventional menu-driven game structure.

The VR runtime is implemented directly with Three.js and WebXR rather than a traditional game engine.

## Technology

The project uses Vite, vanilla JavaScript, Three.js r184, WebXR, Web Audio, GLB assets and browser-native UI.

Classic 2D, Experience 3D and Orange Monkey VR have independent runtime boundaries. The VR experience owns its own WebXR renderer, controllers, interaction and progression lifecycle rather than being a VR camera added to the desktop scene.

Production deployment currently uses GitHub Pages.

## Project documentation

The repository contains a maintained technical and design documentation system.

Start with [`docs/README.md`](https://chatgpt.com/g/g-p-6a0f37d78b1c8191bbc63db82b7b70fa-portfolio/c/docs/README.md).

The current documentation hub is [`docs/current/README.md`](https://chatgpt.com/g/g-p-6a0f37d78b1c8191bbc63db82b7b70fa-portfolio/c/docs/current/README.md), while [`docs/current/maps/PROJECT_INDEX.md`](https://chatgpt.com/g/g-p-6a0f37d78b1c8191bbc63db82b7b70fa-portfolio/c/docs/current/maps/PROJECT_INDEX.md) acts as the main map of the current architecture.

Historical implementation plans and superseded designs are kept separately from the current project model.

## AI-assisted production

The project combines manual design and implementation work with generative and AI-assisted tools used during development.

AI tools have been used in parts of the software implementation, concept development, 3D asset production and sound design. Generated material is subsequently integrated, edited and adapted as part of the project.

Specific third-party tools, assets and licensing information will be documented separately.

## Licensing

The repository is intended to use a mixed-license model.

Original source code authored for this project is intended to be released under the **MIT License**.

Original audiovisual material and creative assets for which the author holds the necessary rights are intended to be released under **Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)** unless otherwise noted.

Third-party libraries, generated assets and other materials subject to separate licensing terms will retain their respective licenses.

Exact licensing scope and third-party notices will be added in a separate licensing task.

## Author

**Tomasz Talik**

Concept, art direction, interaction design and project development.
