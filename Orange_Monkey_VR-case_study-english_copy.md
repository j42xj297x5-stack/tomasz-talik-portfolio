# Orange Monkey VR — Case Study

## From an interactive portfolio to a full-fledged VR game

### Starting point

Orange Monkey VR began with the idea of bringing my interactive portfolio into virtual reality.

Classic 2D and Experience 3D let visitors explore five areas of my work through symbols, animations, and interactive panels. VR, however, opened up another possibility: instead of viewing the projects from the outside, visitors could enter their world and discover it through their own actions.

The initial concept gradually evolved into a standalone game with a narrative, a progression system, spatial puzzles, and custom mechanics.

The greatest challenge was not simply displaying a scene in a headset. It was building a world that responds to the player's decisions, remembers their consequences, and allows gameplay to develop without losing coherence between the narrative, object states, and available interactions.

---

## 01. Scenario, direction, and gameplay architecture

The foundation of the game became a custom progression system that separates the narrative from the actual state of the world.

Instead of placing all the logic in a single, extensive controller, we developed an architecture built around several cooperating layers:

**Scenario** defines the course of the experience: narrative points, events, transition conditions, and effects that should occur at successive moments in the game.

**Experience Director** tracks the current position in the Scenario and decides when it is possible to advance to the next point.

**RuntimeExperience** interprets Scenario effects and passes them to the appropriate execution systems.

**Actors and domain controllers** manage the actual state of objects, tools, and gameplay mechanics.

This separation made it possible to develop individual elements without making them dependent on one central mechanism.

During production, the architecture underwent successive migrations. We refined transition semantics, separated one-time events from persistent consequences, and developed mechanisms for restoring the Scenario's settled state.

The monkey — the player's guide — plays a special role. Its messages, hints, and mandatory narrative moments are tied to specific events. This allows the story to guide the player without directly taking control of every world mechanic.

---

## 02. Sandbox — freedom of action without losing the narrative

One of the major design challenges was reconciling a linear Scenario with the freedom to act.

The player can discover objects, process matter, tune tools, and install Rune Stones. Not all of these actions have to occur at precisely the moment anticipated by the narrative.

We therefore separated permissions derived from the actual state of the world from the knowledge and progress described by Scenario.

For example, the ability to pull an object may depend on an acquired tool, knowledge of a sign family, and the current targeting state. It does not have to depend on whether the player has reached a particular point in the story.

We also developed **Scenario Progress Reconciliation**, a mechanism that, within its supported scope, lets the narrative catch up with progress resulting from the player's earlier actions.

The system observes facts maintained by the owners of individual mechanics and uses them to advance the Scenario to the appropriate point. In doing so, it neither fabricates events nor reconstructs the world based solely on the player's position in the story.

This solution preserved gameplay independence while maintaining control over mandatory narrative stages.

---

## 03. Custom gameplay mechanics and VR interactions

Orange Monkey VR uses WebXR and motion controllers as the player's primary interface.

Movement is relative to the platform, whose orientation can change during gameplay. The locomotion system accounts for its local plane, and the player can use tools assigned to the left and right hands independently.

The mechanics we developed include:

* spatial object pointing, raycast interactions, and crystal grabbing;
* a reliquary with a card insertion, activation, and confirmation sequence;
* the Astro Furnace for processing matter and constructing items;
* the Astro Attractor (Astrolabium Więzi), with band selection, targeting, and object pulling;
* the Asterion Sphere, which allows control of the platform and its sectors;
* acquiring, tuning, transporting, and installing Rune Stones.

Each mechanic has its own operating conditions and state ownership, allowing it to cooperate with others without duplicating logic.

We did not use a ready-made physics engine or a standard set of game mechanics. We designed the interactions specifically for this world, using spatial mathematics, object transformations, raycasting, and custom state machines.

---

## 04. A world that evolves with the player

The game world is organized around five elemental families: Earth, Fire, Wood, Metal, and Water.

Discovering their corresponding glyphs leads to collecting successive crystals, developing the platform, and learning the world's mechanics. As the player progresses, they gain access to shells, Small Glyphs, new tools, and Rune Stones.

Each stone follows its own acquisition and installation sequence. Placing it changes the state of the corresponding platform sector and opens up new interaction possibilities.

An important element of the later gameplay is the **Asterion Resonator** — a spatial system for detecting and targeting distant objects.

Its field is generated from the current sector configuration. Changes in sector positions affect the geometry of the active region, while registered targets are detected based on their actual positions relative to the nominal field.

Targeting proceeds in stages. Objects receive signs and resonance rings that inform the player about progress, readiness for pulling, and loss of contact.

Detection logic remains separate from presentation geometry. As a result, visual bends, rounded edges, glows, and field animations do not change the rules of gameplay.

The Resonator combines several independent systems into one mechanical whole: sector movement, spatial geometry, target detection, progression, and player feedback.

---

## 05. Technical art, animation, and spatial audio

Orange Monkey VR's visual layer uses GLB models, materials, emissive maps, animations, and procedural effects.

I prepared the models and world elements using Meshy AI, Blender, Inkscape, and GIMP. Adapting geometry, pivots, anchors, and transform hierarchies for use in VR was also an important part of the process.

Visual effects include energy discharges, light-based object responses, animated resonance fields, pulling effects, materialization of platform elements, and the final transformation of the world.

Procedural lightning uses a custom path generator and a bounded pool of shared resources. Its appearance is inspired by branching electrical discharges, but it is not a physical electromagnetic simulation.

The audio layer is equally important.

I prepared a collection of sound effects and soundscapes using Adobe Firefly and ElevenLabs, along with editing and mixing in Ableton Live.

The custom audio system handles event-driven playback, device loops, ambient sequences, and spatial sound sources. HRTF positioning helps the player locate sources in the surrounding world, while separate buses enable independent control of sound categories.

Sound is not merely background. It communicates the state of tools, the beginning of targeting, object acquisition, process completion, and changes taking place in the world.

---

## 06. AI collaboration and the production process

Orange Monkey VR was created through a model of human–AI collaboration based on a clear division of responsibilities.

**My role** covered the concept and creative vision, design of the player experience, mechanics and gameplay flow, requirements definition, asset production, and integration and evaluation of results in an actual VR environment.

**ChatGPT** supported architecture development, dependency analysis, systems design, documentation, audits, and the preparation of implementation tasks.

**Codex** carried out defined programming tasks: module implementation, feature integration, code refactoring, and fixes.

As the project grew in complexity, we also developed the collaboration process itself. Canonical technical models, a Decision Log, a dependency map, standards for writing Scenario points, and a protocol for carrying out bounded tasks were established.

Documentation became the project's operational memory. It made it possible to distinguish the current code from planned features, preserve architectural decisions, and reduce the risk of regressions during successive migrations.

This way of working allowed me to lead a complex creative and technical project, drawing on AI's capabilities without handing over responsibility for the vision, direction of development, or final acceptance of solutions.

---

## Result

Orange Monkey VR is a playable WebXR experience built in JavaScript and rendered with Three.js.

The project includes multi-stage progression, a custom Scenario and direction system, a modular actor architecture, sandbox mechanics, VR interaction tools, a Rune Stone system, the Asterion Resonator, procedural effects, spatial audio, and a narrative ending.

The game takes approximately 40 minutes for a player who already knows the mechanics. For someone discovering the world for the first time, it may take longer.

The game was developed and tested on Meta Quest 3S, also using Virtual Desktop. It is available as a browser-based VR experience, and its code is hosted in a public repository.

**For me, Orange Monkey VR demonstrates how systems design, creative direction, and AI collaboration can come together in the process of creating a complete interactive experience.**
