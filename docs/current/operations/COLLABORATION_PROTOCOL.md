# Canonical Collaboration Protocol

Status: **CURRENT / NORMATIVE**. Kod runtime rozstrzyga status **IMPLEMENTED**; decyzje Wizjonera rozstrzygają kanon produktu, progresji, komunikacji i hardware validation.

## Dowody i walidacja

Każdy raport rozróżnia trzy niezależne poziomy dowodu:

1. **automated unit/contract** — izolowane invariants i kontrakty;
2. **production-path smoke/integration** — rzeczywista kompozycja i production seam;
3. **hardware/perceptual QA** — obraz, dźwięk, WebXR, komfort i zachowanie urządzenia ocenione przez Wizjonera na docelowym sprzęcie.

**Automated PASS nie oznacza perceptual/hardware PASS; zachowanie zależne od obrazu, dźwięku, WebXR lub urządzenia wymaga osobnej weryfikacji przez Wizjonera na docelowym sprzęcie.**

**Każda naprawa błędu wymaga testu regresyjnego RED → GREEN odtwarzającego rzeczywisty production path: test musi failować przed poprawką, a mock, ręczny event ani fixture nie mogą zastępować lub omijać warunku, który spowodował bug.**

Regex i string-contract mogą uzupełniać ochronę, ale nie zastępują production-path testu. Status `HARDWARE VALIDATED` wolno przypisać wyłącznie konkretnemu zachowaniu jawnie potwierdzonemu przez Wizjonera; nie propaguje się go na sąsiednie etapy ani walory percepcyjne.

## Synchronizacja dokumentacji

- Canonical CURRENT docs opisują teraźniejszy kontrakt; timestamped audits i snapshots zachowują historię.
- Zmiana runtime wymaga synchronizacji właściwego modelu, indeksów i handoffu.
- Nie wolno używać planu, mocka ani historycznego audytu jako dowodu bieżącej implementacji.
