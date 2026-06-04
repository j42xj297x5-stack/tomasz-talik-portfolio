# Portfolio Three.js Lighting and GLB Rendering Audit

## 1. Cel audytu

Celem audytu jest opisanie, jak aktualna scena 3D portfolio realizuje renderer, scenę, kamerę, światło, ładowanie GLB, materiały i prezentację brył. Audyt dotyczy wyłącznie runtime portfolio i nie porównuje go z żadnym innym projektem.

Zakres wykonania:

- nie zmieniono kodu runtime,
- zbadano wskazany pakiet dokumentacji i wskazane pliki runtime,
- dodatkowo przeczytano tylko pliki wynikające bezpośrednio z importów i potrzebne do audytu światła, materiałów, assetów, debug settings, sun/moon, atmosfery, sprite'ów i fallbacków,
- fakty z kodu oddzielono od interpretacji,
- miejsca nieustalone z kodu oznaczono jako `nie ustalono w audycie`.

## 2. Pliki przeczytane

Minimalny pakiet dokumentacji:

- `docs/current/maps/PROJECT_INDEX.md`
- `docs/current/maps/DEPENDENCY_MAP.md`
- `docs/current/technical/FRONTEND_RUNTIME_MODEL.md`
- `docs/current/technical/THREE_SCENE_MODEL.md`
- `docs/current/technical/ARCHITECTURE.md`
- `docs/current/technical/DEPLOYMENT_MODEL.md`

Wskazane pliki runtime:

- `src/experience3d.js`
- `src/scene/createScene.js`
- `src/scene/lights.js`
- `src/scene/monkeyModel.js`
- `src/scene/orbitNodes.js`
- `src/scene/cameraRig.js`
- `src/vendor/three.js`
- `vite.config.js`
- `src/utils/publicPath.js`

Dodatkowe pliki przeczytane, ponieważ bezpośrednio wpływają na audytowane obszary:

- `src/assets/assetManifest.js` — manifest modeli GLB, GLTFLoadera, tekstur i etapów preloadu.
- `src/assets/assetManager.js` — właściwe ładowanie GLB/tekstur/skryptów, cache i klonowanie scen GLTF.
- `src/assets/preloadAssets.js` — diagnostyka preloadu i delegacja do AssetManagera.
- `src/utils/gltfLoader.js` — dynamiczny import vendored `GLTFLoader`.
- `src/scene/centralObject.js` — fallback centralnej bryły po nieudanym modelu małpy.
- `src/scene/sunCycle.js` — model i spotlight słońca.
- `src/scene/moonCycle.js` — model i spotlight księżyca.
- `src/scene/atmosphere.js` — relikty GLB, pył, materiały atmosfery i ich animacja.
- `src/scene/galaxySprites.js` — sprite'y galaktyk i `SpriteMaterial`.
- `src/scene/particles.js` — starszy helper punktów, sprawdzony ze względu na `PointsMaterial`; w aktualnym `experience3d.js` nie jest importowany.
- `src/content/portfolioNodes.js` — ścieżki modeli pięciu glifów.
- `vendor/three/three.module.js` — sprawdzenie domyślnych ustawień Three.js dla `WebGLRenderer`, w szczególności `toneMapping`, `toneMappingExposure` i `outputColorSpace`.

## 3. Renderer i scena

### Fakty z kodu

Renderer jest tworzony w `src/experience3d.js` jako:

```js
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
```

Ustawienia jawnie obecne w portfolio:

| Obszar | Wartość / zachowanie | Plik / miejsce |
| --- | --- | --- |
| `WebGLRenderer` | `new THREE.WebGLRenderer({ canvas, antialias: true })` | `src/experience3d.js` |
| `antialias` | `true` | `src/experience3d.js` |
| `alpha` | nie jest jawnie ustawione; konstruktor nie przekazuje `alpha` | `src/experience3d.js` |
| `toneMapping` | nie jest jawnie ustawione w kodzie portfolio | `src/experience3d.js`; sprawdzone przez wyszukanie `toneMapping` w `src` |
| `toneMappingExposure` | nie jest jawnie ustawione w kodzie portfolio | `src/experience3d.js`; sprawdzone przez wyszukanie `toneMappingExposure` w `src` |
| `outputColorSpace` | nie jest jawnie ustawione w kodzie portfolio | `src/experience3d.js`; sprawdzone przez wyszukanie `outputColorSpace` w `src` |
| domyślne `outputColorSpace` Three.js | `SRGBColorSpace` w vendored `WebGLRenderer` | `vendor/three/three.module.js` |
| domyślne `toneMapping` Three.js | `NoToneMapping` w vendored `WebGLRenderer` | `vendor/three/three.module.js` |
| domyślne `toneMappingExposure` Three.js | `1.0` w vendored `WebGLRenderer` | `vendor/three/three.module.js` |
| `physicallyCorrectLights` / odpowiednik | nie znaleziono jawnego ustawienia; w aktualnym vendored Three.js audyt nie znalazł użycia `physicallyCorrectLights` ani `useLegacyLights` w `src` | `src`; `vendor/three/three.module.js` |
| `shadowMap.enabled` / `shadowMap.type` | nie znaleziono jawnego ustawienia w `src` | `src` |
| pixel ratio | `Math.min(window.devicePixelRatio || 1, 2)` | `handleResize()` w `src/experience3d.js` |
| rozmiar renderera | `renderer.setSize(width, height, false)` | `handleResize()` w `src/experience3d.js` |
| warmup render | na desktopie `renderer.compile(scene, camera)`, potem `renderer.render(scene, camera)` | `src/experience3d.js` |
| pętla renderowania | `renderer.render(scene, camera)` w `tick()` po aktualizacji sceny | `src/experience3d.js` |

Scena jest tworzona przez `createScene()`:

```js
const scene = new THREE.Scene();
scene.background = new THREE.Color('#05070b');
scene.fog = new THREE.Fog('#05070b', 10, 28);
```

Tło i fog:

- `scene.background`: `#05070b`.
- `scene.fog`: `THREE.Fog('#05070b', 10, 28)`.

Globalne ustawienia Three.js wpływające na kolor/ekspozycję/światło:

- W kodzie portfolio nie znaleziono jawnego ustawienia `THREE.ColorManagement`, `renderer.outputColorSpace`, `renderer.toneMapping`, `renderer.toneMappingExposure`, `renderer.physicallyCorrectLights`, `renderer.useLegacyLights`, `renderer.shadowMap.enabled` ani `renderer.shadowMap.type`.
- AssetManager ustawia `texture.colorSpace = THREE.SRGBColorSpace` dla tekstur ładowanych jako `texture`, czyli dla ścieżek traktowanych jako tekstury w manifeście. Dotyczy to m.in. galaktyk, nie bezpośrednio materiałów wewnątrz GLB.

