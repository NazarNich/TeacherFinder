# Teacher Finder · ZS1

Wyszukiwarka planowych zajęć nauczycieli, sal i klas na podstawie publicznie opublikowanych planów ZS1.

## Funkcje

- wyszukiwanie po kodzie nauczyciela, sali i oddziale;
- widok wyników z dniem, numerem lekcji, godziną, przedmiotem, salą, klasą i grupą (jeśli dotyczy);
- automatyczne wykrywanie oddziałów.
- pobieranie zmian z [oficjalnej strony ZS1](https://www.zs-1.edu.pl/index.php/plan-lekcji/zmiany-do-planu);
- wyświetlanie zastępstw i odwołań tylko w dniu wskazanym w zmianie, bez modyfikowania oryginalnych lekcji.

Importer zapisuje podstawowy plan w `lessons`, a ogłoszenia ze zmianami osobno w `changes`. Zachowuje oryginalny tekst każdego ogłoszenia; lekcje z zastępstwem są pokazywane jako skreślony plan i oznaczona zamiana, a odwołane lekcje jako skreślony plan bez nowego wpisu. Ogłoszenie o zwolnieniu do domu jest wyświetlane osobno jako zwykły tekst, bez przekreślenia; samo przekreślenie dotyczy tylko odwołanych lekcji. W widoku nauczyciela zastępstwo pokazuje aktualnego nauczyciela i salę bez nowego przedmiotu, a anulowane zajęcia nie są liczone jako jego obecність. W widoku sali zastępstwo pokazuje zarówno planowanego, jak i aktualnego nauczyciela; widok klasy zachowuje pełne informacje o zmianie. Zmiany dotyczące konkretnej grupy są stosowane wyłącznie do pasującej grupy. Synchronizacja obu źródeł odbywa się przez `python scripts/import_plans.py`.

W interfejsie nauczyciele z ogłoszeń są wyświetlani jako kody z `TEACHER_CODE_BY_SURNAME` w `app.js`, a nie nazwiskami ze strony zmian. Ogłoszenia zapisane jako inicjał imienia i nazwisko są dopasowywane przy użyciu inicjału; osoby o tym samym nazwisku są rozróżniane. Oryginalny tekst ogłoszenia pozostaje w zapisanych danych, ale nie jest wyświetlany użytkownikom.

Wyszukiwanie zastępstwa po kodzie korzysta z katalogu nauczycieli; jeśli nazwiska lub skrótu nie ma w katalogu, wyszukiwanie po kodzie może nie znaleźć zastępstwa.

W wyszukiwaniu nauczyciela pierwotny nauczyciel zastępowanej lekcji jest oznaczany jako nieobecny, a wyszukanie kodu zastępcy pokazuje jego zastępstwo. Gdy zmienia się tylko sala, widok nauczyciela pokazuje bieżącą salę.

Wyniki widoku nauczyciela pokazują kody nauczycieli, nie nazwiska ze strony ogłoszeń; tekst ogłoszenia nie jest wyświetlany.

Wyniki można przełączyć z listy na tygodniową tabelę: wiersze pokazują numer i godzinę lekcji, a kolumny dni tygodnia. Zmiany z bieżącego tygodnia pojawiają się w dniu wskazanym w ogłoszeniu, również przed jego nadejściem. W widoku klasy zastępstwo jest wyróżnione bursztynowym kolorem, a podpowiedź pokazuje pierwotny plan; odwołane lekcje pozostają przekreślone. W widoku nauczyciela przekreślone są nieobecności, zaś zmiany sal pokazują bieżącą salę; w widoku sali aktualna obsada jest wyróżniona bursztynowym kolorem, a podpowiedź informuje o zastępstwie lub zmianie sali, bez pokazywania pierwotnego planu klasy.

W wynikach sali przeniesione zajęcia pojawiają się tylko w aktualnej sali. Podpowiedź pokazuje nauczyciela, który jest teraz w sali, oraz informuje, czy zastąpił planowego nauczyciela w tej sali, czy sala była wolna.

Surowy tekst ogłoszeń pozostaje zapisany w danych, ale nie jest wyświetlany. Nazwiska zastępców są zamieniane na kody z katalogu; gdy kodu nie da się ustalić, interfejs nie pokazuje nazwiska.

## Publikacja w GitHub Pages

GitHub Pages udostępnia aplikację jako statyczną stronę. Po jednorazowym włączeniu publikacji użytkownikom wystarczy otworzyć udostępniony adres — nie trzeba instalować ani uruchamiać projektu lokalnie. W repozytorium otwórz **Settings → Pages**, wybierz publikację z domyślnej gałęzi (np. `main`) i folderu `/(root)`. Pliki `index.html`, `app.js`, `styles.css` i `data/lessons.json` muszą pozostać w repozytorium pod tymi ścieżkami.

Strona korzysta z opublikowanego pliku `data/lessons.json`. W niedzielę o 20:00 czasu warszawskiego GitHub Actions pobiera plan na nadchodzący tydzień i rozpoczyna nowy zestaw zmian. Od poniedziałku do piątku o 20:00 pobierane są kolejne ogłoszenia; zmiany z wcześniejszych dni bieżącego tygodnia pozostają zapisane. W następną niedzielę poprzedni zestaw jest zastępowany nowym. Etykieta na stronie pokazuje czas ostatniej synchronizacji, a nie datę obowiązywania rozkładu. Odwiedzający niczego nie uruchamiają. Otwieranie przez `file://` nie jest obsługiwane, ponieważ przeglądarka blokuje pobieranie JSON — do lokalnego testowania potrzebny jest serwer WWW.
