# Audio Runtime Model

## Ownership and graph

`src/audio/audioManager.js` is the single audio owner shared by the entry shell, Classic 2D controls, and Experience 3D. It lazily creates a Web Audio graph (`master → destination`, with separate ambient and effects buses), restores the persisted master/mute state, and isolates fetch, decode, playback, storage, and browser-support failures. Public audio URLs always pass through `publicPath(...)`.

The persistent control is mounted once by `src/main.js` outside `#app`. It exposes localized mute semantics and a 0–100 master slider; its perceptual curve is applied at the master gain. Entry buttons remain usable without audio, and delegated button effects exclude range controls, disabled controls, the audio capsule itself, and canvas glyph selection.

## Loading, intro, and ambient contract

The two short UI clicks begin fetching at entry. Selecting Experience 3D is the required user gesture that unlocks/resumes the context, creates and prepares the streaming media elements, begins their non-blocking preload, and prepares the remaining short effects. It does not start music. Classic 2D never starts the intro or ambient. Optional failures settle without blocking the page; Experience 3D awaits only the short-effect preparation attempt before releasing its loader and interaction gate.

Immediately after `loaderOverlay.complete()` and immediately before the text intro starts, Experience 3D makes its single playback attempt for the non-looping `/audio/start.mp3`. That element is connected to the ambient bus, so master volume, mute, and the Ambient session control apply to it. A successful playback starts the five-second delay; a rejected attempt instead measures five seconds from the attempt itself. The text intro is never delayed by audio success, failure, or loading.

Five seconds after that boundary, looping `ambient_01` starts from zero with a five-second perceptual equal-power fade-in while the intro sound continues naturally. The five fixed looping ambient media elements use stable `MediaElementAudioSourceNode` and per-track gain channels. Levels 0 and 1 map to ambient 01, while levels 2–5 map in order to ambient 02–05. The incoming track always starts at zero and crossfades for exactly five seconds; selecting the already mapped track does not restart it. Reset and manual backward changes use the same mapping and crossfade. A newer progression request invalidates an older transition, and completion pauses and rewinds every inactive element so silent streams do not accumulate.

## Interaction synchronization and debug controls

A successful canvas glyph hit starts the non-repeating `click_long` pool before the focus sequence. A prewarmed, available plaque starts the non-repeating glyph-open pool after camera focus and immediately before reveal. Hiding an overlay whose plaque is active starts the non-repeating glyph-close pool at the handoff to the visible-plaque return sequence; fallback panels omit plaque sounds.

Fine-pointer entry onto a new Experience 3D glyph starts the cached, one-shot `glyphHover` effect immediately at local gain 0 and raises it to 1 over exactly 0.5 seconds with a perceptual equal-power curve; movement over that glyph does not restart it. Exit, canvas/window leave, drag, click/opening, and interactive-hover cleanup invalidate pending starts, hold the current local gain, and perceptually fade it to exactly 0 over 1 second. The source remains connected at zero gain for another 0.5 seconds, then stops and disconnects 1.5 seconds after the exit began. A new glyph starts its own fade-in immediately while the previous source fades and holds silently; stale outgoing sources are bounded and cleanup is idempotent, including natural early endings. The hover channel connects to the effects bus and therefore remains subordinate to master, mute, and Effects controls. Touch/coarse-pointer interactions never request it, and an unavailable asset remains non-blocking.

With `?debug`, Scene tuning receives live Ambient and Effects bus sliders with numeric values. They are audio-session controls only: they are not members of scene settings schema version 1 and never enter scene import/export.
