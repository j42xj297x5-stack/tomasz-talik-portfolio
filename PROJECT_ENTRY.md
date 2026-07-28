# Karta wejścia do projektu

## Status i funkcja

- **Status:** canonical repository entrypoint.
- To jest pierwszy plik, który czyta Architekt ChatGPT przed analizą projektu.
- Dokument jest mapą dostępu do aktualnego świata projektu, a nie pełną dokumentacją.

## Tożsamość projektu

- **Nazwa:** `tomasz-talik-portfolio`.
- **Repozytorium:** `https://github.com/j42xj297x5-stack/tomasz-talik-portfolio`.
- **Główna gałąź:** `porfolio`.

Portfolio prezentuje interaktywną pracę i projekty Tomasza Talika. Udostępnia tryby Classic 2D, Experience 3D oraz osobny Experience VR. Wspólne dane portfolio zasilają trzy sposoby prezentacji.

## Aktualny świat projektu

- **Tryby/runtime'y:** powłoka wejściowa wybiera Classic 2D, warunkowo uruchamiane Experience 3D albo dostępny po sprawdzeniu WebXR, osobno importowany Experience VR.
- **Stos:** Vite, vanilla JavaScript, CSS oraz lokalnie vendored Three.js dla Experience 3D.
- **Publikacja:** GitHub Pages, z bazową ścieżką zgodną z nazwą repozytorium i bezpiecznym rozwiązywaniem ścieżek publicznych.
- **Główne obszary:** runtime i scena w `src/`, zasoby statyczne w `public/` i `vendor/`, a aktualna dokumentacja w `docs/current/`.

## Obowiązkowe okna projektu

- `docs/current/maps/PROJECT_INDEX.md` — kanoniczny indeks i router minimalnych pakietów plików dla zadania.
- `docs/current/maps/DOCUMENTATION_MAP.md` — mapa klas dokumentów i zasad ich umieszczania.
- `docs/current/maps/DEPENDENCY_MAP.md` — graf zależności wysokiego poziomu oraz statusy zależności runtime'u.
- `docs/current/decisions/DECISION_LOG.md` — rejestr decyzji projektowych.
- `docs/README.md` — główne wejście do dokumentacji.
- `docs/current/README.md` — hub aktywnej dokumentacji.

Kolejność czytania jest obowiązkowa: najpierw `PROJECT_ENTRY.md`, następnie `docs/current/maps/PROJECT_INDEX.md`, a potem wyłącznie mapa lub dokumentacja wskazana przez trasę danego zadania.

## Zasada źródeł

- Dokumentacja kanoniczna opisuje aktualny model.
- Kod jest dowodem aktualnej implementacji.
- Snapshots i audyty są materiałem dowodowym.
- `legacy` jest historią i nie jest czytane domyślnie.
- Konflikt między kodem, dokumentacją i decyzją Projektanta należy zgłosić, a nie rozstrzygać przez zgadywanie.

## Bramka dostępu

Jeśli `PROJECT_ENTRY.md`, `PROJECT_INDEX.md` albo wymagana mapa nie istnieje, jest nieaktualna lub niedostępna, Architekt zatrzymuje analizę i informuje Projektanta, że nie posiada wystarczającego widoku projektu.

## Utrzymanie

- Aktualizuj tę kartę wyłącznie po zmianie nazwy repozytorium, głównej gałęzi, architektury najwyższego poziomu albo ścieżek do map.
- Nie dopisuj tu historii kolejnych wdrożeń.
- Szczegóły techniczne pozostają w dokumentacji kierowanej przez `docs/current/maps/PROJECT_INDEX.md`.
