# KANONICZNY PROTOKÓŁ WSPÓŁPRACY — WIZJONER → ARCHITEKT → CODEX v1.2

Status: **CURRENT / NORMATIVE**. Kod runtime rozstrzyga status **IMPLEMENTED**; decyzje Wizjonera rozstrzygają kanon produktu, progresji, komunikacji i hardware validation.

## Role i odpowiedzialność

Codex jest pojedynczym lokalnym wykonawcą patcha w plikach repozytorium. Nie tworzy subagentów, nie deleguje pracy, nie wysyła im poleceń i nie uruchamia automatycznego approval reviewera. Approval reviewerem jest zawsze użytkownik, nigdy `auto_review`.

Codex może:

- czytać pliki w minimalnym zakresie potrzebnym do zadania;
- edytować zakres wskazany przez Wizjonera lub Architekta;
- używać read-only Git wyłącznie wtedy, gdy jest to potrzebne do bieżącego zadania lub raportu, w tym `git status`, `git diff`, `git log`, `git show` i `git branch --show-current`;
- zwrócić Summary.

Codex nie może:

- wykonywać `commit`, `push`, tworzyć ani aktualizować PR oraz wykonywać `merge`, `rebase`, `cherry-pick`, `revert`, `reset` lub `clean`;
- publikować, deployować ani uruchamiać workflow GitHub;
- wykonywać PR review lub code review bez osobnego, jawnego zadania;
- tworzyć subagentów, delegować pracy ani uruchamiać automatycznego approval reviewera.

Wizjoner pozostaje właścicielem commitów, push, PR, merge, publikacji oraz decyzji o uruchomieniu testów i code review.

## Ekonomia wykonania

Domyślny przebieg `IMPLEMENT` to:

`READ MINIMUM → LOCAL EDIT → SUMMARY → STOP`

Nie jest nim:

`READ → IMPLEMENT → TEST → REVIEW → FIX REVIEW → COMMIT → PUSH → PR → PR REVIEW`

`AUDIT` pozostaje osobnym trybem. `REVIEW` pozostaje osobnym zadaniem wykonywanym tylko na jawne polecenie. Codex nie uruchamia dodatkowego agenta ani dodatkowego przebiegu tylko po to, aby potwierdzić własną pracę.

## Testy i walidacje wykonawcze

Domyślnie Codex nie uruchamia testów, test runnerów, testów jednostkowych, integracyjnych ani E2E, lint, buildów, benchmarków, coverage, CI, preview/deploy ani dodatkowych walidacji wymagających uruchomienia aplikacji.

Codex może wykonać konkretną walidację wyłącznie wtedy, gdy aktualny prompt Wizjonera lub Architekta jawnie wymienia jej nazwę albo dokładne polecenie, na przykład: „Uruchom `npm run build`”. Polecenia ogólne, takie jak „Uruchom odpowiednie testy”, „Sprawdź wszystko”, „Zweryfikuj zmianę” lub „Run relevant tests”, nie upoważniają do uruchomienia walidacji. Brak jawnej nazwy walidacji oznacza: nie uruchamiaj jej. Codex nie proponuje ani nie uruchamia walidacji „na wszelki wypadek”.

## Approval reviewer a code review

Approval reviewer i code review są odrębnymi pojęciami. Approval reviewerem jest zawsze użytkownik i nigdy `auto_review`. Code review nie jest domyślnym etapem `IMPLEMENT`: Codex nie wykonuje po patchu self-review, nie uruchamia `/review`, nie zleca review innemu agentowi, nie wykonuje PR review i nie robi drugiego pełnego przebiegu kodu w celu „upewnienia się”. Review może nastąpić wyłącznie jako osobne, jawne zadanie zlecone przez Wizjonera lub Architekta.

## Raport po IMPLEMENT

Domyślny raport ma wyłącznie postać:

```text
SUMMARY DLA ARCHITEKTA

WYKONANO

- ...

ZMIENIONE PLIKI

- ...

BLOKADY / ODSTĘPSTWA

- brak
```

Sekcję `BLOKADY / ODSTĘPSTWA` rozwija się tylko wtedy, gdy rzeczywiście wystąpiła blokada albo wymaganej polityki nie można było ustanowić technicznie. Raport nie zawiera next steps, propozycji dalszych prac, opisu PR, instrukcji merge ani sugestii testów lub review.

## Dowody i walidacja

Każdy raport rozróżnia trzy niezależne poziomy dowodu:

1. **automated unit/contract** — izolowane invariants i kontrakty;
2. **production-path smoke/integration** — rzeczywista kompozycja i production seam;
3. **hardware/perceptual QA** — obraz, dźwięk, WebXR, komfort i zachowanie urządzenia ocenione przez Wizjonera na docelowym sprzęcie.

**Automated PASS nie oznacza perceptual/hardware PASS; zachowanie zależne od obrazu, dźwięku, WebXR lub urządzenia wymaga osobnej weryfikacji przez Wizjonera na docelowym sprzęcie.**

Jeżeli Wizjoner lub Architekt jawnie zleci walidację naprawy błędu, właściwym dowodem jest test regresyjny RED → GREEN odtwarzający rzeczywisty production path: test musi failować przed poprawką, a mock, ręczny event ani fixture nie mogą zastępować lub omijać warunku, który spowodował bug.

Regex i string-contract mogą uzupełniać ochronę, ale nie zastępują production-path testu. Status `HARDWARE VALIDATED` wolno przypisać wyłącznie konkretnemu zachowaniu jawnie potwierdzonemu przez Wizjonera; nie propaguje się go na sąsiednie etapy ani walory percepcyjne.

## Synchronizacja dokumentacji

- Canonical CURRENT docs opisują teraźniejszy kontrakt; timestamped audits i snapshots zachowują historię.
- Zmiana runtime wymaga synchronizacji właściwego modelu, indeksów i handoffu.
- Nie wolno używać planu, mocka ani historycznego audytu jako dowodu bieżącej implementacji.
