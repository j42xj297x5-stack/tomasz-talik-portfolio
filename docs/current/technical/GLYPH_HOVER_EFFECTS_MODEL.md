# Glyph Hover Effects Model (Working Canon)

## Cel i zakres

Ten dokument definiuje aktywny kontrakt hovera dla pięciu glifów orbitujących wokół centralnej małpy w Experience 3D. Hover ma charakter jednolity i informacyjny: potwierdza interaktywny target bez budowania osobnej narracji wizualnej dla pojedynczego node'a.

Zakres obejmuje wyłącznie standardowy lifecycle hovera. Nie zmienia geometrii sceny, raycastingu, orbit, kamery ani sekwencji kliknięcia.

## Wspólny kontrakt pięciu glifów

Każdy glif korzysta z tego samego one-shota:

1. Wejście kursora na nowy glif uruchamia krótki scale pulse i neutralne światło hover.
2. Runtime przechodzi przez wspólny lifecycle `idle → playing → idle`.
3. Kolejne `pointermove` nad tym samym glifem nie restartują przebiegu.
4. `pointerleave` usuwa wyłącznie stan kursora i etykietę; rozpoczęty one-shot wybrzmiewa do końca.
5. Po powrocie runtime'u do `idle` kolejne wejście może uruchomić nowy przebieg.
6. Wszystkie glify używają tego samego czasu, skali i neutralnego koloru światła; nie ma wyjątków zależnych od identyfikatora node'a.

Przebiegi hover różnych glifów mogą kończyć się niezależnie, ponieważ ich stan jest przechowywany per node.

## Relacja z kliknięciem i plaque transition

`transitionActive` blokuje nowe triggery hover oraz zatrzymuje standardowy scale/light wybranego node'a. Nie zmienia pozostałej sekwencji kliknięcia: focus kamery, transition light, plaque reveal/reverse, panel, hold, dolly oraz return zachowują dotychczasowy kontrakt.

## Usunięte efekty specjalne

Aktywny runtime nie zawiera efektów żywiołów ani unikalnych animacji hover. Historyczne wizualizacje wzrostu drzewa oraz ognia (wirujące kulki, iskry i żarząca się kula) nie są ładowane, attachowane ani aktualizowane. Powiązany binarny asset pozostaje w repozytorium poza aktywnym runtime'em.

## Zasady ochronne

Należy zachować subtelność: bez nowych cząstek, aury, elementów żywiołów, efektów postprocessingu i wyjątków per glif. Celem hovera jest czytelne, lekkie potwierdzenie interakcji, a nie spektakl.

## Status

Status: **aktywny working canon** dla hovera pięciu glifów Experience 3D.
