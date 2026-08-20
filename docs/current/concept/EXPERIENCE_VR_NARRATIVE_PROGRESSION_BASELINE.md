# Experience VR — Narrative & Progression Baseline

Status: **CURRENT / canonical** jako lekka orientacja w przebiegu doświadczenia i zatwierdzonym kierunku dalszej progresji. Technicznym źródłem authored Scenario pozostaje [`VR_SCENARIO_DIRECTOR_MODEL.md`](../technical/VR_SCENARIO_DIRECTOR_MODEL.md), a stan implementacji rozstrzyga [`VR_RUNTIME_MODEL.md`](../technical/VR_RUNTIME_MODEL.md) wraz z kodem runtime.

Ten dokument opisuje, **co przeżywa gracz** i gdzie leży aktualna granica authored doświadczenia. Nie jest drugim modelem Scenario, katalogiem copy ani kontraktem implementacyjnym.

## IMPLEMENTED / AUTHORED — aktualna droga gracza

Intro prowadzi przez kalibrację XR, reveal Małpy i świata, onboarding, zaproszenie, próg oraz fizyczne wejście do kręgu. Następnie gracz poznaje cykl Glyph → Crystal → Reliquary, kompletuje pierwszy ring i przechodzi do post-ring.

Aktualny canonical authored Scenario prowadzi:

```text
1.10 → … → 3.80 → 4.10 → 100.10
```

W aktualnym przebiegu:

- gracz fizycznie odbiera Astro; dopiero claim ustanawia Astro `EARNED` i udostępnia pracę ze skorupami;
- gracz przechodzi shell/Furnace/Asterion loop: zbiera wymagane skorupy, przetwarza je w Piecu i uruchamia produkcję Kuli Asterionowej;
- fizyczny claim Kuli ustanawia Asterion `EARNED`;
- `4.10` reprezentuje świat po fizycznym odebraniu Kuli Asterionowej i aktywuje drugi cykl Glyph → Crystal → Reliquary;
- `P3` jest aktywnym checkpointem QA prowadzącym do `4.10`.

`4.10` jest obecną granicą authored progresji przed canonical terminalem `100.10`. Scenario nie authoruje jeszcze semantic completion Tier 2 ani prezentacji małych glifów.

## NEXT / NOT YET AUTHORED

Zatwierdzony kierunek dalszej progresji obejmuje:

- semantic completion Tier 2;
- przejście kończące drugi akt;
- radialne odsunięcie dużych glifów;
- materializację małych glifów;
- dalszą mechanikę Proto-Astro.

Są to cele projektowe, nie twierdzenia o runtime. Nie istnieją jeszcze authored pointy, eventy ani effects dla tego przejścia; ich ustanowienie wymaga osobnego zadania zgodnego z [`VR_SCENARIO_POINT_AUTHORING_STANDARD.md`](../technical/VR_SCENARIO_POINT_AUTHORING_STANDARD.md). Dokumenty projektowe nie zmieniają statusu implementacji.

### Target końca drugiego aktu

```text
Tier 2 complete
→ authored completion point jeszcze nie istnieje
→ world presentation: duże glify odchodzą radialnie + pojawiają się małe glify
→ po rzeczywistym completion prezentacji dalsza faza może zostać aktywowana
```

## Komunikacja

- [`EXPERIENCE_VR_COMMUNICATION_MECHANICS.md`](EXPERIENCE_VR_COMMUNICATION_MECHANICS.md) jest źródłem prawdy dla tego, kiedy, gdzie i jakiego typu komunikacja jest należna.
- [`EXPERIENCE_VR_PLAYER_COMMUNICATION_COPY.md`](EXPERIENCE_VR_PLAYER_COMMUNICATION_COPY.md) jest jedynym katalogiem zatwierdzonego copy PL. Wersja EN nie jest jeszcze kanonicznie ustalona i pozostaje osobnym zadaniem lokalizacyjnym.

> **Świat pokazuje.**
>
> **Małpa pomaga zrozumieć.**
>
> **Y pomaga pamiętać.**
>
> **Gracz decyduje, ile chce wiedzieć.**

Obowiązują następujące zasady orientacyjne:

- automatyczne `PROGRESSION_MESSAGE` nie używają `DALEJ`;
- kliknięcie lub pytanie gracza jest wymagane dla decyzji, tematów wiedzy i świadomego proszenia o pomoc;
- knowledge topics Astro odblokowują się dopiero po physical Astro `EARNED`;
- knowledge topics Asteriona odblokowują się dopiero po physical Asterion `EARNED`;
- panel Y i Małpa są projekcją istniejącej prawdy domenowej, a nie osobnym store'em progresji.

Baseline nie duplikuje pełnego katalogu tekstów ani technicznego kontraktu Scenario/Director.

## Hardware status

Wizjoner potwierdził na Meta Quest 3S wyłącznie bootstrap fix: Experience VR przechodzi poza preload `41/41` i nie zatrzymuje się przed READY — **HARDWARE VALIDATED — Meta Quest 3S**. Pełny flow `3.10–3.80`, Furnace reveal, Astro materialization, skala/orientacja, hover, physical handoff i shell targeting pozostają hardware/perceptual QA pending. Ta synchronizacja dokumentacji nie zmienia statusów hardware QA.
