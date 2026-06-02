# BACKGROUND ATMOSPHERE MODEL (Technical-Artistic Contract)

## 1) Cel dokumentu i zakres

Ten dokument definiuje **kontrakt techniczno-artystyczny** dla warstwy tła i reaktywnej atmosfery w projekcie roboczo nazwanym **portfolio**.

Zakres dokumentu:
- opis intencji wizualnej,
- opis modelu stanów atmosfery,
- opis warstw efektu (pył, mikroobiekty, mgła, aura),
- kontrakt integracyjny między UI/HTML/CSS a sceną Three.js,
- wymagania wydajnościowe i dostępnościowe,
- plan etapowego wdrożenia.

Poza zakresem:
- implementacja runtime,
- zmiana logiki paneli i routingu,
- zmiana treści portfolio.

> Kluczowa zasada: **najpierw rytm interakcji, potem piękno**.  
> Scena przyciąga. Panel wyjaśnia. Case study rozwija.

---

## 2) Kontekst architektoniczny

- Projekt: interaktywne portfolio AI oparte o **Three.js**.
- Centralny symbol sceny: **medytująca małpa 3D**.
- Wokół centrum: **5 głównych glifów/sfer działania**.
- Odpowiedzialności:
  - **Three.js**: świat, kamera, światła, bryły, cząsteczki, postać centralna, orbitujące glify/punkty, przejścia przestrzenne.
  - **HTML/CSS**: czytelne panele, tekst, przyciski, linki, case studies, fallback mobile, dostępność.

### Fundamentalna reguła separacji
Warstwa atmosfery jest **visual-only**:
- może czytać `activeGateId` i dane koloru/tematu,
- nie zarządza treścią paneli,
- nie zarządza routingiem,
- nie zmienia modelu contentu,
- nie zależy od finalnych tekstów marketingowych.

---

## 3) Główna intencja artystyczna

Tło nie jest zwykłą dekoracją — to **stan świata**.

W stanie bazowym:
- scena pozostaje ciemna, spokojna, medytacyjna i czytelna,
- przestrzeń centralna (z małpą) pozostaje względnie czysta,
- życie wizualne dzieje się głównie na peryferiach.

W reakcji na kliknięcie glifu:
- atmosfera przechodzi do **focus / breath in**,
- tło subtelnie rozświetla się kolorem aktywnej sfery,
- efekt ma być spokojny, miękki i czytelny.

W reakcji na zamknięcie panelu / powrót do sceny:
- atmosfera przechodzi do **returning / breath out**,
- kolor powoli wygasa,
- scena wraca do ciemnego, kontemplacyjnego idle.

### Zakaz estetyczny
Bez przeładowania cyberpunkowego, bez „dyskoteki”, bez zasłaniania centralnej małpy.

---

## 4) Pięć sfer/glifów i kontrakt kolorystyczny

> Uwaga: poniższe kolory to **roboczy kontrakt wizualny**, nie finalny branding.

### 4.1 AI Guide / AI Transformation
- Symbol: drzewo.
- Znaczenie: prowadzenie ludzi przez AI, oswajanie technologii, budowanie mostu człowiek–AI.
- Kolorystyka: żywa zieleń, organiczne światło, wzrost, ukorzenienie.
- Reakcja tła: subtelne zielone rozjaśnienie jak puls życia / światło w korzeniach.

### 4.2 Creativity / Creative AI
- Symbol: płomień.
- Znaczenie: twórczość, obraz, muzyka, prompt design, transformacja pomysłu w artefakt.
- Kolorystyka: pomarańczowo-czerwony płomień + opcjonalny ciepły żółty rdzeń.
- Reakcja tła: ciepły żar, powolne „rozpalanie” pyłu, subtelne iskry bez agresji.

### 4.3 Ethics / Life Protection / AI Dharma
- Symbol: złoty znak / etyczne światło.
- Znaczenie: odpowiedzialne użycie AI, ochrona życia, świadomość, służba zamiast dominacji.
- Kolorystyka: złoto + ciepłe białe światło, sakralny blask.
- Reakcja tła: miękkie złote halo, rozjaśnianie cienia bez tonu apokaliptycznego.

### 4.4 DIG Engine / API / Programming / Office Systems
- Symbol: biało-niebieski glif techniczny.
- Znaczenie: API, skrypty, programowanie, automatyzacje, biuro, dane, workflow.
- Kolorystyka: biel + chłodny błękit, techniczna czytelność.
- Reakcja tła: drobiny w bardziej uporządkowanej sieci, chłodny błękitny glow.

