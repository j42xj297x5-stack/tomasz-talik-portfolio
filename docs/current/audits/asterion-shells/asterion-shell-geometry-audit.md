# Asterion shell geometry audit

## SUMMARY DLA ARCHITEKTA

Sześć finalnych GLB przeanalizowano offline. PCA daje użyteczny, stabilny rzut każdej skorupy; descriptor nie zależy od kolejności absorpcji. Spherical-cube jest wystarczająco czytelny do implementacji runtime, z zachowaniem proponowanych szczelin.

## ZADANIE

Audyt geometrii i źródło deterministycznie eksportowanych danych produkcyjnych panelowej Sfery Asterionowej. Sam etap audytu nie zmieniał runtime ani gameplayu.

## METODA AUDYTU

Skrypt scala wszystkie Mesh do root-local, liczy kowariancję i deterministyczny prawoskrętny układ PCA U/V/W, generuje EdgesGeometry przy 30°, usuwa segmenty z udziałem W ≥ 0.62, rzutuje, deduplikuje, odrzuca linie krótsze niż 0.0025 maksymalnego wymiaru i zachowuje do 100 najdłuższych. Normalizacja ustawia największy wymiar na 2.

## WYNIKI PER SKORUPA

| assetId | file | bounds X×Y×Z | PCA major×secondary×thickness | thickness ratio | patch aspect | edges | final | face | rotation | scale | override/problem |
|---|---|---:|---:|---:|---:|---:|---:|---|---:|---:|---|
| shell-relic-1 | `public/glb/shell_01.glb` | 0.234834 × 0.074364 × 0.403131 | 0.41465 × 0.253334 × 0.077258 | 0.186321 | 1.63677 | 114 | 80 | +X | 0° | 0.84 | none |
| shell-relic-2 | `public/glb/shell_02.glb` | 0.324853 × 0.086106 × 0.53229 | 0.531359 × 0.323406 × 0.086191 | 0.162209 | 1.643008 | 158 | 100 | -X | 180° | 0.84 | none |
| shell-relic-3 | `public/glb/shell_03.glb` | 0.379648 × 0.074364 × 0.262231 | 0.387065 × 0.252734 × 0.06978 | 0.18028 | 1.531511 | 113 | 89 | +Z | 90° | 0.84 | none |
| shell-relic-4 | `public/glb/shell_04.glb` | 0.293542 × 0.078278 × 0.383562 | 0.384402 × 0.280227 × 0.07972 | 0.207386 | 1.371755 | 96 | 66 | -Z | -90° | 0.84 | none |
| shell-relic-5 | `public/glb/shell_05.glb` | 0.2818 × 0.039139 × 0.273973 | 0.295208 × 0.27616 × 0.04264 | 0.14444 | 1.068974 | 122 | 73 | +Y | 0° | 0.82 | none |
| shell-relic-6 | `public/glb/shell_06.glb` | 0.203523 × 0.07045 × 0.254403 | 0.260884 × 0.186518 × 0.071846 | 0.275394 | 1.398709 | 95 | 64 | -Y | 180° | 0.82 | none |

Pełne metryki (w tym mesh/vertex/triangle counts, centra, promienie, osie, hull area i etapy filtrowania) oraz finalne segmenty znajdują się w `asterion-shell-geometry-audit.json`. Nie wykryto przypadku wymagającego override rzutu PCA.

## REKOMENDOWANY FINALNY LAYOUT KULI

| shellAssetId | face | rotation | scale | flip | komentarz |
|---|---|---:|---:|---|---|
| shell-relic-1 | +X | 0° | 0.84 | U:false, V:false | equatorial, open silhouette |
| shell-relic-2 | -X | 180° | 0.84 | U:false, V:true | balances shell 1 |
| shell-relic-3 | +Z | 90° | 0.84 | U:false, V:false | dense equatorial patch |
| shell-relic-4 | -Z | -90° | 0.84 | U:true, V:false | opposes shell 3 |
| shell-relic-5 | +Y | 0° | 0.82 | U:false, V:false | compact north pole |
| shell-relic-6 | -Y | 180° | 0.82 | U:true, V:false | compact south pole |

Bardziej złożone łaty 1–4 zajmują równik, a 5–6 bieguny. Stałe skale .84/.82 tworzą cienką przerwę między płytami.

## WIZUALNY RAPORT

`docs/current/audits/asterion-shells/asterion-shell-geometry-audit.svg` pokazuje sześć spłaszczonych patchy, cube net z legendą i trzy deterministyczne widoki sfery.

## WNIOSKI

Spherical-cube zachowuje rozpoznawalne linie i dobrze komunikuje sześć energetycznych płyt. Nie są potrzebne geometryczne overrides. Runtime panelu zużywa deterministycznie eksportowane dane bez ponownej analizy GLB i bez PCA. Nadal możliwa jest artystyczna ocena skali szczeliny.

## NIE WYKONANO / POZA ZAKRESEM

Sam audyt nie zmienił GLB, panelu, wireframe pojedynczej skorupy, progresji, insertion/process ani gameplayu. Nie użyto WebGLRenderer/GPU; integracja panelu nastąpiła w osobnym etapie.

## ZMIENIONE/DODANE PLIKI

Skrypt audytu, biblioteka czystych funkcji, testy oraz generowane JSON/SVG/ten raport.

## TESTY WYKONANE

Patrz historia zadania/commit; deterministyczność jest weryfikowana przez dwa uruchomienia i porównanie SHA-256 generowanych artefaktów.

## OGRANICZENIA

EdgesGeometry odzwierciedla próg cech 30°, a limit 100 celowo redukuje detal. SVG jest diagnostyczną projekcją ortograficzną, nie renderingiem materiałowym.

## STAN PUBLIKACJI

Gotowe dane audytowe są źródłem wdrożonych danych patchy panelu. Fizyczna Kula Asterionowa pozostaje osobnym przyszłym etapem.
