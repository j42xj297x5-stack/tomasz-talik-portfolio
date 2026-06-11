# Public Asset Path Resolution Audit

Data audytu: **2026-06-11**

Zakres: statyczny audyt kodu i dokumentacji oraz kontrolny `npm run build`. Runtime, konfiguracja Vite, workflow i assety nie zostały zmienione.

## 1. Executive summary

Portfolio stosuje poprawny, spójny model dla aplikacji hostowanej pod podścieżką GitHub Pages:

1. `vite.config.js` ustawia jeden jawny base path: `/tomasz-talik-portfolio/`.
2. Pliki zarządzane jako zasoby publiczne leżą fizycznie w `public/`, ale kod przechowuje ich logiczne ścieżki bez segmentu `public`, np. `/glb/monkey.glb`, `/png/galaxy_01.png` i `/gif/DIG_engine.gif`.
3. Przed requestem logiczna ścieżka jest zamieniana na browser-visible URL przez `publicPath(...)`, którego źródłem prawdy jest `import.meta.env.BASE_URL`.
4. Centralny `AssetManager` wykonuje tę normalizację przed załadowaniem modeli, tekstur, obrazów i modułów. Classic 2D i UI również używają tego samego helpera dla `img.src`, GIF-ów, ornamentów, teł i SVG.
5. Vendored `GLTFLoader` jest importowany dynamicznie z base-aware URL, jego bare import `three` obsługuje import map, a plugin Vite kopiuje `vendor/three` do `dist/vendor/three`.
6. Workflow GitHub Pages publikuje całe `dist`, więc końcowe requesty mają postać `/tomasz-talik-portfolio/...`.

Kontrolny build zakończył się powodzeniem i potwierdził, że:

- Vite przepisał entry JS i CSS na URL-e zawierające repo base;
- `public/glb`, `public/png`, `public/gif` i `public/svg` zostały skopiowane do korzenia `dist` bez segmentu `public`;
- `vendor/three` został skopiowany do `dist/vendor/three`;
- `dist/index.html` zawiera import map wskazującą `/tomasz-talik-portfolio/vendor/three/three.module.js`.

Najważniejsze zastrzeżenie dotyczy nie samego rozwiązywania ścieżek, lecz polityki fallbacków: komponenty sceny mają lokalne placeholdery i bezpieczne pominięcia, ale wszystkie zasoby grupy `criticalInitial` — w tym GLTFLoader, monkey, pięć glyphów, sun, moon i panel backgrounds — blokują obecnie start Experience 3D, jeżeli choć jeden z nich nie załaduje się. Jest to bardziej rygorystyczne niż część opisów fallback-safe w istniejącej dokumentacji.

## 2. Runtime environments

### Local dev

`npm run dev` uruchamia Vite z tą samą konfiguracją `base`, która obowiązuje w buildzie. Ponieważ `base` jest stałe i wynosi `/tomasz-talik-portfolio/`, kanoniczny lokalny URL aplikacji i publicznych assetów również zawiera tę podścieżkę, np.:

```text
http://localhost:5173/tomasz-talik-portfolio/
http://localhost:5173/tomasz-talik-portfolio/glb/monkey.glb
```

Nie należy zakładać, że lokalny dev używa base `/`. Helper jest mimo to przenośny: gdyby inna konfiguracja Vite podała `BASE_URL === '/'`, zwróciłby `/glb/monkey.glb`.

Plugin `vendored-three-runtime` dodaje middleware dev-servera dla requestów zaczynających się od:

```text
/tomasz-talik-portfolio/vendor/three/
```

Dzięki temu dynamicznie importowany, niebundlowany `GLTFLoader.js` i jego moduły pomocnicze są dostępne również w local Vite.

### Production build

`npm run build`:

- bundluje kod z `src/` do `dist/assets/`;
- przepisuje URL-e entrypointów zgodnie z `base`;
- kopiuje zawartość `public/` bezpośrednio do korzenia `dist/`;
- uruchamia `writeBundle()` własnego pluginu, który kopiuje `vendor/three` do `dist/vendor/three`.

Przykład różnicy warstw:

```text
public/glb/monkey.glb                 # położenie źródłowe na dysku
dist/glb/monkey.glb                   # położenie w artefakcie builda
/tomasz-talik-portfolio/glb/monkey.glb # URL widoczny dla przeglądarki
```

### GitHub Pages

Workflow `.github/workflows/deploy.yml` buduje projekt przez `npm ci` i `npm run build`, przesyła `./dist` przez `actions/upload-pages-artifact@v3`, a następnie publikuje go przez `actions/deploy-pages@v4`.

Repozytorium jest wdrażane jako project site pod `/tomasz-talik-portfolio/`, dlatego browser-visible URL musi zawierać repo base. Workflow nie wykonuje dodatkowego przepisywania ścieżek; poprawność URL-i zależy od Vite `base`, helpera i kompletności `dist`.