### Interpretacja

Brak jawnego tone mappingu oznacza, że scena portfolio opiera się na domyślnym pipeline vendored Three.js oraz na dobranych kolorach, intensywnościach świateł, fogu, materiałach GLB i geometrii, a nie na specjalnie ustawionym filmic/ACES tone mappingu. Ciemne tło `#05070b` i fog od `10` do `28` budują kontrast i separację głównej sceny od dalszych warstw atmosferycznych.

## 4. Kamera i pivot

### Fakty z kodu

Kamera jest tworzona w `src/experience3d.js`:

```js
const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
camera.position.set(0, 1.8, 6);
```

Parametry startowe:

| Parametr | Wartość |
| --- | --- |
| typ | `THREE.PerspectiveCamera` |
| FOV | `50` |
| aspect startowy | `1`, potem aktualizowany w `handleResize()` |
| near | `0.1` |
| far | `100` |
| pozycja startowa | `(0, 1.8, 6)` |

`handleResize()` aktualizuje:

- `camera.aspect = width / height`,
- `camera.updateProjectionMatrix()`.

Po utworzeniu `cameraRig` kamera jest sterowana przez `createCameraRig(canvas)`. Stałe riggingu:

| Stała | Wartość | Znaczenie |
| --- | --- | --- |
| `PIVOT` | `(0, 0.8, 0)` | punkt, na który kamera patrzy stale w `update()` |
| `CAMERA_RADIUS` | `6` | promień orbity kamery wokół pivotu |
| `BASE_HEIGHT` | `1.05` | bazowa wysokość ponad pivotem |
| `MAX_YAW_DEG` | `45` | maksymalne wychylenie yaw dla fine pointer / myszy |
| `MAX_PITCH_DEG` | `30` | maksymalne wychylenie pitch dla fine pointer / myszy |
| `MOBILE_MAX_YAW_DEG` | `24` | maksymalne wychylenie yaw dla touch drag |
| `MOBILE_MAX_PITCH_DEG` | `16` | maksymalne wychylenie pitch dla touch drag |
| `MOUSE_ORBIT_DAMPING` | `0.08` | lerp dla input-driven orbit i powrotu touch |
| `IDLE_DRIFT_DAMPING` | `0.02` | lerp dla bezczynnego dryfu |
| `IDLE_YAW_AMPLITUDE_RAD` | `4°` w radianach | amplituda idle yaw |
| `IDLE_PITCH_AMPLITUDE_RAD` | `2°` w radianach | amplituda idle pitch |
| `INVERT_YAW` | `false` | kierunek yaw myszy |

Logika riggingu:

- Dla fine pointer `onPointerMove()` normalizuje pozycję kursora w zakresie `[-1, 1]` i ustawia:
  - `state.targetYaw = mouseX * MAX_YAW_RAD`,
  - `state.targetPitch = -mouseY * MAX_PITCH_RAD`.
- Dla touch drag `setTouchDragTarget()` liczy delty względem startu gestu i ogranicza je do zakresu `[-1, 1]`, a następnie ustawia:
  - `state.targetYaw = normalizedX * MOBILE_MAX_YAW_RAD`,
  - `state.targetPitch = clamp(-normalizedY * MOBILE_MAX_PITCH_RAD, -MOBILE_MAX_PITCH_RAD, MOBILE_MAX_PITCH_RAD)`.
- Po puszczeniu touch `releaseTouchTarget()` zeruje target i aktywuje powrót.
- Przy braku bezpośredniego inputu kamera ma idle drift:
  - `idleYaw = sin(elapsed * 0.25) * 4°`,
  - `idlePitch = sin(elapsed * 0.32) * 2°`.
- Każda aktualizacja wylicza pozycję kamery:
  - `x = PIVOT.x + sin(currentYaw) * CAMERA_RADIUS`,
  - `z = PIVOT.z + cos(currentYaw) * CAMERA_RADIUS`,
  - `y = PIVOT.y + BASE_HEIGHT + sin(currentPitch) * CAMERA_RADIUS`.
- Kamera stale wykonuje `camera.lookAt(PIVOT)`.

### Interpretacja

Kamera jest znormalizowana wokół stałego pivotu `(0, 0.8, 0)`, czyli w okolicy centralnego obiektu i orbitujących glifów. Stałe `lookAt(PIVOT)`, umiarkowany FOV `50`, promień `6`, ograniczony yaw/pitch oraz idle drift powodują, że bryły są obserwowane pod delikatnie zmiennym kątem, ale bez gwałtownego zniekształcania perspektywy. To pomaga widzieć krawędzie i ścianki modeli jako przestrzenne obiekty, a nie płaskie ikony.

## 5. System świateł

### 5.1 Światła globalne sceny

`addLights(scene)` dodaje trzy światła:

| Nazwa w kodzie | Typ | Kolor | Intensity | Pozycja | Distance / decay / angle / penumbra | Cienie | Statyczne / animowane | Prawdopodobny zakres działania |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `ambient` | `THREE.AmbientLight` | `#8aa0c2` | `0.42` | brak pozycji kierunkowej | nie dotyczy | brak ustawień cieni | statyczne | cała scena; podnosi bazowe doświetlenie modeli i zapobiega całkowicie czarnym cieniom własnym materiałów reagujących na światło |
| `key` | `THREE.DirectionalLight` | `#cfd8ff` | `0.95` | `(2.5, 4, 3)` | nie dotyczy | brak ustawień cieni | statyczne | cała scena; główne światło kierunkowe modelujące powierzchnie materiałów reagujących na światło |
| `fill` | `THREE.PointLight` | `#4d7cff` | `0.52` | `(-3.2, 2.2, -1.6)` | distance `18`; decay niepodany jawnie | brak ustawień cieni | statyczne | lokalnie, ale z dużym zasięgiem `18`; chłodne wypełnienie z boku/tyłu sceny |

Światła budujące ogólną przestrzenność sceny:

- `DirectionalLight` `key` — główny kierunek światła daje różnice jasności między ściankami.
- `PointLight` `fill` — dodaje chłodne, przestrzenne wypełnienie z innego kierunku.
- `AmbientLight` — nie daje kierunku, ale stabilizuje czytelność powierzchni.

### 5.2 Hover lights orbitujących node'ów

Każdy node w `createOrbitNodes()` otrzymuje `hoverPointLight`:

```js
const hoverPointLight = new THREE.PointLight(node.material.color.clone(), 0, HOVER_LIGHT_DISTANCE, HOVER_LIGHT_DECAY);
```

Stałe:

