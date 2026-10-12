# 🎨 Portfolio AI — szablon dla ucznia

Gotowa strona do prezentowania prac z kursu sztucznej inteligencji: grafiki, teksty, muzyka, filmy, komiksy, gry, strony WWW, projekty techniczne i prezentacje.

**Nie musisz pisać kodu**, aby dodać pracę. Wystarczy przesłać pliki do odpowiedniego folderu GitHub. Strona automatycznie pokaże je po zakończeniu publikowania.

## 🚀 Uruchom własne portfolio

1. Otwórz repozytorium nauczyciela i kliknij **Use this template → Create a new repository**.
2. Wybierz **Public**, wpisz nazwę, np. `moje-portfolio-ai`, i kliknij **Create repository**.
3. W swoim repozytorium wybierz **Settings → Pages**.
4. W **Build and deployment → Source** ustaw **GitHub Actions**.
5. Otwórz **Actions**, wybierz **Opublikuj portfolio AI** i w razie potrzeby **Run workflow → Run workflow**. Jeśli GitHub poprosi o włączenie workflows, potwierdź.
6. Poczekaj na zielony znacznik i wejdź w **Settings → Pages → Visit site**.

> Pierwszy automatyczny proces może uruchomić się, zanim włączysz Pages. Jeśli zobaczysz czerwony znaczek, najpierw ustaw Source = GitHub Actions, a potem użyj **Run workflow**.

**Adres strony:** `https://TWOJ-LOGIN.github.io/NAZWA-REPOZYTORIUM/`

## 🖼️ Dodaj pierwszą pracę

1. Otwórz zakładkę **Code** swojego repozytorium.
2. Wejdź do folderu np. `materialy/grafiki/`.
3. Kliknij **Add file → Upload files** i prześlij `moj-obraz.png`.
4. Kliknij **Commit changes**.
5. Poczekaj na zielony wynik w **Actions** i odśwież swoje portfolio.

**Zasada:** każdy plik leżący bezpośrednio w folderze kategorii to **osobny projekt**. Każdy podfolder w kategorii to **jeden projekt zawierający wiele plików**.

Przykład:

```text
materialy/
  grafiki/
    plakat.png                    ← osobny projekt
    logo.jpg                      ← osobny projekt
  komiksy/
    podroz-na-marsa/              ← jeden projekt
      okladka.png
      strona-01.png
      strona-02.png
      komiks.pdf
```

## 📁 Gdzie dodawać materiały?

| Folder | Kategoria |
| --- | --- |
| `materialy/grafiki/` | Grafiki |
| `materialy/teksty/` | Teksty |
| `materialy/dzwiek/` | Dźwięk i muzyka |
| `materialy/filmy/` | Filmy i animacje |
| `materialy/komiksy/` | Komiksy |
| `materialy/strony-www/` | Strony i aplikacje WWW |
| `materialy/gry/` | Gry |
| `materialy/techniczne-3d/` | Projekty techniczne i 3D |
| `materialy/analizy-prezentacje/` | Analizy i prezentacje |

Plik można obejrzeć albo pobrać z portfolio. Większe filmy lepiej umieścić na zewnętrznej platformie i podać link w opisie projektu.

## ✍️ Dodaj tytuł, opis, narzędzia i prompt

Wejdź na swoją stronę pod adres `.../generator/`.

- **Pojedynczy plik:** wpisz ścieżkę np. `materialy/grafiki/plakat.png`. Generator pobierze plik `plakat.png.json`, który przesyłasz **obok** `plakat.png`.
- **Projekt w podfolderze:** wpisz np. `materialy/komiksy/podroz-na-marsa`. Generator pobierze `projekt.json`; prześlij go do folderu tego projektu.
- **Twój profil:** wybierz opcję edycji profilu. Pobierz `profil.json`, następnie w repozytorium zastąp istniejący plik w katalogu głównym.

Generator nie publikuje plików sam. Po pobraniu danych musisz dodać je do repozytorium i kliknąć **Commit changes**.

## 🔧 Gdy coś nie działa

- **Nie widać nowej pracy?** Sprawdź, czy plik jest w prawidłowym folderze, zatwierdzono **Commit changes**, a **Actions** zakończył się na zielono.
- **Błąd publikowania?** W **Settings → Pages** sprawdź, czy **Source = GitHub Actions**.
- **Folder zniknął?** GitHub nie przechowuje pustych folderów; w szablonie są pliki `.gitkeep`, które można zostawić.
- **Nie widać opisu?** Sprawdź nazwę pliku `nazwa.ext.json` albo `projekt.json`.
- **Nie widać zdjęcia profilowego?** Dodaj je do repozytorium i podaj ścieżkę do pliku.

## 🔐 Pamiętaj

Repozytorium i portfolio są **publiczne**. Nie przesyłaj haseł, prywatnych dokumentów, danych osobowych innych osób ani zdjęć bez odpowiednich zgód. Nie usuwaj plików `.github/workflows/pages.yml`, `.nojekyll` i `skrypty/buduj.py` — odpowiadają za automatyczne publikowanie.

**Dla nauczyciela:** w repozytorium wzorcowym zaznacz **Settings → General → Template repository**. Każdy uczeń tworzy swoją niezależną kopię. Dalsze zmiany w szablonie nie aktualizują automatycznie istniejących kopii.