### `public/` na dysku a URL w przeglądarce

`public/` jest katalogiem źródłowym Vite, a nie segmentem publicznego URL. W runtime:

- poprawnie: `/tomasz-talik-portfolio/png/example.png`;
- błędnie: `/tomasz-talik-portfolio/public/png/example.png`;
- błędnie na GitHub Pages: `/png/example.png`, bo ominie repo base i wskaże root domeny.

## 3. Core rule

Główna zasada projektu brzmi:

> Metadane i konfiguracja mogą przechowywać logiczne ścieżki publiczne, ale każdy URL wysyłany do przeglądarki musi przejść przez jeden mechanizm base-aware.

W praktyce:

- dozwolone logiczne ścieżki: `/glb/...`, `glb/...`, `/png/...`, `/gif/...`, `/svg/...`, `/json/...`, `/vendor/...`;
- browser URL: `publicPath(logicalPath)`;
- runtime URL nie może zawierać `public/`;
- runtime nie powinien hardkodować `/tomasz-talik-portfolio/`; ten segment należy wyłącznie do konfiguracji Vite;
- ścieżek publicznych nie należy rozwiązywać względem bieżącego route przez `./...` lub `../...`;
- cache lookup może normalizować logiczne ścieżki wewnętrznie, ale request nadal powinien być budowany przez `publicPath(...)`.

Rekomendowany podział odpowiedzialności:

```js
// content/config: logiczna ścieżka
const modelPath = '/glb/glyph_1.glb';

// granica I/O: URL dla przeglądarki
const modelUrl = publicPath(modelPath);
loader.load(modelUrl, onLoad, onProgress, onError);
```

## 4. Vite base configuration

Źródłem repo base jest `vite.config.js`:

```js
const base = '/tomasz-talik-portfolio/';

export default defineConfig({
  base,
  plugins: [vendoredThreeRuntimePlugin()],
  resolve: {
    alias: {
      three: fileURLToPath(new URL('./vendor/three/three.module.js', import.meta.url)),
    },
  },
});
```

Ta sama zmienna `base` jest używana do import mapy:

```js
children: JSON.stringify({
  imports: { three: `${base}vendor/three/three.module.js` }
}, null, 2)
```

oraz do prefiksu middleware local Vite:

```js
const vendorPrefix = `${base}vendor/three/`;
```

To ważne: konfiguracja nie ma osobnych, potencjalnie rozbieżnych stringów dla builda, import mapy i dev middleware.

`index.html` zawiera źródłowo:

```html
<script type="module" src="/src/main.js"></script>
```

Jest to entrypoint zarządzany przez Vite, a nie ręcznie ładowany public asset. Vite przepisał go w kontrolnym buildzie na `/tomasz-talik-portfolio/assets/index-....js`, więc ten przypadek nie jest naruszeniem reguły `publicPath(...)`.

## 5. `publicPath(...)` helper

Aktualna implementacja w `src/utils/publicPath.js`:

```js
export function publicPath(path = '') {
  const base = import.meta.env.BASE_URL || '/';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  const cleanPath = String(path)
    .replace(/^\/+/, '')
    .replace(/^public\//, '');

  return `${cleanBase}${cleanPath}`;
}
```

Plik eksportuje też `describePublicPath(...)`, który wykonuje tę samą normalizację i zwraca dane diagnostyczne: `input`, `normalizedPath`, `baseUrl` i `url`.

### Przyjmowane wejścia

Helper akceptuje:

- pustą wartość dzięki domyślnemu `path = ''`;
- stringi z lub bez początkowego slasha;
- wartości konwertowalne przez `String(path)`;
- omyłkowy pojedynczy segment `public/` na początku ścieżki.

### Normalizacja slasha

`replace(/^\/+/, '')` usuwa wszystkie początkowe slashe z logical path. Następnie helper gwarantuje dokładnie jeden slash kończący `BASE_URL`.

Przykłady równoważnych wejść:

```text
/glb/monkey.glb
glb/monkey.glb
///glb/monkey.glb
```

Wszystkie prowadzą do tego samego końcowego URL.

### Obsługa przypadkowego `public/`

Po usunięciu początkowych slashy helper usuwa jedno początkowe `public/`:

```text
public/png/example.png  -> png/example.png
/public/png/example.png -> png/example.png
```

Jest to zabezpieczenie migracyjne, a nie zalecana konwencja. Metadane powinny przechowywać `/png/example.png`, nie `/public/png/example.png`.

### Połączenie z `import.meta.env.BASE_URL`

Dla obecnej konfiguracji:

| Input | `BASE_URL` | Result |
| --- | --- | --- |
| `/glb/monkey.glb` | `/tomasz-talik-portfolio/` | `/tomasz-talik-portfolio/glb/monkey.glb` |
| `public/png/example.png` | `/tomasz-talik-portfolio/` | `/tomasz-talik-portfolio/png/example.png` |
| `/gif/example.gif` | `/tomasz-talik-portfolio/` | `/tomasz-talik-portfolio/gif/example.gif` |
| `/json/preset.json` | `/tomasz-talik-portfolio/` | `/tomasz-talik-portfolio/json/preset.json` |
| `/vendor/three/three.module.js` | `/tomasz-talik-portfolio/` | `/tomasz-talik-portfolio/vendor/three/three.module.js` |

Dla projektu z Vite `base: '/'` te same wejścia dałyby odpowiednio `/glb/...`, `/png/...`, `/gif/...`, `/json/...` i `/vendor/...`.

### Granice helpera

Helper jest celowo prosty. Nie:

- wykrywa pełnych URL-i (`https://...`) ani `data:`/`blob:`;
- normalizuje `.` i `..`;
- usuwa zagnieżdżonego lub wielokrotnego `public/public/`;
- waliduje case-sensitive nazwy pliku;
- wykonuje URL encoding.

Dlatego powinien otrzymywać wyłącznie kontrolowane, repozytoryjne logical paths.

## 6. Asset loading inventory

| Area | File | Asset type | Logical path example | Resolver used | Notes |
| --- | --- | --- | --- | --- | --- |
| Shared manifest | `src/assets/assetManifest.js` | GLB, PNG, script module | `/glb/monkey.glb`, `/png/ai_guide.png`, `/vendor/three/.../GLTFLoader.js` | Ścieżki rozwiązane później przez `AssetManager` | Centralny katalog zasobów 3D, paneli i stage'ów preloadu. |
| Asset I/O boundary | `src/assets/assetManager.js` | GLB/GLTF | `asset.path` | `publicPath(asset.path)` → `GLTFLoader.load(url)` | Wszystkie manifestowe modele przechodzą przez jeden base-aware URL. |
| Asset I/O boundary | `src/assets/assetManager.js` | texture | `/png/galaxy_01.png` | `publicPath(...)` → `TextureLoader.load(url)` | Ustawia `SRGBColorSpace`, mipmaps i cache. |
| Asset I/O boundary | `src/assets/assetManager.js` | image | `/png/ai_guide.png` | `publicPath(...)` → `Image.src` + `decode()` | Panel backgrounds są dekodowane przed użyciem. |
| Asset I/O boundary | `src/assets/assetManager.js` | script / generic file | `/vendor/.../GLTFLoader.js` | `publicPath(...)` → dynamic import; generic → `fetch(url)` | GLTFLoader ma dedykowany resolver. |
| Loader diagnostics | `src/assets/preloadAssets.js` | wszystkie manifestowe | `asset.path` | `publicPath(asset.path)` | Diagnostyka przechowuje finalny URL requestu. |
| Central monkey | `src/scene/monkeyModel.js` | GLB | `glb/monkey.glb` | cache `AssetManager` | Brak bezpośredniego requestu; klon `monkey-model`, placeholder pozostaje przy cache miss. |
| Orbit glyphs | `src/content/portfolioNodes.js`, `src/scene/orbitNodes.js` | GLB | `/glb/glyph_1.glb` … `/glb/glyph_5.glb` | manifest → `AssetManager`; scena klonuje cache | Sphere/collider pozostaje fallbackiem, jeśli modelu nie ma w cache. |
| Wood tree effect | `src/assets/assetManifest.js`, `src/scene/orbitNodes.js` | GLB | `/glb/glyph_1-tree.glb` | optional late `AssetManager.loadAsset(...)` | Błąd wyłącza tylko opcjonalny efekt. |
| Sun | `src/scene/sunCycle.js` | GLB | `/glb/sun.glb` | manifest → `AssetManager`; scena klonuje `sun-model` | Ma fallback mesh/marker, lecz asset jest obecnie critical. |
| Moon | `src/scene/moonCycle.js` | GLB | `/glb/moon.glb` | manifest → `AssetManager`; scena klonuje `moon-model` | Ma fallback sphere, lecz asset jest obecnie critical. |
| Atmosphere stones | `src/scene/atmosphere.js`, `src/experience3d.js` | GLB | `/glb/stone_01.glb` … `_06.glb` | deferred manifest → `AssetManager`; lookup cache po normalized path | Brak późnego surowego URL; brakujące modele są pomijane. |
| Atmosphere shells | te same | GLB | `/glb/shell_01.glb` … `_06.glb` | jw. | Pula instancji powstaje tylko z modeli obecnych w cache. |
| Small glyph relics | te same | GLB | `/glb/small_glyph_01.glb` … `_06.glb` | jw. | Bezpieczne pominięcie przy pustej puli. |
| Galaxy sprites | `src/assets/assetManifest.js`, `src/scene/galaxySprites.js` | PNG texture/sprite | `/png/galaxy_01.png` … `_05.png` | manifest → `publicPath(...)` → `TextureLoader`; scena używa cache | Warstwa nie wykonuje późnego requestu po zakończeniu preloadu. |
| Panel backgrounds | `src/assets/assetManifest.js`, `src/ui/overlay.js` | PNG / CSS background | `/png/ai_guide.png`, `/png/digger.png` | cached URL lub `publicPath(panelBackgroundPath)` | URL trafia do CSS variable `--overlay-panel-bg-image`. |
| Mobile ornaments | `src/content/portfolioNodes.js`, `src/ui/overlay.js` | PNG | `/png/*_ornament.png` | `publicPath(...)` → `img.src` | Ładowane przy otwarciu panelu. |
| Mobile frame | `src/ui/overlay.js` | SVG | `/svg/portfolio_frame_mobile_*.svg` | `publicPath(...)` → `fetch(url)` | SVG jest walidowany, parsowany i inline'owany; błąd jest łapany. |
| Classic 2D glyphs | `src/classic2d.js` | PNG | `/png/glif_ai_guide.png` itd. | `publicPath(...)` → HTML `img src` | Bez zależności od uruchomienia Three.js. |
| Classic 2D monkey | `src/classic2d.js` | PNG | `/png/monkey_small.png` | `publicPath(...)` → HTML `img src` | Flat central image. |
| DIG demo | `src/content/portfolioNodes.js`, `src/classic2d.js`, `src/ui/overlay.js` | GIF | `/gif/DIG_engine.gif` | `publicPath(...)` → `img.src` | Używany w Classic 2D i panelu Experience 3D. |
| DIG screenshots | `src/content/portfolioNodes.js`, `src/classic2d.js`, `src/ui/overlay.js` | PNG | `/png/dig_engine-screenshot_01.png` … `_06.png` | `publicPath(item.src)` → `img.src` | Metadane zachowują logical paths. |
| Vendored GLTFLoader | `src/utils/gltfLoader.js` | JS module | `vendor/three/examples/jsm/loaders/GLTFLoader.js` | `publicPath(...)` → `import(/* @vite-ignore */ loaderUrl)` | Promise jest współdzielony; po błędzie resetowany. |
| Three runtime used by bundled app | `src/vendor/three.js` | JS module | `../../vendor/three/three.module.js` | statyczny import bundlowany przez Vite | To ścieżka modułu źródłowego, nie public asset URL. |
| JSON settings presets | `src/ui/optionsPanel.js` | JSON | plik wybrany przez użytkownika | `FileReader` / `JSON.parse`, bez `publicPath` | Nie znaleziono runtime fetch do publicznego presetu JSON. |