- `HOVER_LIGHT_INTENSITY_TARGET = 2.8`
- `WOOD_NODE_HOVER_LIGHT_INTENSITY_TARGET = 3.3`
- `HOVER_LIGHT_DISTANCE = 5.5`
- `HOVER_LIGHT_DECAY = 2`
- `HOVER_LIGHT_RADIAL_T = 0.7`
- standardowy kolor światła hover bierze `node.material.color.clone()` i później `node.material.color` po blendzie,
- dla `ai-guide` kolor hover nadpisywany jest na `WOOD_NODE_HOVER_LIGHT_COLOR = '#cbff74'`,
- dla `creative-ai` target intensity ustawiany jest na `0`, bo hover aktywuje system iskier zamiast lokalnego hover-lightu.

Zachowanie:

- światło startuje z intensity `0` i `visible = false`,
- po hover intensity interpoluje do targetu przez `THREE.MathUtils.lerp(..., HOVER_LIGHT_INTENSITY_LERP)`, gdzie `HOVER_LIGHT_INTENSITY_LERP = 0.08`,
- pozycja światła jest animowana w każdej klatce między centrum orbity a pozycją node'a: `lightPosition.copy(centerWorldPosition).lerp(worldPosition, HOVER_LIGHT_RADIAL_T)`, następnie konwertowana do lokalnego układu node'a,
- `visible` jest prawdziwe dopiero przy `intensity > 0.01`.

Charakter:

- lokalne, hover-only, dynamiczne,
- mogą doświetlać glif/node i pobliskie obiekty w zasięgu `5.5`, ale ich główna rola to feedback interakcji.

### 5.3 Światło drzewa dla AI Guide

Opcjonalny efekt drzewa w `attachWoodTreeEffectModel()` tworzy:

```js
const treePointLight = new THREE.PointLight(WOOD_TREE_POINT_LIGHT_COLOR, 0, 2.4, 2);
treePointLight.position.set(0, -0.06, 0);
```

Parametry:

| Parametr | Wartość |
| --- | --- |
| typ | `THREE.PointLight` |
| kolor | `WOOD_TREE_POINT_LIGHT_COLOR = '#55ff22'` |
| intensity startowe | `0` |
| distance | `2.4` |
| decay | `2` |
| pozycja startowa | `(0, -0.06, 0)` w modelu drzewa |
| visible startowo | `false` |
| cienie | brak ustawień cieni |
| animacja | intensity zależne od reveal/pulse; po pełnym reveal może orbitować wokół centrum przy `WOOD_TREE_ORBIT_ENABLED = true` |

Stałe animacji/intensywności:

- `WOOD_TREE_POINT_LIGHT_INTENSITY = 1.0`
- clamp do maksymalnie `1.25 * WOOD_TREE_POINT_LIGHT_INTENSITY`
- `WOOD_TREE_ORBIT_SPEED = 0.96`
- `WOOD_TREE_ORBIT_BOBBING_AMPLITUDE = 0.04`
- `WOOD_TREE_ORBIT_BOBBING_SPEED = 0.95`

Charakter:

- lokalne, efektowe, związane z hover/reveal drzewa AI Guide,
- nie jest podstawowym światłem sceny.

### 5.4 Słońce

`createSunCycle()` tworzy grupę słońca, model/fallback i `SpotLight`.

Domyślne ustawienia `SUN_CYCLE_DEFAULTS`:

| Parametr | Wartość |
| --- | --- |
| `enabled` | `true` |
| `modelPath` | `/glb/sun.glb` |
| `center` | `{ x: 0, y: 0, z: 0 }` |
| `radius` | `3` |
| `zOffset` | `0` |
| `startAngle` | `0` |
| `angularSpeed` | `0.08` |
| `direction` | `1` |
| `scale` | `0.2` |
| `selfRotationSpeed` | `0` |
| `lockFacing` | `true` |
| `frontRotation` | `{ x: 0, y: 0, z: 0 }` |
| `emissiveColor` | `#ffd21f` |
| `emissiveIntensity` | `1.5` |
| spotlight color | `#ffd21f` |
| spotlight intensity | `13.2` |
| spotlight distance | `20` |
| spotlight angle | `90°` |
| spotlight penumbra | `0.45` |
| spotlight decay | `1.5` |
| debug flags | `debugVisible: false`, `debugShowFallback: false`, `debugForceBasicMaterial: false`, `debugShowBounds: false` |

Implementacja światła:

- `const spotlight = new THREE.SpotLight();`
- spotlight jest dzieckiem `sunBodyGroup`, target jest osobnym `Object3D` w `object3d`,
- w `applySettings()` ustawiane są `color`, `distance`, `angle`, `penumbra`, `decay` i `visible`,
- w `update()` pozycja `sunBodyGroup` orbituje po okręgu:
  - `x = cos(angle) * radius`,
  - `y = sin(angle) * radius`,
  - `z = zOffset`,
- spotlight jest widoczny i ma intensity `settings.spotlight.intensity * progressionMultiplier` tylko gdy słońce jest powyżej centrum (`worldSunPosition.y > centerWorldPosition.y`), w przeciwnym razie `visible = false` i `intensity = 0`.

Materiał/model słońca:

- jeśli `sun-model` jest w cache AssetManagera, model jest dodawany do `sunBodyGroup`, ustawiany na `(0,0,0)` i skalowany przez `settings.scale`,
- jeśli modelu nie ma, aktywny jest fallback `SphereGeometry(0.25, 16, 16)` z `MeshBasicMaterial({ color: '#fff200' })`, ale `fallbackSphere.visible` jest domyślnie `false` i zależny od debug flag,
- `enforceSunMaterialVisibility()` ustawia na meshach modelu: `visible = true`, `castShadow = false`, `receiveShadow = false`, materiały `visible = true`, `transparent = false`, `opacity = 1`, `depthWrite = true`, `depthTest = true`, `side = THREE.DoubleSide`, `needsUpdate = true`,
- debugowo można wymusić `MeshBasicMaterial` przez `debugForceBasicMaterial`, ale domyślnie `false`.

Charakter:

- animowane światło atmosferyczno-sceniczne,
- może budować przestrzenność, gdy jest nad horyzontem i progression multiplier jest dodatni,
- jego model jest też świecącym wizualnym elementem orbity, ale materiał GLB nie jest globalnie zamieniany na `MeshBasicMaterial` poza debugiem.

### 5.5 Księżyc

`createMoonCycle()` działa analogicznie do słońca, z osobnym modelem i spotlightem.

Domyślne ustawienia `MOON_CYCLE_DEFAULTS`:

| Parametr | Wartość |
| --- | --- |
| `enabled` | `true` |
| `modelPath` | `/glb/moon.glb` |
| `center` | `{ x: 0, y: 0, z: 0 }` |
| `radius` | `3` |
| `zOffset` | `0` |
| `phaseOffset` | `Math.PI` |
| `scale` | `0.2` |
| `selfRotationSpeed` | `0` |
| `lockFacing` | `true` |
| `frontRotation` | `{ x: 0, y: 0, z: 0 }` |
| spotlight color | `#8ecbff` |
| spotlight intensity | `10` |
| spotlight distance | `20` |
| spotlight angle | `90°` |
| spotlight penumbra | `0.45` |
| spotlight decay | `1.5` |
| debug flags | `debugVisible: false`, `debugShowFallback: false`, `debugForceBasicMaterial: false`, `debugShowBounds: false` |

