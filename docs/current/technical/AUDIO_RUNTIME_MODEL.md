# Audio Runtime Model

## Ownership and graph

`src/audio/audioManager.js` is the single audio owner shared by the entry shell, Classic 2D controls, and Experience 3D. It lazily creates a Web Audio graph (`master → destination`, with separate ambient and effects buses), restores the persisted master/mute state, and isolates fetch, decode, playback, storage, and browser-support failures. Public audio URLs always pass through `publicPath(...)`.

The persistent control is mounted once by `src/main.js` outside `#app`. It exposes localized mute semantics and a 0–100 master slider; its perceptual curve is applied at the master gain. Entry buttons remain usable without audio, and delegated button effects exclude range controls, disabled controls, the audio capsule itself, and canvas glyph selection.

## Loading and ambient contract

The two short UI clicks begin fetching at entry. Selecting Experience 3D is the required user gesture that unlocks/resumes the context, starts both looping media-element ambient channels with only `ambient_01` audible, and prepares the remaining short effects. Optional failures settle without blocking the page; Experience 3D awaits the preparation attempt before releasing its loader and interaction gate.

Ambient MP3 files remain streaming `HTMLAudioElement` loops connected through two fixed `MediaElementAudioSourceNode` channels. A real `atmosphereProgression.progressLevel` change selects ambient 01 for even levels and ambient 02 for odd levels, restarts the incoming track at zero, and schedules a five-second equal-power Web Audio crossfade. Scheduled automation is replaced from its held state when progression interrupts a transition; channels are reused rather than accumulated.

## Interaction synchronization and debug controls

A successful canvas glyph hit starts the non-repeating `click_long` pool before the focus sequence. A prewarmed, available plaque starts the non-repeating glyph-open pool after camera focus and immediately before reveal. Hiding an overlay whose plaque is active starts the non-repeating glyph-close pool at the handoff to the visible-plaque return sequence; fallback panels omit plaque sounds.

With `?debug`, Scene tuning receives live Ambient and Effects bus sliders with numeric values. They are audio-session controls only: they are not members of scene settings schema version 1 and never enter scene import/export.