### Typy niewystępujące w aktualnym public runtime

- Nie znaleziono publicznych JPG/JPEG ani WEBP.
- Nie znaleziono publicznych plików konfiguracyjnych/presetów JSON.
- `public/textures/` zawiera tylko `.gitkeep`; aktywne tekstury sprite'ów są PNG w `public/png/`.
- `public/audio/` i `public/fonts/` zawierają tylko `.gitkeep`.
- Nie znaleziono `.gltf`; aktualne modele są samodzielnymi `.glb`.

## 7. GLTFLoader and vendored Three.js

### Dynamiczny import GLTFLoadera

`src/utils/gltfLoader.js` definiuje logical path bez repo base:

```js
export const GLTF_LOADER_PUBLIC_PATH =
  'vendor/three/examples/jsm/loaders/GLTFLoader.js';
```

Następnie:

```js
const loaderUrl = publicPath(GLTF_LOADER_PUBLIC_PATH);
loaderModulePromise = import(/* @vite-ignore */ loaderUrl);
```

`@vite-ignore` jest tu istotne: moduł nie jest włączany do standardowego grafu dynamicznych importów Vite, lecz pobierany w runtime z dokładnego, base-aware URL. Wspólny promise zapobiega równoległym wielokrotnym importom. Po błędzie promise jest resetowany, resolver loguje warning i zwraca `null`, dzięki czemu kolejna próba może zostać wykonana.

### Bare import `three`

Vendored `GLTFLoader.js` importuje `three` jako bare specifier. Projekt obsługuje dwa konteksty:

1. Dla kodu bundlowanego Vite `resolve.alias.three` wskazuje fizyczny `vendor/three/three.module.js`.
2. Dla niebundlowanego GLTFLoadera pobranego w przeglądarce plugin wstrzykuje import map:

```json
{
  "imports": {
    "three": "/tomasz-talik-portfolio/vendor/three/three.module.js"
  }
}
```

### Local Vite