Implementacja światła:

- `const spotlight = new THREE.SpotLight();`
- w `update(delta, sunAngle)` pozycja księżyca jest zsynchronizowana z kątem słońca plus `phaseOffset`, czyli standardowo po przeciwnej stronie orbity,
- spotlight jest widoczny tylko gdy księżyc jest powyżej centrum,
- intensity wynosi `settings.spotlight.intensity * progressionMultiplier`, gdy aktywne; inaczej `0`.

Materiał/model księżyca:

- jeśli `moon-model` jest w cache, jest dodawany do `moonBodyGroup`, pozycja `(0,0,0)`, skala `settings.scale`,
- jeśli modelu nie ma, fallback to `SphereGeometry(0.25, 16, 16)` z `MeshBasicMaterial({ color: '#8ecbff' })`, widoczność fallbacku zależna od debug flag,
- `enforceMoonMaterialVisibility()` ustawia `visible = true`, `castShadow = false`, `receiveShadow = false`, materiały `visible = true`, `transparent = false`, `opacity = 1`, `depthWrite = true`, `depthTest = true`, `needsUpdate = true`, ale nie ustawia `side = DoubleSide`.

Charakter:

- animowane światło atmosferyczno-sceniczne,
- działa komplementarnie do słońca, bo ma `phaseOffset = Math.PI`,
- nie jest hover-only.

### 5.6 Światła nieobecne

W audytowanym kodzie runtime nie znaleziono użycia:

- `THREE.HemisphereLight`,
- dodatkowych `DirectionalLight` poza `key`,
- cieniujących ustawień `castShadow = true` na światłach,
- `shadowMap.enabled = true`.

## 6. GLB loader i public asset paths

### Fakty z kodu

Portfolio używa vendored `GLTFLoader`, ale loader nie jest importowany statycznie w modułach modeli. Jest ładowany dynamicznie przez `resolveVendoredGLTFLoader()`.

Kluczowe elementy:

| Element | Plik | Zachowanie |
| --- | --- | --- |
| `src/vendor/three.js` | `src/vendor/three.js` | re-exportuje `../../vendor/three/three.module.js` |
| `GLTF_LOADER_PUBLIC_PATH` | `src/utils/gltfLoader.js` | `vendor/three/examples/jsm/loaders/GLTFLoader.js` |
| dynamic import | `src/utils/gltfLoader.js` | `import(/* @vite-ignore */ loaderUrl)` |
| path normalizer | `src/utils/publicPath.js` | bazuje na `import.meta.env.BASE_URL`, usuwa początkowe `/` i `public/` |
| Vite base | `vite.config.js` | `base = '/tomasz-talik-portfolio/'` |
| import map | `vite.config.js` | mapuje bare `three` na `${base}vendor/three/three.module.js` |
| production copy | `vite.config.js` | kopiuje `vendor/three` do `dist/vendor/three` |

`publicPath(path)` działa tak:

- bierze `import.meta.env.BASE_URL` lub `/`,
- wymusza końcowy slash w bazie,
- usuwa z asset path początkowe slashe,
- usuwa ewentualny prefiks `public/`,
- zwraca `${cleanBase}${cleanPath}`.

Przykłady wynikające z obecnego configu:

- `/glb/monkey.glb` → `/tomasz-talik-portfolio/glb/monkey.glb` w produkcji,
- `glb/stone_01.glb` → `/tomasz-talik-portfolio/glb/stone_01.glb` w produkcji,
- `/vendor/three/examples/jsm/loaders/GLTFLoader.js` → `/tomasz-talik-portfolio/vendor/three/examples/jsm/loaders/GLTFLoader.js`.

### AssetManager i preload

W `src/experience3d.js` przed utworzeniem sceny wykonywany jest krytyczny preload:

- `criticalAssetsList = getPreloadAssets(INITIAL_PRELOAD_GROUPS)`
- `await preloadAssets(criticalAssetsList, { diagnostics, assetManager, concurrency, stage: ASSET_STAGES.CRITICAL_INITIAL })`

`preloadAssets()` wymaga AssetManagera i deleguje do `assetManager.preload()`.

Dla assetów typu `model` / `gltf` / `glb` AssetManager:

1. wywołuje `publicPath(asset.path)`,
2. pobiera `GLTFLoader` przez `resolveVendoredGLTFLoader('AssetManager')`,
3. tworzy `new GLTFLoader()`,
4. wykonuje `loader.load(url, resolve, onProgress, reject)`,
5. zapisuje wynik w cache jako `{ kind, key, url, path, gltf, scene: gltf.scene }`.

Klonowanie GLB:

- moduły sceny nie ładują ponownie GLB bezpośrednio,
- pobierają klony przez `assetManager.cloneGltfScene(keyOrPath)`,
- `cloneGltfScene()` zwraca `scene.clone(true)`.

Uwaga faktograficzna: `scene.clone(true)` w Three.js klonuje hierarchię obiektów, ale materiały meshów zwykle pozostają współdzielonymi referencjami, jeśli kod nie klonuje ich osobno. W portfolio część modułów klonuje materiały po klonie sceny, a część nie.

### Manifest GLB

Krytyczne modele GLB w `assetManifest`:

- `monkey-model`: `/glb/monkey.glb`,
- pięć glifów przez `portfolioNodes.map(...)` jako `glyph-${node.id}`, z `node.modelPath`,
- `sun-model`: `/glb/sun.glb`,
- `moon-model`: `/glb/moon.glb`.

Modele deferred warm:

- `stone-relic-1..6`: `/glb/stone_01.glb` ... `/glb/stone_06.glb`,
- `shell-relic-1..6`: `/glb/shell_01.glb` ... `/glb/shell_06.glb`,
- `small-glyph-relic-1..6`: `/glb/small_glyph_01.glb` ... `/glb/small_glyph_06.glb`.

Model optional late:

- `wood-tree-effect`: `/glb/glyph_1-tree.glb`.

### Fallbacki

Fallbacki ustalone w kodzie:

