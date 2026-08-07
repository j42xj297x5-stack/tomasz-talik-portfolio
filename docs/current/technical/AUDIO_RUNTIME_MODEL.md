# Audio Runtime Model

## Ownership and graph

`src/audio/audioManager.js` is the single audio owner shared by the entry shell, Classic 2D controls, and Experience 3D. It lazily creates a Web Audio graph (`master → destination`, with separate ambient and effects buses), restores the persisted master/mute state, and isolates fetch, decode, playback, storage, and browser-support failures. Public audio URLs always pass through `publicPath(...)`.

The persistent control is mounted once by `src/main.js` outside `#app`. It exposes localized mute semantics and a 0–100 master slider; its perceptual curve is applied at the master gain. Entry buttons remain usable without audio, and delegated button effects exclude range controls, disabled controls, the audio capsule itself, and canvas glyph selection.

## Loading, intro, and ambient contract

The Classic 2D and Experience 3D general click effect is `/audio/turn_page_02.mp3`. Both Case Study toggles (`.overlay__case-toggle` and `[data-classic-case-toggle]`) are handled separately: opening plays `/audio/bell_01.mp3`, closing plays `/audio/bell_02.mp3`, and neither action additionally plays the general click. These entry effects begin fetching at entry.

Selecting Experience 3D is the required user gesture that unlocks/resumes the context, creates and prepares the streaming media elements, begins their non-blocking preload, and prepares the remaining short effects. It does not start music. Classic 2D never starts the intro or ambient. Optional failures settle without blocking the page; Experience 3D awaits only the short-effect preparation attempt before releasing its loader and interaction gate.

Immediately after `loaderOverlay.complete()` and immediately before the text intro starts, Experience 3D makes its single playback attempt for the non-looping `/audio/start.mp3`. Its `MediaElementAudioSourceNode` reaches the ambient bus at the prepared source level, without an intro trim; master volume, mute, and the Ambient session control still apply to it. A successful playback starts the five-second delay; a rejected attempt instead measures five seconds from the attempt itself. The text intro is never delayed by audio success, failure, or loading.

Five seconds after that boundary, the looping ambient selected for the current progress level starts from zero with a five-second perceptual equal-power fade-in while the intro sound continues naturally. One explicit resolver supplies both this initial selection and every later progression request:

| `progressLevel` | State boundary | Ambient |
| --- | --- | --- |
| 0 | monkey / main glyphs | `ambient_02.mp3` |
| 1 | first progression step | `ambient_03.mp3` |
| 2 | second progression step | `ambient_04.mp3` |
| 3 | stars | `ambient_04.mp3` |
| 4 | stones | `ambient_01.mp3` |
| 5 | final progression step | `ambient_05.mp3` |

The five fixed looping ambient media elements use stable `MediaElementAudioSourceNode` and per-track gain channels. The incoming track always starts at zero and crossfades for exactly five seconds; level 3 therefore does not restart or change the level 2 track, and `ambient_01` begins only at level 4. Reset and manual backward changes use the same resolver and crossfade. A newer progression request invalidates an older transition, and completion pauses and rewinds every inactive element so silent streams do not accumulate.

## Experience 3D glyph effects

Canvas selection does not add a general or long click. At the existing plaque reveal and restore handoff points, each glyph panel plays exactly one elemental sample for its direction:

| Glyph ID | Open | Close |
| --- | --- | --- |
| `ethics-life-protection` | `/audio/glif_earth_4s_01.mp3` | `/audio/glif_earth_4s_02.mp3` |
| `creative-ai` | `/audio/glif_fire_4s_01.mp3` | `/audio/glif_fire_4s_02.mp3` |
| `ai-guide` | `/audio/glif_wood_4s_01.mp3` | `/audio/glif_wood_4s_02.mp3` |
| `spotify-digger` | `/audio/glif_water_4s_01.mp3` | `/audio/glif_water_4s_02.mp3` |
| `haiku-cosmos` | `/audio/glif_metal_4s_01.mp3` | `/audio/glif_metal_4s_02.mp3` |

Fine-pointer entry onto a new Experience 3D glyph starts decoded `/audio/glif_hover_loop.mp3` as a looping `AudioBufferSourceNode` at local gain 1, without a fade-in. Movement over the same logical glyph ID does not restart it. A glyph-to-null raycast has a 100 ms grace window, while another glyph, canvas/window leave, drag, click/opening, and interaction locking end hover immediately. Exit invalidates pending starts, holds the current local gain, perceptually fades it to exactly zero over 0.2 seconds, then stops and disconnects the source.

A pending start, active source, or fading source owns one non-interruptible lifecycle; further start attempts are ignored rather than queued until cleanup finishes. Changing glyph still updates visual hover normally, but only a later real entry after cleanup may start audio. Cleanup is idempotent, and the request token prevents a canceled unlock/load from starting late. The hover channel connects to the effects bus and therefore remains subordinate to master, mute, and Effects controls. Touch/coarse-pointer interactions never request it, and an unavailable asset remains non-blocking.

## Bus gain and debug controls

Ambient and Effects both default to unity gain (`1.0`) before the unchanged master control and output. The effects bus has no additional technical trim, and the intro has no source-specific trim, so the prepared relative levels of `start.mp3`, ambient tracks, and effects remain intact. The shared effects bus covers general clicks, Case Study bells, elemental glyph panel effects, and glyph hover.

With `?debug`, Scene tuning receives live Ambient and Effects bus sliders with numeric values. They start at unity and remain audio-session controls only: they are not members of scene settings schema version 1 and never enter scene import/export. Their perceptual adjustment and the persistent master/mute behavior are unchanged.
