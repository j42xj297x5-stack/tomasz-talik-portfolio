# KANONICZNY PROTOKÓŁ WSPÓŁPRACY — WIZJONER → ARCHITEKT → CODEX v1.4

Status: **CURRENT / NORMATIVE**. Kod runtime rozstrzyga status **IMPLEMENTED**; decyzje Wizjonera rozstrzygają kanon produktu, progresji, komunikacji i hardware validation.

## Role i odpowiedzialność

Codex jest pojedynczym wykonawcą technicznym patcha w plikach repozytorium. Nie tworzy subagentów, nie deleguje pracy, nie wysyła im poleceń i nie uruchamia automatycznego approval reviewera. Approval reviewerem jest zawsze użytkownik, nigdy `auto_review`.

Codex może:

- czytać pliki w minimalnym zakresie potrzebnym do zadania;
- edytować wyłącznie zakres wskazany przez Wizjonera lub Architekta;
- używać read-only Git w zakresie potrzebnym do pracy;
- utworzyć jeden task commit dla ukończonego zadania `IMPLEMENT`, obejmujący wyłącznie zakres zadania;
- pozostawić czysty working tree po task commicie;
- zwrócić Summary.

Codex nie może:

- wykonywać `merge`, `rebase`, `cherry-pick`, `revert`, `reset` lub `clean`;
- wykonywać `git push` ani rekonfigurować remote lub dodawać credentiali;
- wykonywać `gh pr create`, `gh pr edit`, `gh pr ready`, `gh pr review`, `gh pr merge`, `gh pr close` lub `gh pr reopen`;
- uruchamiać `make_pr`, `/opt/codex/mcp/make_pr.py` ani lokalnego serwera MCP w celu utworzenia Pull Requesta;
- instalować zależności, otwierać sieci lub proxy albo szukać shellowego lub MCP fallbacku w celu utworzenia Pull Requesta;
- zatwierdzać własnej zmiany, scalać PR, publikować/deployować aplikacji ani uruchamiać workflow GitHub;
- wykonywać PR review lub code review bez osobnego, jawnego zadania;
- tworzyć subagentów, delegować pracy ani uruchamiać automatycznego approval reviewera.

Wizjoner pozostaje wyłącznym właścicielem PR delivery i acceptance: publikuje lub pushuje zmianę z interfejsu Codex Cloud / GitHub, tworzy Pull Request, wykonuje review, podejmuje decyzję o merge i odpowiada za finalną publikację. Codex kończy pracę po task commicie i Summary.

## Granice delivery

Delivery ma dwie rozłączne granice odpowiedzialności:

1. **LOCAL TASK DELIVERY — właściciel Codex:** minimalny odczyt, lokalna edycja, wyłącznie jawnie autoryzowana walidacja, jeden task commit i Summary.
2. **PR DELIVERY / ACCEPTANCE — właściciel Użytkownik / Wizjoner:** publikacja lub push z interfejsu, utworzenie Pull Requesta, review, decyzja o merge i finalna publikacja.

Canonical `IMPLEMENT` flow to:

`READ MINIMUM → LOCAL EDIT → AUTHORIZED VALIDATION → TASK COMMIT → SUMMARY → STOP`

Nie jest nim:

`READ → EDIT → COMMIT → PUSH → MAKE_PR → PR → REVIEW`

Brak `make_pr`, `gh`, `origin`, sieci, serwera MCP lub innego mechanizmu tworzenia Pull Requesta **nie jest blokadą** zadania `IMPLEMENT`, jeżeli task commit został poprawnie utworzony. Brak PR nie jest odstępstwem. Codex nie traktuje braku `make_pr` jako błędu implementacji i nie podejmuje prób naprawy środowiska, instalowania zależności, otwierania sieci lub proxy, rekonfiguracji remote, dodawania credentiali ani poszukiwania fallbacku tylko po to, aby stworzyć Pull Request.

Brak opcjonalnego narzędzia, którego bieżące zadanie jawnie nie wymaga, nie jest blokadą, nie uruchamia fallbacku ani naprawy środowiska i nie jest raportowany w Summary.

## Ekonomia wykonania

Domyślny przebieg `IMPLEMENT` to:

`READ MINIMUM → LOCAL EDIT → AUTHORIZED VALIDATION → TASK COMMIT → SUMMARY → STOP`

Nie jest nim autonomiczna pętla:

`READ → IMPLEMENT → TEST → REVIEW → FIX REVIEW → RETRY`

`READ` i `AUDIT` pozostają osobnymi trybami i bez zapisywanego artefaktu nie tworzą automatycznie commitów. Jawnie wymagany artefakt audytu może być dostarczony jak zwykły task commit. `REVIEW` pozostaje osobnym zadaniem wykonywanym tylko na jawne polecenie. Codex nie uruchamia dodatkowego agenta ani dodatkowego przebiegu tylko po to, aby potwierdzić własną pracę.

Pierwszeństwo instrukcji jest następujące:

`EXPLICIT CURRENT-TASK INSTRUCTION > CANONICAL PROJECT PROTOCOL > PROJECT CODEX DEFAULTS`

Prompt bieżącego zadania może jawnie wymagać `NO COMMIT`, ale bez takiego wyjątku ukończony `IMPLEMENT` kończy się jednym task commitem, Summary i zatrzymaniem pracy Codexa. PR delivery pozostaje poza zakresem Codexa.

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

TASK COMMIT

- `<hash>` — `<message>`

BLOKADY / ODSTĘPSTWA

- brak
```

Sekcję `BLOKADY / ODSTĘPSTWA` rozwija się tylko wtedy, gdy rzeczywiście wystąpiła blokada albo wymaganej polityki nie można było ustanowić technicznie. Raport podaje hash i message task commita. Nie zawiera sekcji `PR STATUS`, `PR READY` ani `DELIVERY BLOCKED`; brak PR nie jest odstępstwem i nie raportuje się braku `make_pr`.

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
