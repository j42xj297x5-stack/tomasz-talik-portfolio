# Experience VR — Narrative & Progression Baseline

Status: **CURRENT / canonical** dla doświadczenia, prowadzenia i copy. Techniczne ownerstwo: [`VR_SCENARIO_DIRECTOR_MODEL.md`](../technical/VR_SCENARIO_DIRECTOR_MODEL.md) i [`VR_RUNTIME_MODEL.md`](../technical/VR_RUNTIME_MODEL.md).

## Aktualna droga gracza

Intro prowadzi przez kalibrację XR, reveal Małpy i świata, onboarding, zaproszenie, próg i fizyczne wejście do kręgu. Pierwszy crystal uruchamia uwagę Małpy; świadome kliknięcie rozpoczyna Reliquary reveal. `2.30` obejmuje pięć pierwszych kart. Pierwszy trwały `5/5` uruchamia prezentację ringu w `2.40`, a dopiero jej realne zakończenie prowadzi do post-ring.

```text
3.10 visible but non-interactive shell field + elevated main glyphs
→ 3.20 observation
→ 3.30 player-opened Monkey dialogue
→ 3.40 Furnace reveal
→ 3.50 conscious Astro production request
→ 3.60 construction
→ 3.70 physical AVAILABLE, not EARNED
→ 3.80 physical claim, EARNED and shell/tool capabilities
```

Nie istnieje automatyczny Tier-1 unlock Astro. Skorupy stają się interaktywne dopiero po fizycznym claimie w `3.80`; ich pole jest to samo, które zostało pokazane w `3.10`.

## Obowiązujące post-ring copy i komunikacja

Attention/checheszki w `3.30` oznaczają wyłącznie nową wiadomość. Dialog nie otwiera się automatycznie: gracz musi podejść, wskazać i kliknąć Małpę. Beat brzmi dokładnie:

1. `No i świat przestał być uprzejmy.`
2. `To, czego potrzebujesz, jest teraz poza zasięgiem.`
3. `Na szczęście nie na długo.`

Dopiero acknowledgement ostatniej kwestii kończy dialogue. W `3.40` Piec zostaje rzeczywiście ujawniony, a copy brzmi dokładnie:

1. `Spójrz na Piec.`
2. `Tam coś na ciebie czeka.`

W `3.50` gracz świadomie wybiera `Utwórz astro przyciągacz`; produkcja nie uruchamia się automatycznie.

## Physical claim jako gate

`3.70` oznacza Astro `AVAILABLE` w otwartej komorze, bez `EARNED` i equip capability. Claim wymaga prawej `NORMAL_HAND`, ordinary ray, real target hit i trigger/`selectstart`. Dopiero completed handoff / `ASTRO_ATTRACTOR_CLAIMED` w `3.80` nadaje `EARNED` oraz capability Astro i skorup.

## Granica i późniejsze systemy

Aktualny authored mainline prowadzi przez `3.80` do canonical terminala fabuły `100.10`. Shell/Furnace/Asterion loop nie ma obecnie authored punktów pomiędzy tym gameplay boundary a terminalem i pozostaje NEXT, nie ukończonym następstwem. Rune Stones zachowują osobny canonical target model w [`VR_RUNE_STONES_MODEL.md`](../technical/VR_RUNE_STONES_MODEL.md), ale pozostają późniejszym systemem.

## Hardware status

Wizjoner potwierdził na Meta Quest 3S wyłącznie bootstrap fix: Experience VR przechodzi poza preload `41/41` i nie zatrzymuje się przed READY — **HARDWARE VALIDATED — Meta Quest 3S**. Pełny flow `3.10–3.80`, Furnace reveal, Astro materialization, skala/orientacja, hover, physical handoff i shell targeting pozostają hardware/perceptual QA pending. Automated PASS nie zmienia tego statusu.