### 4.5 Haiku Cosmos
- Symbol: niebieski glif kosmiczno-systemowy.
- Znaczenie: połączenie kreatywności, gry, świata interaktywnego, mechanik, UI, dokumentacji i systemowego projektowania.
- Kolorystyka: głęboki niebieski / błękit / lekki fiolet kosmiczny.
- Reakcja tła: subtelna kosmiczna aura, delikatne orbity i systemowy ruch mikroobiektów.

---

## 5) Model stanów atmosfery

## 5.1 Proponowany model danych

```js
AtmosphereState = {
  mode: "idle" | "hover" | "focusing" | "focused" | "returning",
  activeGateId: null | string,
  activeThemeColor: string | null,
  intensity: number,        // 0.0–1.0
  targetIntensity: number,  // 0.0–1.0
  breathPhase: number,      // 0.0–1.0
  transitionSpeedIn: number,
  transitionSpeedOut: number,
  safeRadius: number,
  shellInnerRadius: number,
  shellOuterRadius: number
}
```

### 5.2 Zasady poszczególnych stanów

1. **idle**
   - ciemny świat,
   - bardzo delikatny pył,
   - minimalny ruch,
   - wysoka czytelność małpy i glifów,
   - spokojne centrum.

2. **hover**
   - wyłącznie lokalna reakcja glifu,
   - krótki label/podświetlenie,
   - brak globalnego rozświetlania tła.

3. **focusing (breath in)**
   - start po kliknięciu glifu,
   - aktywny glif dostaje aurę,
   - tło łapie kolor aktywnej sfery,
   - drobiny peryferyjne zwiększają opacity/tint,
   - mgła lekko się rozświetla,
   - ruch może minimalnie przyspieszyć lub się uporządkować,
   - czas wejścia: orientacyjnie **1.2–2.0 s**.

4. **focused**
   - panel HTML/CSS jest otwarty,
   - tło utrzymuje spokojny aktywny stan,
   - kolor aktywny jest obecny, ale nie zalewa sceny,
   - małpa i centrum pozostają czytelne,
   - atmosfera oddycha bardzo wolno.

5. **returning (breath out)**
   - start po zamknięciu panelu/powrocie do sceny,
   - aktywny kolor gaśnie stopniowo,
   - pył i mgła wracają do idle,
   - czas wyjścia: orientacyjnie **3.5–6.0 s**,
   - charakter: miękki i kontemplacyjny.

---

## 6) Warstwy efektu (docelowy model)

### A) Dust Field
- Technika: `THREE.Points`.
- Skala: 300–800 drobin.
- Spawn: wyłącznie poza `safeRadius`.
- Idle: niska opacity.
- Focused: delikatny wzrost opacity.
- Kolor: tint zgodny z aktywną sferą.
- Ruch: bardzo wolna rotacja grupy.
- Zakaz: migotliwa „dyskoteka”.

### B) Micro Relics / Small Rotating Objects
- Technika: `THREE.InstancedMesh` (preferowane) lub kilka prostych geometrii.
- Skala: 20–60 obiektów.
- Forma: kamyczki/odłamki/mini-glify/kryształki lub neutralne organiczno-techniczne bryłki.
- Spawn: wyłącznie poza `safeRadius`.
- Ruch: wolna rotacja własna + powolna orbita/dryf.
- Focus: część obiektów może łapać delikatny tint aktywnej sfery.

### C) Mist Shell / Background Fog
- Technika: transparentne sprite’y lub płaszczyzny z noise texture.
- Układ: kilka dużych warstw, daleko za centrum.
- Opacity: bardzo niskie.
- Ruch: powolny drift.
- Focus: tint aktywnej sfery.
- Ograniczenie: nie zasłaniać małpy i głównych glifów.
- `THREE.Fog/FogExp2`: wyłącznie ostrożnie i opcjonalnie; preferowana mgła kontrolowana jako osobna warstwa.

### D) Gate Aura
- Aktywny glif dostaje lokalną aurę/halo.
- Intensywność focus > hover.
- Aura nie zalewa całej sceny.
- Możliwe narzędzia: sprite, emissive material, prosty glow shell.
- Bloom: dopiero później, opcjonalnie.

### E) Optional Selective Bloom
- Tylko etap późniejszy.
- Nie uruchamiać mocnego globalnego bloom jako default.
- Jeśli użyty: selektywnie na wybranych obiektach/warstwach.
- Cel: miękki sakralno-kosmiczny blask, nie efekt klubowy.

---

## 7) Safe center model (zasada nienegocjowalna)

Centrum sceny jest chronione.

- `safeRadius` obejmuje małpę i najbliższą przestrzeń.
- Pył, mgła i mikroobiekty nie spawnują się w centrum.
- Centralny obiekt pozostaje kotwicą ciszy.
- Atmosfera żyje na peryferiach i nie konkuruje z małpą.
- Focus aktywnej sfery może rozświetlić fragment świata kierunkowo, ale nie może zasłonić centrum.