`configureServer()` przechwytuje requesty do `${base}vendor/three/`, mapuje pozostałą część URL na pliki pod fizycznym `vendor/three` i ustawia typ MIME dla JS/MJS/JSON/WASM. Middleware odrzuca nieistniejące pliki, katalogi i próby wyjścia poza katalog vendor.

### Production `dist`

`writeBundle()` rekurencyjnie kopiuje cały `vendor/three` do:

```text
dist/vendor/three
```

Kontrolny build potwierdził obecność m.in.:

```text
dist/vendor/three/three.module.js
dist/vendor/three/examples/jsm/loaders/GLTFLoader.js
dist/vendor/three/examples/jsm/utils/BufferGeometryUtils.js
dist/vendor/three/examples/jsm/utils/SkeletonUtils.js
```

To nie jest opcjonalne: GitHub Pages publikuje wyłącznie `dist`, więc brak tego kroku spowodowałby 404 dla dynamicznego importu i jego zależności.

### Uwaga o dwóch sposobach użycia Three.js

Kod aplikacji importuje `src/vendor/three.js`, który re-eksportuje `../../vendor/three/three.module.js`; Vite bundluje tę część do chunków aplikacji. Dynamiczny GLTFLoader pozostaje osobnym modułem runtime i korzysta z import mapy. Mechanizmy są różne, ale wskazują tę samą vendored wersję Three.js.

## 8. Public folder contract

Kontrakt katalogu publicznego:

1. Plik źródłowy leży fizycznie w `public/<logical-path>`.
2. Vite kopiuje go do `dist/<logical-path>`.
3. Browser URL składa się z `BASE_URL + <logical-path>`.
4. Segment `public/` nigdy nie występuje w browser URL.

Poprawne mapowania dla obecnego deployu:

| Source file | Build file | Browser URL |
| --- | --- | --- |
| `public/glb/monkey.glb` | `dist/glb/monkey.glb` | `/tomasz-talik-portfolio/glb/monkey.glb` |
| `public/png/example.png` | `dist/png/example.png` | `/tomasz-talik-portfolio/png/example.png` |
| `public/gif/example.gif` | `dist/gif/example.gif` | `/tomasz-talik-portfolio/gif/example.gif` |
| `public/svg/example.svg` | `dist/svg/example.svg` | `/tomasz-talik-portfolio/svg/example.svg` |

Przykłady błędne:

```text
/public/glb/monkey.glb
/tomasz-talik-portfolio/public/glb/monkey.glb
/glb/monkey.glb                    # błędne dla GitHub Pages project site
./glb/monkey.glb                   # zależne od aktualnego URL/route
```

## 9. Found implementation patterns

### 9.1 Dynamic import przez `publicPath(...)`

Repozytoryjny przykład:

```js
const loaderUrl = publicPath(GLTF_LOADER_PUBLIC_PATH);
return import(/* @vite-ignore */ loaderUrl);
```

Plik: `src/utils/gltfLoader.js`.

### 9.2 `TextureLoader.load(publicPath(...))`

Kod jest rozdzielony na dwa kroki, ale semantycznie odpowiada temu wzorcowi:

```js
const url = publicPath(asset.path);
const texture = await loadTexture(textureLoader, url, onProgressFor(record));
```

Wewnątrz `loadTexture` wykonywane jest `textureLoader.load(url, ...)`. Plik: `src/assets/assetManager.js`.

### 9.3 `GLTFLoader.load(publicPath(...))`

Analogicznie:

```js
const url = publicPath(asset.path);
const GLTFLoader = await resolveVendoredGLTFLoader('AssetManager');
const gltf = await loadGltf(GLTFLoader, url, onProgressFor(record));
```

Wewnątrz `loadGltf` wykonywane jest `loader.load(url, ...)`. Plik: `src/assets/assetManager.js`.

### 9.4 CSS variable / inline style z URL-em

Panel background:

```js
panelEl.style.setProperty(
  '--overlay-panel-bg-image',
  `url("${cachedUrl ?? publicPath(panelBackgroundPath)}")`
);
```

CSS konsumuje wartość przez `background-image: var(--overlay-panel-bg-image)`. Pliki: `src/ui/overlay.js`, `src/styles/main.css`.

### 9.5 DOM image `src`

Repo zawiera kilka wariantów:

```js
image.src = publicPath(item.src);
mobileOrnamentEl.src = publicPath(nodeData.ornamentPath);
demoImageEl.src = publicPath(nodeData.demoGifPath);
```

Classic 2D generuje również HTML z wcześniej rozwiązanym URL-em:

```js
<img src="${publicPath(CLASSIC_MONKEY_IMAGE_PATH)}">
```

Pliki: `src/ui/overlay.js`, `src/classic2d.js`, `src/assets/assetManager.js`.

Przypisania takie jak `lightboxImage.src = previewImage.src` nie budują nowej ścieżki; kopiują już rozwiązany absolutny URL z istniejącego elementu.

