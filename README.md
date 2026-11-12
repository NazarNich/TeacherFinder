# Teacher Finder · ZS1

Wyszukiwarka planowych zajęć nauczycieli, sal i klas na podstawie publicznie opublikowanych planów ZS1.

## Funkcje

- wyszukiwanie po kodzie nauczyciela, sali i oddziale;
- widok wyników z dniem, numerem lekcji, godziną, przedmiotem, salą i klasą;
- automatyczne wykrywanie oddziałów z `lista.html`;
- cotygodniowa aktualizacja przez GitHub Actions;
- bezpieczna publikacja danych: niekompletny import nie nadpisuje poprzedniej bazy.

## Uruchomienie lokalne

Wymagany Python 3.10+.

```bash
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
python scripts/import_plans.py
```

Otwórz stronę przez lokalny serwer HTTP (nie przez `file://`):

```bash
python -m http.server 8000
```

Następnie przejdź do `http://localhost:8000`.

## Publikacja i automatyczna aktualizacja

1. Utwórz repozytorium na GitHubie i wgraj wszystkie pliki z tego folderu.
2. W ustawieniach repozytorium włącz **Settings → Pages → Deploy from a branch → main → /(root)**.
3. W **Actions** włącz workflows, jeśli GitHub o to poprosi.
4. Uruchom ręcznie workflow **Aktualizuj plany lekcji** przez `Actions → Aktualizuj plany lekcji → Run workflow`.
5. Po poprawnym imporcie plik `data/lessons.json` zostanie zapisany w repozytorium, a strona zacznie pokazywać dane.

Workflow uruchamia się także w każdą niedzielę o 20:17 w strefie `Europe/Warsaw`. GitHub może opóźnić start zaplanowanego zadania.

## Ważne ograniczenia / weryfikacja

- Parser jest przygotowany pod strukturę tabeli Optivum widoczną na planie 4B, ale przed udostępnieniem uczniom trzeba wykonać pierwszą synchronizację i sprawdzić logi Actions.
- Jeśli szkoła zmieni układ HTML, importer przerwie pracę i zachowa poprzedni plik JSON.
- Podział na grupy `1/2` i `2/2` jest przechowywany jako osobny wpis.
- Kod nauczyciela nie jest automatycznie mapowany na imię i nazwisko. Do tego potrzebna byłaby oficjalna, udostępniona lista mapowania.
- Wyniki pokazują plan opublikowany przez szkołę. Nie potwierdzają, że nauczyciel faktycznie znajduje się w danej sali (zastępstwa, nieobecności i zmiany mogą nie być uwzględnione).

## Źródło

`https://zs-1.edu.pl/plany/uczniowie/`

Proszę używać importera z umiarkowaną częstotliwością (raz w tygodniu) i nie obciążać szkolnej witryny wieloma równoległymi żądaniami.