---

## 8) Proponowany config (roboczy)

```js
backgroundAtmosphere: {
  enabled: true,

  safeRadius: 3.5,
  shellInnerRadius: 5.0,
  shellOuterRadius: 13.0,

  dust: {
    enabled: true,
    count: 500,
    idleOpacity: 0.06,
    focusedOpacity: 0.18,
    rotationSpeed: 0.015,
    pulseAmount: 0.04
  },

  microRelics: {
    enabled: true,
    count: 32,
    minScale: 0.035,
    maxScale: 0.12,
    rotationSpeedMin: 0.004,
    rotationSpeedMax: 0.02,
    focusTintStrength: 0.35
  },

  mist: {
    enabled: true,
    layerCount: 5,
    idleOpacity: 0.03,
    focusedOpacity: 0.12,
    driftSpeed: 0.006,
    focusTintStrength: 0.45
  },

  gateAura: {
    hoverIntensity: 0.25,
    focusIntensity: 1.0,
    breathInSeconds: 1.6,
    breathOutSeconds: 4.5
  },

  bloom: {
    enabled: false,
    mode: "future-selective-only"
  }
}
```

---

## 9) Proponowany gate theme config (roboczy)

```js
gateThemes: {
  aiGuide: {
    symbol: "tree",
    label: "AI Guide",
    color: "#9be66f",
    atmosphere: "organic-growth"
  },
  creativity: {
    symbol: "flame",
    label: "Creativity",
    color: "#ff7a2f",
    secondaryColor: "#ffd166",
    atmosphere: "warm-embers"
  },
  ethics: {
    symbol: "golden-mark",
    label: "Ethics / Life Protection",
    color: "#f7d36b",
    atmosphere: "sacred-halo"
  },
  spotifyDigger: {
    symbol: "api-glif",
    label: "DIG Engine",
    color: "#b8e8ff",
    secondaryColor: "#5aa9ff",
    atmosphere: "data-network"
  },
  haikuCosmos: {
    symbol: "cosmic-glif",
    label: "Haiku Cosmos",
    color: "#4fa3ff",
    secondaryColor: "#7b6dff",
    atmosphere: "cosmic-system"
  }
}
```

### Zasada źródła prawdy (single source of truth)
Jeśli w repo istnieje moduł typu `content/portfolioNodes` (lub analogiczny), docelowo dane `gateId/themeColor` powinny być utrzymywane w **jednym źródle prawdy**, a warstwa atmosfery powinna te dane wyłącznie odczytywać.

Zakaz: duplikowanie definicji kolorów i identyfikatorów sfer w wielu niespójnych miejscach.

---

## 10) Proponowana struktura modułów (przyszła implementacja)

Wariant docelowy (modułowy):

```text
src/scene/atmosphere/
  atmosphereConfig.js
  atmosphereState.js
  createAtmosphere.js
  dustField.js
  microRelics.js
  mistShell.js
  gateAura.js
```

Wariant MVP (minimalny):

```text
src/scene/atmosphere.js
```

Uwaga: to propozycja struktury. Ten dokument **nie wdraża** runtime.

---

## 11) Kontrakt integracji z UI i sceną

1. UI/panele po kliknięciu glifu przekazują do sceny `activeGateId`.
2. Atmosfera reaguje na `activeGateId` + `themeColor`.
3. Hover glifu uruchamia tylko lokalną reakcję hover.
4. Click glifu uruchamia `focusing` (breath in).
5. Close panel / powrót uruchamia `returning` (breath out).
6. Atmosfera nie przechowuje treści panelu.
7. Atmosfera nie decyduje o routingu.
8. Atmosfera nie zależy od finalnych tekstów strony.
9. Atmosfera działa jako **visual-only scene response**.

---

## 12) Performance guidelines

- Nie tworzyć i nie niszczyć geometrii co klatkę.
- Używać `THREE.Points` dla pyłu.
- Używać `THREE.InstancedMesh` dla wielu małych obiektów.
- Ograniczać transparent overdraw.
- Unikać ciężkiego volumetric fog.
- Bloom tylko opcjonalnie, po osobnym pomiarze FPS.
- Zapewnić config/debug switch do szybkiego wyłączenia warstwy.
- Na słabszych urządzeniach redukować: `dust.count`, `microRelics.count`, `mist.layerCount`.
- Mobile fallback musi pozostać czytelny i stabilny.

---

## 13) Accessibility / readability

- Tło nie może utrudniać czytania paneli HTML/CSS.
- Panel ma mieć własny kontrast i czytelność niezależnie od Three.js.
- Ruch tła powinien być spokojny.
- Docelowo przewidzieć **reduced motion mode**.
- Jeśli user/system preferuje reduced motion, atmosfera ogranicza drift, puls i rotacje.