| Obszar | Fallback / zachowanie |
| --- | --- |
| GLTFLoader dynamic import | `resolveVendoredGLTFLoader()` łapie błąd, loguje warning i zwraca `null`; AssetManager dla modelu rzuca wtedy `GLTFLoader unavailable` |
| krytyczny preload | failure assetu krytycznego powoduje błąd preloadu i blokadę reveal sceny z komunikatem loader overlay |
| monkey model | jeśli `assetManager.cloneGltfScene('monkey-model')` zwróci `null`, `centralPlaceholder` zostaje widoczny |
| glyph model | jeśli `assetManager.cloneGltfScene('glyph-${item.id}')` zwróci `null`, zostaje kula fallback/collider node'a |
| wood tree effect | jeśli optional load/clone nie zadziała, efekt drzewa jest bezpiecznie wyłączony, a główny node pozostaje aktywny |
| sun/moon | jeśli `sun-model` / `moon-model` nie są w cache, powstaje fallback sphere; widoczność fallbacku jest domyślnie debugowa |
| atmosphere relics | jeśli model reliktu nie jest w cache, logowany jest warning i dany pool modelu nie jest użyty |

## 7. Materiały GLB i ewentualne nadpisania

### 7.1 Centralny monkey GLB

Fakty:

- `loadMonkeyModel()` pobiera `assetManager.cloneGltfScene('monkey-model')`.
- Po pobraniu wykonuje `placeModelAtFallback(model, fallbackObject)`.
- Nie znaleziono w `monkeyModel.js` żadnego `model.traverse()` zmieniającego materiały.
- Nie znaleziono ustawiania `emissive`, `metalness`, `roughness`, `side`, `flatShading`, `normalMap`, `envMap`, `transparent`, `opacity`, `depthWrite`, `depthTest`, `castShadow`, `receiveShadow` dla monkey GLB.

Wniosek faktograficzny:

- Materiały monkey GLB są zachowywane z pliku GLB w takim zakresie, w jakim dostarcza je `GLTFLoader`; runtime portfolio ich nie nadpisuje w `monkeyModel.js`.

Nie ustalono w audycie:

- jakie dokładnie parametry materiałów ma `public/glb/monkey.glb` wewnątrz pliku binarnego,
- czy w GLB są normal mapy / tekstury / PBR parametry — audyt nie analizował binarnych danych GLB poza kodem runtime.

### 7.2 Główne GLB glifów orbitujących

Fakty:

- `attachNodeModel()` pobiera `assetManager.cloneGltfScene('glyph-${item.id}')`.
- Następnie wykonuje `fitModelToNode(model)`, dodaje model do node'a, ustawia `node.material.visible = false` i zapisuje `node.userData.visualModel = model`.
- Nie ma w tej ścieżce `model.traverse()` nadpisującego materiały głównego GLB glifu.

Wniosek faktograficzny:

- Główne modele GLB glifów zachowują materiały z GLB; runtime portfolio nie zastępuje ich `MeshBasicMaterial` ani innym materiałem w `attachNodeModel()`.
- Po udanym załadowaniu GLB fallbackowa kula node'a przestaje być wizualna (`node.material.visible = false`), ale sam mesh node'a pozostaje interaktywnym/colliderowym obiektem.

Nie ustalono w audycie:

- dokładne parametry materiałów zapisanych w pięciu plikach `/glb/glyph_*.glb`.

### 7.3 Optional wood tree GLB

Fakty:

- `attachWoodTreeEffectModel()` pobiera `wood-tree-effect` przez AssetManager i `cloneGltfScene()`.
- Model jest skalowany przez `fitModelToNode(treeModel)`, potem `treeModel.scale.multiplyScalar(WOOD_TREE_SCALE)`.
- Dla każdego mesha:
  - `child.material = child.material.clone()` albo dla array materiałów nie ma rozgałęzienia; kod zakłada pojedynczy `child.material`,
  - `child.material.transparent = true`,
  - `child.material.depthWrite = true`,
  - dodawany jest `onBeforeCompile` z maską reveal i discardem,
  - `child.material.needsUpdate = true`.
- W `applyWoodTreeActivation()` materiały są dalej modyfikowane:
  - `entry.material.color.copy(WOOD_TREE_BASE_COLOR)`, gdzie `WOOD_TREE_BASE_COLOR = '#162111'`,
  - `entry.material.emissive.copy(WOOD_TREE_EMISSIVE_BASE).lerp(activeColor, fill)`,
  - `entry.material.emissiveIntensity = ...` zależne od reveal/pulse.

Wniosek faktograficzny:

- Wood tree GLB nie zachowuje w pełni materiałów z GLB w runtime, bo kod klonuje materiał i nadpisuje co najmniej `transparent`, `depthWrite`, shader przez `onBeforeCompile`, `color`, `emissive` i `emissiveIntensity`.
- Kod nie ustawia tu jawnie `metalness`, `roughness`, `side`, `flatShading`, `normalMap`, `envMap`, `castShadow` ani `receiveShadow`.

### 7.4 Sun GLB

Fakty:

- `createSunCycle()` pobiera `assetManager.cloneGltfScene('sun-model')`.
- `enforceSunMaterialVisibility()` dla meshy modelu ustawia:
  - `child.visible = true`,
  - `child.castShadow = false`,
  - `child.receiveShadow = false`,
  - `material.visible = true`,
  - `material.transparent = false`,
  - `material.opacity = 1`,
  - `material.depthWrite = true`,
  - `material.depthTest = true`,
  - `material.side = THREE.DoubleSide`,
  - `material.needsUpdate = true`.
- Debugowo `setDebugMaterialState()` może zastąpić materiał `debugBasicMaterial`, ale tylko gdy `debugVisible && debugForceBasicMaterial`; domyślnie oba debug flagi nie wymuszają tego.

Wniosek faktograficzny:

- Sun GLB zachowuje bazowy typ materiału z GLB poza jawnie nadpisanymi właściwościami widoczności, przezroczystości, depth, side i cieni.
- `side` jest nadpisywany na `THREE.DoubleSide`.
- Cienie są jawnie wyłączone na meshach słońca.

### 7.5 Moon GLB

Fakty:

- `createMoonCycle()` pobiera `assetManager.cloneGltfScene('moon-model')`.
- `enforceMoonMaterialVisibility()` dla meshy modelu ustawia:
  - `child.visible = true`,
  - `child.castShadow = false`,
  - `child.receiveShadow = false`,
  - `material.visible = true`,
  - `material.transparent = false`,
  - `material.opacity = 1`,
  - `material.depthWrite = true`,
  - `material.depthTest = true`,
  - `material.needsUpdate = true`.
- Debugowo może być wymuszony `debugBasicMaterial`, ale domyślnie nie.

Wniosek faktograficzny:

- Moon GLB zachowuje bazowy typ materiału z GLB poza jawnie nadpisanymi właściwościami widoczności, przezroczystości, depth i cieni.
- W przeciwieństwie do słońca kod nie ustawia jawnie `side = DoubleSide` dla księżyca.

### 7.6 Atmosphere relic GLB: stones, shells, small glyphs

Fakty:

- Relikty są ładowane z cache AssetManagera przez `getGltfByPath(path)` i trzymane w model cache.
- Przy tworzeniu instancji `cloneRelicModel(source, opacity)`:
  - klonuje scenę `source.clone(true)`,
  - dla każdego mesha klonuje materiał,
  - ustawia `transparent = true`,
  - ustawia `opacity = 0`,
  - zapisuje `userData.targetOpacity = opacity`.
- `cloneShellRelicModel(source, config, colorHex)` dodatkowo:
  - mnoży `m.color` przez tint z palety,
  - ustawia `roughness` w zakresie i obniża go przez `* 0.7`, minimalnie `0.08`,
  - ustawia `metalness` maksymalnie `0.18`, domyślnie `0.05`,
  - ustawia `depthWrite = false`.
- `applyStoneMaterial()`, `applyShellMaterial()`, `applySmallGlyphMaterial()` dalej ustawiają `transparent`, `targetOpacity`, `opacity` i `needsUpdate`.

Wniosek faktograficzny:

- Relikty nie zachowują materiałów GLB w pełni: runtime klonuje i modyfikuje przezroczystość oraz opacity.
- Shell relics dodatkowo zmieniają kolor/tint, roughness, metalness i depthWrite.
- Kod nie ustawia jawnie `side`, `flatShading`, `normalMap`, `envMap`, `castShadow`, `receiveShadow` dla reliktów.

### 7.7 Materiały zachowane vs nadpisane — podsumowanie

| Model/obszar | Czy runtime zachowuje materiały GLB? | Nadpisania ustalone w audycie |
| --- | --- | --- |
| centralny monkey | Tak, w kodzie runtime nie znaleziono nadpisań materiałów | brak w `monkeyModel.js` |
| główne glyph GLB | Tak, w `attachNodeModel()` nie znaleziono nadpisań materiałów | fallback sphere material ukryty po sukcesie GLB |
| wood tree effect | Nie w pełni | clone materiału, `transparent`, `depthWrite`, `onBeforeCompile`, `color`, `emissive`, `emissiveIntensity` |
| sun GLB | Częściowo | `transparent=false`, `opacity=1`, `depthWrite=true`, `depthTest=true`, `side=DoubleSide`, `castShadow=false`, `receiveShadow=false` |
| moon GLB | Częściowo | `transparent=false`, `opacity=1`, `depthWrite=true`, `depthTest=true`, `castShadow=false`, `receiveShadow=false` |
| stone relics | Częściowo | clone materiału, `transparent`, `opacity`, `targetOpacity` |
| shell relics | Nie w pełni | clone materiału, tint, `transparent`, `opacity`, `roughness`, `metalness`, `depthWrite=false`, `targetOpacity` |
| small glyph relics | Częściowo | clone materiału, `transparent`, `opacity`, `targetOpacity` |

## 8. Skalowanie, centrowanie i orientacja brył

### Centralny monkey

`placeModelAtFallback(model, fallbackObject)`:

1. pobiera światową pozycję fallbacku przez `fallbackObject.getWorldPosition(fallbackPosition)`,
2. liczy `new THREE.Box3().setFromObject(model)`,
3. pobiera `size`,
4. wylicza `maxDimension = Math.max(size.x, size.y, size.z) || 1`,
5. skaluje jednolicie do `MONKEY_TARGET_DIMENSION = 2.0`,
6. po skali aktualizuje matrix world,
7. liczy drugi bounding box,
8. pobiera centrum,
9. wykonuje `model.position.sub(center)` i `model.position.add(fallbackPosition)`,
10. ustawia `model.rotation.y = MONKEY_YAW_TO_CAMERA`, gdzie `MONKEY_YAW_TO_CAMERA = 0`.

Wniosek faktograficzny:

- Monkey GLB jest centrowany na pozycji fallbacku i normalizowany do maksymalnego wymiaru `2.0`.
- Liczony jest bounding box, ale nie bounding sphere.
- Model ma ustawiany yaw do kamery przez stałą `0`, bez dynamicznego billboardowania.

### Główne glify orbitujące

`fitModelToNode(model)`:

1. liczy `Box3().setFromObject(model)`,
2. pobiera `size`,
3. liczy `maxDimension`,
4. skaluje jednolicie do `NODE_MODEL_TARGET_DIMENSION = 0.6`,
5. aktualizuje matrix world,
6. liczy ponowny bounding box,
7. pobiera centrum,
8. przesuwa `model.position.sub(center)`.

Node'y:

- fallback/interaktywny mesh to `SphereGeometry(0.2, 16, 14)` z `MeshStandardMaterial`,
- pozycja node'a: `x = cos(angle) * 3.8`, `z = sin(angle) * 3.8`, `y = 0.65 + sin(index * 1.2) * 0.25`,
- `updateOrbitNodes()` animuje orbitę:
  - `angle = node.userData.orbitAngle + elapsed * 0.14`,
  - `wobble = sin(elapsed * 0.9 + index * 1.8) * 0.08`,
  - aktualizuje `x`, `y`, `z`.

Wniosek faktograficzny:

- Glify GLB są centrowane lokalnie względem node'a i normalizowane do maksymalnego wymiaru `0.6`.
- Liczony jest bounding box, ale nie bounding sphere.
- Nie ma jawnej rotacji glifów do kamery w `attachNodeModel()` ani `fitModelToNode()`.
- Node mesh zostaje jako oddzielny obiekt interaktywny/raycast target; jego materiał jest ukryty po udanym modelu GLB.

### Wood tree effect

- Używa `fitModelToNode(treeModel)`, potem `treeModel.scale.multiplyScalar(WOOD_TREE_SCALE)`, gdzie `WOOD_TREE_SCALE = 1.24`.
- Podnosi pozycję `treeModel.position.y += WOOD_TREE_Y_OFFSET`, gdzie `WOOD_TREE_Y_OFFSET = 0.02`.
- Jest ukryty startowo przez `treeModel.visible = false`.
- Widoczność zależy od reveal progress.

### Sun/moon

- Sun/moon GLB nie są normalizowane bounding boxem w swoich modułach.
- Są skalowane scalarowo przez `settings.scale`, domyślnie `0.2`.
- Pozycja modelu wewnątrz body group: `(0,0,0)`.
- Body group orbituje po promieniu `3`.
- `lockFacing = true`, więc rotacja modelu jest stale ustawiana na `frontRotation` `(0,0,0)`; nie ma samoczynnej rotacji, bo `selfRotationSpeed = 0`.

### Relikty atmosferyczne

- Nie są normalizowane do bounding boxa w `atmosphere.js`.
- Są skalowane losowo wg konfiguracji:
  - stones w runtime config: `minScale: 0.5`, `maxScale: 1`,
  - shells: `minScale: 0.3`, `maxScale: 0.7`,
  - small glyph relics: `minScale: 0.1`, `maxScale: 0.3`.
