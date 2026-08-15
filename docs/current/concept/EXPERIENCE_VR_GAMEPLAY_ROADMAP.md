# Experience VR Gameplay Roadmap

Status: **CURRENT concept roadmap**. Runtime authority: [`VR_RUNTIME_MODEL.md`](../technical/VR_RUNTIME_MODEL.md); Scenario authority: [`VR_SCENARIO_DIRECTOR_MODEL.md`](../technical/VR_SCENARIO_DIRECTOR_MODEL.md).

## Implemented authored baseline

Intro, first crystal/Reliquary reveal, five Tier-1 cards, first-ring presentation bridge and mainline `3.10–3.80` są implemented. Kolejność po `5/5` prowadzi przez post-ring presentation, observation, świadomie otwierany Monkey dialogue, Furnace reveal, świadomą produkcję Astro, construction, physical availability oraz physical claim.

Tier 1 nie daje automatycznie Astro. Dopiero `ASTRO_ATTRACTOR_CLAIMED` w `3.80` czyni je `EARNED` i przyznaje `CAN_EQUIP_ASTRO`, `CAN_SCAN_SHELLS`, `CAN_TARGET_SHELLS`. Widoczne od `3.10` pole skorup nie jest przed claimem interaktywne ani revealowane ponownie.

## STOP BOUNDARY / NEXT

Authored mainline kończy się na `3.80`. Dalszy authored shell progression i pełny Asterion loop są **NEXT / NOT YET AUTHORED**, mimo istniejących domenowych mechanik runtime. Najbliższe zadania to:

- hardware/perceptual QA `3.10–3.80`;
- authored shell/Furnace/Asterion progression po `3.80`;
- następnie małe glify i dalsze akty zgodnie z kanonem.

## Future systems

- progression-unlocked Astro bands wybierane przyciskiem B;
- radar/sector targeting i antenna;
- Rune Stones oraz Emanation Matrix jako osobny zaprojektowany późniejszy etap, nie wdrożone następstwo `3.80`;
- final radar/finale, spatial audio, durable persistence i full-game reset.