---

## 14) QA checklist

- [ ] Centrum sceny pozostaje czyste.
- [ ] Małpa jest czytelna w `idle`, `focused`, `returning`.
- [ ] Każdy glif ma rozróżnialną reakcję kolorystyczną.
- [ ] Hover nie odpala całego tła.
- [ ] Click odpala breath in.
- [ ] Close/powrót odpala wolniejszy breath out.
- [ ] Panel HTML/CSS pozostaje czytelny.
- [ ] Tło nie zasłania UI.
- [ ] Pył i mikroobiekty nie spawnują się w `safeRadius`.
- [ ] Efekt nie wygląda jak cyberpunkowa dyskoteka.
- [ ] Brak mocnego globalnego bloom na start.
- [ ] Warstwa może być wyłączona configiem.
- [ ] FPS pozostaje stabilny.
- [ ] Mobile/reduced motion nie są popsute.

---

## 15) Plan wdrożenia etapowego

### Etap A — dokumentacja i kontrakt
- Tylko ten dokument.
- Bez zmian w runtime.

### Etap B — idle atmosphere
- Dust field + minimalny drift.
- `safeRadius`.
- Config `enabled` on/off.

### Etap C — micro relics
- Małe rotujące obiekty poza centrum.
- `InstancedMesh` lub wariant MVP.

### Etap D — gate focus response
- Obsługa `activeGateId`.
- Breath in / breath out.
- Tint tła wg aktywnej sfery.
- Gate aura.

### Etap E — mist shell
- Warstwy mgły/noise.
- Tint + drift.
- Test czytelności.

### Etap F — optional selective bloom
- Tylko po pomiarach.
- Tylko selektywnie.
- Bez globalnej „dyskoteki”.

---

## 16) Zakazy wdrożeniowe (do respektowania)

- Nie implementować teraz kodu runtime.
- Nie zmieniać istniejącej logiki paneli.
- Nie zmieniać treści portfolio.
- Nie zmieniać finalnych nazw projektu.
- Nie traktować Haiku Cosmos jako nazwy całego projektu.
- Nie dodawać Reacta.
- Nie dodawać backendu.
- Nie przenosić paneli tekstowych do Three.js.
- Nie tworzyć ciężkiego volumetric fog.
- Nie dodawać mocnego globalnego bloom jako domyślnego efektu.
- Nie wypełniać centrum sceny pyłem ani mgłą.
- Nie robić efektu komediowego/memicznego/cyberpunkowo przeładowanego.

---

## 17) Status dokumentu

- Status: **Draft v1 (kontrakt roboczy)**.
- Charakter: dokument kierunkowy do kolejnych etapów implementacyjnych.
- Priorytet decyzji: rytm interakcji i czytelność nad widowiskowością.

## Runtime addition — distant galaxy alpha sprites (2026-05-29)
- New module: `src/scene/galaxySprites.js`.
- Expected manual assets: `public/png/galaxy_01.png`, `public/png/galaxy_02.png`, `public/png/galaxy_03.png`, `public/png/galaxy_04.png`, and `public/png/galaxy_05.png`.
- Browser/runtime paths stay logical public paths (`/png/galaxy_01.png` etc.) and are normalized with `publicPath(...)` before `THREE.TextureLoader.load(...)`; browser URLs must never include the `public/` folder segment.
- The PNGs are treated as real transparent-alpha cutouts. `THREE.SpriteMaterial` defaults to `transparent: true`, `depthWrite: false`, `depthTest: true`, `NormalBlending`, configurable `alphaTest`, and subtle opacity.
- Missing galaxy PNGs are non-fatal: the loader logs a clear warning and skips only the missing texture source. If all are missing, the layer remains empty while the rest of the scene continues.
- Debug/runtime config is exposed under `galaxySprites`: `enabled`, `totalMax`, `copiesPerTextureMin`, `copiesPerTextureMax`, `minScale`, `maxScale`, `opacity`, `opacityVariance`, `innerRadius`, `outerRadius`, `verticalSpread`, `orbitSpeedMin`, `orbitSpeedMax`, `ownSpinSpeedMin`, `ownSpinSpeedMax`, `additiveBlending`, `alphaTest`, and `randomSeed`, plus a rebuild button in the Options panel.
- The layer is visual-only, non-interactive, conservative by default (`totalMax: 14`), avoids the center, performs no raycasting/postprocessing, and uses reduced-motion speed scaling.
- Known limitation: texture paths are intentionally fixed in runtime config/code rather than editable as text fields in the current Options panel; replacing sources requires editing config or asset files.