- Pozycje są losowane w shellu sferycznym przez `randomPointInShell(...)` z bezpiecznymi promieniami.
- Rotacja startowa jest losowa XYZ: `Math.random() * Math.PI * 2` na każdej osi.
- W update każda instancja obraca się na osiach X/Y/Z i ma delikatny drift radialny.

### Collider/fallback a odbiór wizualny

Fakty:

- Centralny fallback `centralPlaceholder` jest osobną grupą geometrii Three.js i jest ukrywany po udanym monkey GLB (`fallbackObject.visible = false`).
- Glify mają fallback/interaktywną kulę. Po udanym GLB ukrywany jest tylko materiał kuli (`node.material.visible = false`), ale mesh pozostaje w scenie i pełni rolę node'a/interakcji oraz rodzica dla modelu i świateł.
- `pickNode()` nie był szczegółowo audytowany, bo nie był wymagany w pakiecie; z `experience3d.js` wynika, że raycast wybiera z tablicy `nodes`, czyli obiekty node'ów.

Interpretacja:

- Fallback centralny nie wpływa wizualnie po udanym GLB, bo jest ukryty.
- Fallback sphere glifu nie powinna wpływać wizualnie po udanym GLB, bo materiał jest niewidoczny, ale jako collider/interaktywny target może ułatwiać trafienie raycastem niezależnie od geometrii GLB.

## 9. Materiały Three.js użyte w scenie

Wyszukanie użyć materiałów wskazanych w zadaniu dało następujący obraz.

### `MeshStandardMaterial`

| Plik | Użycie | Reaguje na światło? | Rola |
| --- | --- | --- | --- |
| `src/scene/centralObject.js` | fallback centralny: cylinder base, sphere torso, sphere head | Tak | fallback monkey; `roughness`, `metalness`, część z `flatShading` |
| `src/scene/orbitNodes.js` | fallback/interaktywny mesh node'a | Tak | kula node'a; po udanym GLB materiał ukrywany; ma `color`, `emissive`, `roughness`, `metalness` |

### `MeshBasicMaterial`

| Plik | Użycie | Reaguje na światło? | Rola |
| --- | --- | --- | --- |
| `src/scene/orbitNodes.js` | iskry fire spark | Nie | małe hover-only efekty iskier, `transparent: true`, animowane opacity |
| `src/scene/sunCycle.js` | `debugBasicMaterial` i fallback sphere słońca | Nie | debug/fallback marker; debug replacement tylko przy debug flags |
| `src/scene/moonCycle.js` | `debugBasicMaterial` i fallback sphere księżyca | Nie | debug/fallback marker; debug replacement tylko przy debug flags |
| `src/scene/atmosphere.js` | shell debug helpers | Nie | wireframe pomocniczych sfer debug, `depthTest:false`, `depthWrite:false` |

### `ShaderMaterial`

| Plik | Użycie | Reaguje na światło? | Rola |
| --- | --- | --- | --- |
| `src/scene/orbitNodes.js` | `createEmberSphere()` | Nie w standardowym sensie Three.js | hover-only ember sphere z własnym shaderem, alpha/rim look |

### `SpriteMaterial`

| Plik | Użycie | Reaguje na światło? | Rola |
| --- | --- | --- | --- |
| `src/scene/galaxySprites.js` | galaktyki/sprite layer | Nie | płaskie sprite'y tła/atmosfery; `transparent`, `depthWrite:false`, `depthTest:true`, opcjonalne additive blending; `toneMapped=false`, jeśli property istnieje |

### `PointsMaterial`

| Plik | Użycie | Reaguje na światło? | Rola |
| --- | --- | --- | --- |
| `src/scene/atmosphere.js` | dust field | Nie | punkty pyłu atmosferycznego; kolor, opacity, blending, fog sterowane runtime |
| `src/scene/particles.js` | helper `createParticles()` | Nie | starszy/oddzielny helper punktów; w aktualnym `experience3d.js` nie jest importowany |

### `MeshPhysicalMaterial`, `MeshPhongMaterial`, `MeshLambertMaterial`

Nie znaleziono użyć tych konstruktorów w `src`.

### Główne bryły GLB a materiały światłoczułe

Fakty:

- Kod portfolio nie zastępuje materiałów monkey GLB ani głównych glyph GLB materiałami niereagującymi na światło.
- Jeżeli GLB zawierają materiały PBR tworzone przez `GLTFLoader` jako np. `MeshStandardMaterial`, pozostają one światłoczułe i reagują na `AmbientLight`, `DirectionalLight`, `PointLight`, `SpotLight`.
- Nie ustalono w audycie dokładnych typów materiałów zapisanych w binarnych GLB.

## 10. Cienie, głębia i przestrzenność

### Fakty z kodu

Cienie:

- Nie znaleziono `renderer.shadowMap.enabled = true` ani ustawienia `renderer.shadowMap.type` w `src`.
- Nie znaleziono `castShadow = true` ani `receiveShadow = true` w audytowanych modułach.
- Dla sun/moon runtime jawnie ustawia `castShadow = false` i `receiveShadow = false` na meshach modeli.
- Dla świateł nie znaleziono `light.castShadow = true`.

Głębia i czytelność:

- Renderer używa domyślnego depth buffer WebGLRenderera; materiały GLB i standardowe meshe mają domyślnie `depthTest` aktywny, o ile kod ich nie zmieni.
- Sun/moon wymuszają `depthWrite = true` i `depthTest = true` dla swoich modeli.
- Relikty shell ustawiają `depthWrite = false`, ale `depthTest` nie jest jawnie wyłączany.
- Sprite'y galaktyk mają `depthWrite = false`, `depthTest = true`.
- Dust field ma `depthTest` z configu (`true` w runtime config) i `depthWrite` z configu; w runtime config dla dust podano `depthTest: true`, ale `depthWrite` nie jest podane, więc po merge z defaultami pozostaje `false`.

### Interpretacja

Przestrzenność sceny portfolio nie wynika z klasycznych shadow maps. Wynika przede wszystkim z kombinacji:

1. realnej geometrii GLB i fallbacków 3D,
2. materiałów GLB zachowanych przez runtime dla głównej małpy i glifów,
3. światła kierunkowego `key` z góry/przodu/boku,
4. chłodnego point fill z innego kierunku,
5. słońca/księżyca jako animowanych spotlightów, gdy są nad centrum,
6. kamery orbitującej wokół pivotu i stale patrzącej na centrum,
7. normalizacji skali i centrowania modeli, dzięki czemu bryły są w przewidywalnym zakresie ekspozycji i kadru,
8. ciemnego tła/fogu, które zwiększają kontrast i separują obiekty od dalszej atmosfery,
9. animacji orbit/rotacji reliktów oraz idle drift kamery, które dają paralaksę.