### 9.6 `fetch(...)`

Mobile SVG frame:

```js
const url = publicPath(logicalPath);
const response = await fetch(url);
```

Generic branch `AssetManager` również wykonuje `fetch(url)`, gdzie `url` wcześniej pochodzi z `publicPath(asset.path)`.

Nie znaleziono `fetch('/json/...')` ani publicznego runtime JSON preset fetch.

### 9.7 Content metadata z logical paths

`src/content/portfolioNodes.js` przechowuje m.in.:

```js
modelPath: '/glb/glyph_4.glb',
ornamentPath: '/png/digger_ornament.png',
demoGifPath: '/gif/DIG_engine.gif'
```

oraz gallery `src: '/png/dig_engine-screenshot_01.png'`. Metadane nie znają repo base; renderer rozwiązuje je dopiero przy I/O.

### 9.8 Cache-first scene hydration

Scena 3D nie składa własnych URL-i dla każdego komponentu. `AssetManager` ładuje i cache'uje zasoby, a moduły sceny wykonują:

```js
assetManager.cloneGltfScene('monkey-model');
assetManager.cloneGltfScene(`glyph-${item.id}`);
assetManager.getAssetByPath(logicalPath);
```

`AssetManager.normalizePath(...)` usuwa początkowy slash i `public/` wyłącznie dla klucza cache. Nie zastępuje to `publicPath(...)` na granicy requestu.

### 9.9 JSON import/export bez public URL

Opcje/debug settings są eksportowane jako Blob/download i importowane z lokalnego pliku użytkownika przez `FileReader` oraz `JSON.parse`. Ten przypadek nie wymaga `BASE_URL`, ponieważ nie wykonuje requestu do repozytoryjnego pliku publicznego.

## 10. Risks and anti-patterns

### Znalezione ryzyka

#### 10.1 Fallbacki komponentów są częściowo przesłonięte przez critical preload

`resolveVendoredGLTFLoader()` bezpiecznie zwraca `null`, monkey zachowuje placeholder, glyph zachowuje sphere, sun/moon mają fallback geometry, a optional tree/atmosphere/galaxy potrafią się pominąć. Jednak `AssetManager.preload()` zbiera błędy oznaczone `critical`, po czym rzuca wyjątek, a `src/experience3d.js` blokuje reveal i ponownie rzuca błąd.

Do `criticalInitial` należą obecnie:

- vendored GLTFLoader;
- monkey;
- pięć glyphów;
- sun i moon;
- pięć panel backgrounds.

W rezultacie brak jednego z tych plików nie prowadzi podczas standardowego bootu do częściowo działającej sceny z placeholderem, lecz zatrzymuje Experience 3D. To nie jest błąd ścieżek, ale jest rozbieżnością między lokalnymi fallbackami a globalną polityką preloadu i częścią istniejącej dokumentacji mówiącej, że scena ma kontynuować po awarii GLTFLoadera/GLB.

Rekomendacja na osobne zadanie: jawnie zdecydować, które assety naprawdę muszą blokować start, i zsynchronizować kod z dokumentacją. W tym audycie niczego nie zmieniono.

#### 10.2 `publicPath(...)` nie jest resolverem dla zewnętrznych URL-i

Przekazanie `https://example.com/a.png`, `data:...` lub `blob:...` utworzyłoby niepoprawny URL pod `BASE_URL`. Aktualne call sites przekazują kontrolowane ścieżki repozytoryjne, więc ryzyko jest potencjalne, nie aktywne.

#### 10.3 Stały base oznacza lokalny dev pod repo subpath

Konfiguracja nie używa warunku typu `command === 'serve' ? '/' : '/repo/'`. To celowy i spójny model parity, lecz osoby testujące `http://localhost:5173/` mogą błędnie oczekiwać root-path. QA i instrukcje powinny używać URL pokazanego przez Vite i sprawdzać podścieżkę repo.

#### 10.4 Duplikacja logiki normalizacji

`publicPath(...)` i `describePublicPath(...)` zawierają identyczny kod normalizacji. `AssetManager.normalizePath(...)` ma podobny, ale uzasadniony cel cache-key. Nie wykryto rozbieżności, jednak przyszła zmiana reguł może wymagać aktualizacji więcej niż jednego miejsca.

#### 10.5 Typo/duplikat w vendored tree

Obok poprawnego `vendor/three/examples/...` istnieje `vendor/three/exemples/jsm/loaders/GLTFLoader.js`. Plugin kopiuje cały katalog, więc typo trafia również do `dist`. Runtime używa poprawnego `examples`, zatem nie powoduje obecnie złego requestu, ale może wprowadzać w błąd i niepotrzebnie zwiększa artefakt.

#### 10.6 Import map hardkoduje tę samą zmienną `base`, nie `BASE_URL`

