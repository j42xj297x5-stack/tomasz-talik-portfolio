# KANONICZNY PROTOKÓŁ WSPÓŁPRACY — WIZJONER → ARCHITEKT → CODEX v1.3

Status: **CURRENT / NORMATIVE**. Kod runtime rozstrzyga status **IMPLEMENTED**; decyzje Wizjonera rozstrzygają kanon produktu, progresji, komunikacji i hardware validation.

## Role i odpowiedzialność

Codex jest pojedynczym wykonawcą technicznym patcha w plikach repozytorium. Nie tworzy subagentów, nie deleguje pracy, nie wysyła im poleceń i nie uruchamia automatycznego approval reviewera. Approval reviewerem jest zawsze użytkownik, nigdy `auto_review`.

Codex może:

- czytać pliki w minimalnym zakresie potrzebnym do zadania;
- edytować wyłącznie zakres wskazany przez Wizjonera lub Architekta;
- używać Git w zakresie potrzebnym do przygotowania task branch i task commit po implementacji oraz wymaganej walidacji;
- przekazać lub opublikować zmianę i przygotować Pull Request przez natywny mechanizm Codex Cloud;
- zwrócić Summary.

Codex nie może:

- wykonywać `merge`, `rebase`, `cherry-pick`, `revert`, `reset` lub `clean`;
- zatwierdzać własnej zmiany, scalać PR, publikować/deployować aplikacji ani uruchamiać workflow GitHub;
- wykonywać PR review lub code review bez osobnego, jawnego zadania;
- tworzyć subagentów, delegować pracy ani uruchamiać automatycznego approval reviewera.

Wizjoner pozostaje acceptance ownerem: wykonuje review i podejmuje decyzję o merge. Codex może przygotować delivery, ale nie może zaakceptować ani scalić własnej zmiany.

## Codex Cloud delivery

Dla `IMPLEMENT` Codex jest pojedynczym wykonawcą technicznym. Po zakończeniu poprawnej implementacji i jawnie autoryzowanej walidacji może:

- przygotować branch taska;
- utworzyć commit obejmujący wyłącznie zakres bieżącego zadania, bez obcych lub przypadkowych untracked zmian, z opisem odpowiadającym zadaniu;
- przekazać lub opublikować zmianę przez natywny mechanizm Codex Cloud;
- przygotować Pull Request do canonical base branch wraz z tytułem, opisem, change summary i validation summary.

Canonical delivery contract to:

`CODEX IMPLEMENTS → CODEX COMMITS → CODEX PREPARES PR → USER REVIEWS → USER MERGES`

Codex nie zatwierdza własnej zmiany, nie uruchamia self-review jako bramy publikacji i nie wykonuje merge. `PR READY` oznacza wyłącznie zmianę przygotowaną do review użytkownika, nie zmianę scaloną.

Preferowany jest natywny mechanizm delivery Codex Cloud. Poprawnie skonfigurowany push może być częścią standardowego mechanizmu taska, ale Codex nie musi zawsze wykonywać shellowego `git push` ani `gh pr create`. Brak zwykłego `origin` lub uwierzytelnionego `gh` w shell sandboxie nie jest sam w sobie blokadą, jeśli platforma nadal może wystawić zmianę do GitHub. Codex nie tworzy ani nie podmienia remote, nie dopisuje credentiali, nie obchodzi sandboxu i nie uruchamia własnego mechanizmu uwierzytelnienia.

Jeśli żaden standardowy mechanizm cloud delivery nie jest dostępny, Codex zachowuje working diff lub task commit, dokładną listę plików i status walidacji, a następnie raportuje `DELIVERY BLOCKED` z konkretną przyczyną. Nie odtwarza zmiany, nie rekonfiguruje remote i nie stosuje niebezpiecznych workaroundów.

## Ekonomia wykonania

Domyślny przebieg `IMPLEMENT` to:

`READ MINIMUM → LOCAL EDIT → AUTHORIZED VALIDATION → TASK COMMIT / CLOUD DELIVERY → PR READY → SUMMARY → STOP`

Nie jest nim autonomiczna pętla:

`READ → IMPLEMENT → TEST → REVIEW → FIX REVIEW → RETRY`

`READ` i `AUDIT` pozostają osobnymi trybami i bez zapisywanego artefaktu nie tworzą automatycznie commitów ani PR. Jawnie wymagany artefakt audytu może być dostarczony jak zwykły task PR. `REVIEW` pozostaje osobnym zadaniem wykonywanym tylko na jawne polecenie. Codex nie uruchamia dodatkowego agenta ani dodatkowego przebiegu tylko po to, aby potwierdzić własną pracę.

Pierwszeństwo instrukcji jest następujące:

`EXPLICIT CURRENT-TASK INSTRUCTION > CANONICAL PROJECT PROTOCOL > PROJECT CODEX DEFAULTS`

Prompt bieżącego zadania może jawnie wymagać `NO COMMIT`, ale bez takiego wyjątku ukończony `IMPLEMENT` może zakończyć się standardowym cloud delivery i PR. Prompty nie powinny rutynowo powtarzać boilerplate `NO COMMIT / NO PUSH / NO PR`.

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

Sekcję `BLOKADY / ODSTĘPSTWA` rozwija się tylko wtedy, gdy rzeczywiście wystąpiła blokada albo wymaganej polityki nie można było ustanowić technicznie. Raport może zawierać status brancha, task commitu i PR oraz wykonane walidacje, ale nie instrukcję automatycznego merge ani sugestię self-review.

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