## 11. Dlaczego scena portfolio daje przestrzenność brył

### Fakty z kodu

- Główna małpa GLB jest skalowana do maksymalnego wymiaru `2.0`, centrowana na pozycji fallbacku i nie ma nadpisywanych materiałów w `monkeyModel.js`.
- Główne glify GLB są skalowane do maksymalnego wymiaru `0.6`, centrowane względem node'a i nie mają nadpisywanych materiałów w `attachNodeModel()`.
- Po udanym GLB fallback centralny jest ukrywany, a fallback kuli glifu ma ukryty materiał, więc wizualnie pierwszeństwo ma faktyczny model GLB.
- Scena ma trzy stałe światła bazowe: ambient `#8aa0c2` intensity `0.42`, directional `#cfd8ff` intensity `0.95` z pozycji `(2.5,4,3)` oraz point `#4d7cff` intensity `0.52`, distance `18`, pozycja `(-3.2,2.2,-1.6)`.
- Słońce i księżyc dodają animowane spotlighty z przeciwległych faz orbity, ale świecą tylko, gdy są nad centrum.
- Kamera ma FOV `50`, orbit radius `6`, pivot `(0,0.8,0)`, idle drift i ograniczone input-driven yaw/pitch.
- Tło i fog mają ten sam ciemny kolor `#05070b`, fog od `10` do `28`.
- Shadow maps nie są jawnie używane.

### Interpretacja praktyczna

Scena daje przestrzenność brył dlatego, że główne GLB są traktowane jak rzeczywiste bryły w scenie Three.js, a nie jak płaskie sprite'y. Runtime nie zamienia materiałów monkey i głównych glifów na `MeshBasicMaterial`, więc jeśli GLB zawierają standardowe materiały PBR/światłoczułe, te materiały reagują na światła sceny.

Najważniejszy wizualny zestaw to:

- **geometria GLB**: model ma realne ściany, normalne i kształt,
- **zachowane materiały GLB**: runtime nie kasuje informacji materiałowej głównych brył,
- **światło kierunkowe i point fill**: powierzchnie zwrócone w różne strony dostają różną jasność,
- **kamera wokół pivotu**: obserwacja pod kątem i subtelny dryf ujawniają bryłę przez paralaksę,
- **normalizacja skali i centrowanie**: modele są w czytelnej skali i w stabilnym miejscu względem świateł/kamery,
- **ciemne tło/fog**: obiekty mają kontrast i separację od atmosfery,
- **lokalne hover lights**: przy interakcji dodają dodatkowe doświetlenie i feedback, ale nie są podstawą całej przestrzenności.

Efekt przestrzenności wynika więc bardziej z całego zestawu: geometrii + materiałów + światła + kamery + skali/centrowania, a nie z jednego mechanizmu. Cienie typu shadow map nie są głównym czynnikiem, bo nie są jawnie włączone.

## 12. Fakty, interpretacje i rzeczy nieustalone

### Fakty

- Renderer jest tworzony z `antialias: true` i bez jawnych ustawień `alpha`, `toneMapping`, `toneMappingExposure`, `outputColorSpace`, `shadowMap.enabled`.
- Vendored Three.js ma domyślnie `toneMapping = NoToneMapping`, `toneMappingExposure = 1.0`, `outputColorSpace = SRGBColorSpace`.
- Scena ma `background = '#05070b'` i `Fog('#05070b', 10, 28)`.
- Kamera ma `PerspectiveCamera(50, 1, 0.1, 100)`, start `(0,1.8,6)`, a potem jest prowadzona przez rig wokół pivotu `(0,0.8,0)`.
- Główne światła sceny to `AmbientLight`, `DirectionalLight` i `PointLight` z `src/scene/lights.js`.
- Sun/moon używają `SpotLight` i GLB `/glb/sun.glb`, `/glb/moon.glb`.
- GLTFLoader jest ładowany dynamicznie z vendored ścieżki `vendor/three/examples/jsm/loaders/GLTFLoader.js` przez `publicPath(...)`.
- Krytyczne modele GLB są preloadowane przez AssetManager przed reveal sceny.
- Monkey GLB i główne glyph GLB nie mają materiałów nadpisywanych w swoich ścieżkach attach.
- Wood tree, sun, moon i relikty mają różne zakresy nadpisywania materiałów.
- Shadow maps nie są jawnie włączone.

### Interpretacje

- Czytelne ścianki głównych brył wynikają najpewniej z tego, że modele GLB mają realną geometrię i materiały reagujące na światło, a runtime nie zastępuje tych materiałów niereagującymi materiałami.
- Kontrast między światłem kierunkowym, point fill i ciemnym tłem pomaga odczytywać płaszczyzny.
- Camera rig wzmacnia przestrzenność przez stałe patrzenie na pivot, paralaksę i subtelny idle drift.
- Sun/moon są bardziej atmosferycznymi światłami dynamicznymi niż jedynym źródłem czytelności brył.
- Hover lights są lokalnym feedbackiem, nie fundamentem całej sceny.

### Rzeczy nieustalone w audycie

- Nie ustalono dokładnych typów i parametrów materiałów zapisanych wewnątrz binarnych plików GLB.
- Nie ustalono, czy konkretne GLB mają normal maps, tekstury PBR, vertex colors lub customowe właściwości eksportu z Blendera.
- Nie ustalono wizualnego efektu w przeglądarce na konkretnym GPU; audyt był kodowy.
- Nie ustalono pełnego zachowania raycastu/colliderów w `src/scene/raycaster.js`, bo nie było to konieczne do oceny światła i materiałów, a z audytowanych plików wystarczyło ustalić separację visual model / node mesh.
- Nie ustalono, czy `physicallyCorrectLights` ma bezpośredni odpowiednik wymagający ustawienia w użytej wersji Three.js poza brakiem takich ustawień w runtime portfolio.

## 13. Rekomendowane następne kroki dla pracy nad samym portfolio

1. Jeżeli celem będzie przyszła zmiana wyglądu, najpierw zinwentaryzować materiały bezpośrednio w plikach GLB, bo runtime dla głównej małpy i glifów w dużej mierze im ufa.
2. Dodać osobny, nieinwazyjny debug raport runtime pokazujący typy materiałów GLB po załadowaniu, bez zmieniania materiałów w scenie.
3. Jeżeli kiedyś będą potrzebne prawdziwe cienie, zrobić to jako osobną decyzję techniczną, bo obecna przestrzenność nie opiera się na shadow maps.
4. Utrzymać rozdział: visual GLB jako prezentacja, fallback/collider jako interakcja; to obecnie chroni czytelność i klikalność glifów.
5. Przy zmianach deploymentu zachować kontrakt `publicPath(...)` + vendored `GLTFLoader`, bo obecny model ścieżek jest spójny z Vite base i GitHub Pages.