Obecnie jest to poprawne, ponieważ import map powstaje w tej samej konfiguracji, która przekazuje `base` do Vite. Ryzyko pojawiłoby się dopiero po wprowadzeniu dynamicznego base zależnego od mode/env i niezaktualizowaniu pluginu. W takim refaktorze należy nadal utrzymywać jedno źródło prawdy.

#### 10.7 Case sensitivity pozostaje odpowiedzialnością autora

Linux/GitHub Pages rozróżnia wielkość liter. Aktualne odwołanie `/gif/DIG_engine.gif` odpowiada plikowi `public/gif/DIG_engine.gif`, a sprawdzone nazwy PNG/GLB są zgodne. Helper nie wykryje przyszłego `dig_engine.gif` vs `DIG_engine.gif`.

### Nie znaleziono aktywnych naruszeń

W skanowanym runtime nie znaleziono:

- hard-coded `/tomasz-talik-portfolio/...` poza `vite.config.js` i dokumentacją;
- hard-coded browser URL `/public/...`;
- bezpośredniego `TextureLoader.load('/png/...')` lub `GLTFLoader.load('/glb/...')` poza wspólnym mechanizmem;
- względnych `./png/...`, `../glb/...` zależnych od bieżącego browser route;
- niespójnego `new URL(...)` do publicznych assetów — znalezione użycia dotyczą URL-i modułów/pliku konfiguracyjnego w Node lub `URLSearchParams`;
- publicznego JSON fetch pomijającego helper;
- CSS `url('/png/...')` omijającego helper.

### Antywzorce, których należy unikać

```js
// 1. Segment public w runtime
image.src = '/public/png/example.png';

// 2. Root domeny zamiast repo base
loader.load('/glb/model.glb', ...);

// 3. Hardcoded repo base w kodzie runtime
image.src = '/tomasz-talik-portfolio/png/example.png';

// 4. URL zależny od aktualnego route
fetch('./json/preset.json');

// 5. Ręczne składanie bez normalizacji
const url = import.meta.env.BASE_URL + '/png/example.png';

// 6. Osobny helper o tych samych obowiązkach
const assetUrl = (path) => `/tomasz-talik-portfolio/${path}`;
```

## 11. Reusable implementation recipe

### Krok 1: ustaw `base` w Vite

Dla GitHub Pages project site:

```js
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/repository-name/'
});
```

Dla user/organization site hostowanego w root base zwykle wynosi `/`. Wybór powinien odpowiadać realnemu URL deployu.

### Krok 2: dodaj jeden helper

```js
export function publicPath(path = '') {
  const base = import.meta.env.BASE_URL || '/';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  const cleanPath = String(path)
    .replace(/^\/+/, '')
    .replace(/^public\//, '');

  return `${cleanBase}${cleanPath}`;
}
```

Opcjonalnie rozszerz helper o świadomą obsługę pełnych URL-i, ale tylko jeżeli projekt rzeczywiście ich potrzebuje i ma jasno opisany kontrakt.

### Krok 3: trzymaj logical paths w content/config

```js
const assets = {
  model: '/glb/model.glb',
  image: '/png/image.png',
  demo: '/gif/demo.gif',
  preset: '/json/preset.json'
};
```

Nie wpisuj `public/` ani nazwy repozytorium.

### Krok 4: rozwiązuj URL na granicy I/O

GLB:

```js
const loader = new GLTFLoader();
loader.load(publicPath('/glb/model.glb'), onLoad, onProgress, onError);
```

PNG/texture:

```js
const texture = new THREE.TextureLoader().load(
  publicPath('/png/texture.png')
);
```

DOM image/GIF:

```js
image.src = publicPath('/gif/demo.gif');
```

JSON:

```js
const response = await fetch(publicPath('/json/preset.json'));
if (!response.ok) throw new Error(`HTTP ${response.status}`);
const preset = await response.json();
```

Dynamiczny public module:

```js
const moduleUrl = publicPath('/vendor/library/module.js');
const module = await import(/* @vite-ignore */ moduleUrl);
```

### Krok 5: jeżeli moduł jest poza `public/`, jawnie dostarcz go do `dist`

Możliwości:

- przenieś plik do `public/vendor/...` i pozwól Vite go kopiować;
- albo użyj kontrolowanego pluginu `writeBundle`/copy plugin;
- zapewnij local dev middleware lub standardowy import Vite;
- skopiuj wszystkie transitively imported moduły;
- ustaw poprawny MIME type dla ESM;
- obsłuż bare imports przez bundling, alias lub import map.

### Krok 6: dodaj fallback i zdecyduj o criticality

Fallback komponentu i polityka globalnego preloadu muszą być zgodne. Jeżeli brak modelu ma pozostawić placeholder, asset nie powinien jednocześnie bezwarunkowo blokować całego startu — chyba że jest to świadoma decyzja UX.

### Krótka checklista implementacyjna

- [ ] Jedno źródło Vite `base`.
- [ ] Jeden helper URL dla public assets.
- [ ] Logical paths bez `public/` i bez repo base.
- [ ] Każdy loader/fetch/src/style URL używa helpera lub już rozwiązanej wartości z cache.
- [ ] Vendor runtime znajduje się w `dist` wraz z zależnościami.
- [ ] Import map/alias używa tego samego base i tej samej wersji biblioteki.
- [ ] Test 404 i fallbacków dla każdego stage'u assetów.
- [ ] Test na case-sensitive systemie plików.

## 12. QA checklist

- [ ] `npm run dev`
  - otworzyć URL podany przez Vite, oczekując `/tomasz-talik-portfolio/`;
  - sprawdzić Classic 2D i Experience 3D.
- [x] `npm run build`
  - build kontrolny 2026-06-11 zakończył się powodzeniem;
  - wystąpił tylko warning Vite o chunku Experience 3D większym niż 500 kB, niezwiązany ze ścieżkami.
- [ ] `npm run preview`
  - otworzyć produkcyjny build pod repo base;
  - wykonać hard refresh na URL aplikacji.
- [ ] W DevTools Network potwierdzić brak requestów do `/public/...`.
- [ ] Na GitHub Pages potwierdzić, że requesty GLB/PNG/GIF/SVG/vendor zawierają `/tomasz-talik-portfolio/`.
- [ ] Potwierdzić `200` i poprawny MIME type dla `vendor/three/examples/jsm/loaders/GLTFLoader.js` oraz importowanych modułów pomocniczych.
- [ ] Potwierdzić ładowanie monkey, glyphów, sun/moon, stones, shells i small glyphs.
- [ ] Potwierdzić pięć galaxy PNG jako tekstury sprite'ów.
- [ ] Potwierdzić panel backgrounds, ornamenty i mobile SVG frame.
- [ ] Potwierdzić Classic 2D PNG, DIG GIF i sześć screenshotów.
- [ ] Jeżeli zostanie dodany publiczny JSON, sprawdzić go po hard refresh przez base-aware URL.
- [ ] Sprawdzić zgodność case-sensitive nazw z plikami na dysku, szczególnie `DIG_engine.gif`.
- [ ] Potwierdzić brak regresji Classic 2D po błędzie/odrzuceniu uruchomienia Experience 3D.
- [ ] Osobno przetestować awarię assetu `criticalInitial` i potwierdzić oczekiwaną politykę: blokada vs fallback.
- [x] Skontrolować zawartość builda:
  - public assets znalazły się w `dist/glb`, `dist/png`, `dist/gif`, `dist/svg`;
  - vendor znalazł się w `dist/vendor/three`;
  - `dist/index.html` zawiera base-aware entry URL-e i import map.

## 13. Files read

### Konfiguracja, entry i deployment

- `package.json`
- `vite.config.js`
- `index.html`
- `.github/workflows/deploy.yml`
- `README.md`

### Runtime i asset infrastructure

- `src/main.js`
- `src/experience3d.js`
- `src/classic2d.js`
- `src/utils/publicPath.js`
- `src/utils/gltfLoader.js`
- `src/vendor/three.js`
- `src/assets/assetManager.js`
- `src/assets/assetManifest.js`
- `src/assets/preloadAssets.js`
- `src/content/portfolioNodes.js`

### Scena i UI — sekcje dotyczące assetów, cache i fallbacków

- `src/scene/centralObject.js`
- `src/scene/monkeyModel.js`
- `src/scene/orbitNodes.js`
- `src/scene/galaxySprites.js`
- `src/scene/sunCycle.js`
- `src/scene/moonCycle.js`
- `src/scene/atmosphere.js`
- `src/ui/overlay.js`
- `src/ui/optionsPanel.js`
- `src/styles/main.css`

### Dokumentacja techniczna i mapy

- `docs/current/technical/DEPLOYMENT_MODEL.md`
- `docs/current/technical/FRONTEND_RUNTIME_MODEL.md`
- `docs/current/maps/PROJECT_INDEX.md`
- `docs/current/maps/DEPENDENCY_MAP.md`

### Struktury plików skontrolowane komendami

- pliki pod `public/`;
- pliki pod `vendor/three/`;
- po kontrolnym buildzie pliki pod `dist/glb`, `dist/png`, `dist/gif`, `dist/svg` i `dist/vendor/three` oraz wygenerowany `dist/index.html`.

## 14. Files changed

- `docs/current/audits/technical/public-asset-path-resolution-audit.md` — nowy dokument audytu.

Nie zmieniono runtime, `vite.config.js`, assetów, workflow deployu ani istniejących helperów. Artefakty kontrolnego builda zostały po weryfikacji przywrócone do stanu repozytorium i nie należą do zmiany.
