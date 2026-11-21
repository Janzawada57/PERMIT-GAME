# 📋 GDZIE JEST PERMIT?!

Śmieszna apka dla ekipy na **FW Wałcz**, żeby nikt już nie pytał „kto ma permit do WTG12?”.

- 🅿️ **Plac z autami** – dodajesz auto (numer, ksywka, kolor), klikasz je i zaznaczasz, permity których turbin w nim leżą.
- 🌀 **Turbiny** (21 szt. – WTG01…WTG27) – klikasz turbinę i wskazujesz, gdzie jest jej permit: auto, kontener/biuro, na turbinie, u kierownika.
- 🔍 **Szukajka** – wpisz `WTG12`, `98314`, `797` albo nr permitu → apka podświetli, gdzie to jest.
- 😱 **Przycisk paniki** – lista „co gdzie jest” + słowa otuchy.
- 📜 **Kronika** – kto, co i kiedy przeniósł.
- 👷 **Podpis** – przy wejściu każdy podaje imię/ksywę; każdy permit pokazuje, kto i kiedy (dzień + godzina) go przypisał.
- 🗺️ **Mapa farmy** (4 sektory, współrzędne turbin UTM 33N) – zielone turbiny mają wpisany permit. Przycisk **🧭 Nawiguj** prowadzi do turbiny w Google Maps.
- 📱 Na telefonie: „Dodaj do ekranu głównego” → działa jak aplikacja.
- 🔊 Klakson przy zapisie (można wyciszyć).

Działa w przeglądarce na telefonie i komputerze, bez instalowania czegokolwiek.

---

## 🔌 Wspólna baza

✅ **Już podpięta:** Firebase projekt `permit-game-walcz` (Belgia, europe-west1), adres w `config.js`. Poniżej instrukcja, gdyby trzeba było założyć nową.

### Jak założyć od zera (5 minut, za darmo)

GitHub Pages hostuje tylko stronę, więc wpisy muszą gdzieś być zapisywane wspólnie. Używamy darmowej **Firebase Realtime Database**.
Bez tego apka działa w **trybie lokalnym** (każdy telefon widzi tylko swoje wpisy).

1. Wejdź na <https://console.firebase.google.com> → **Utwórz projekt** (np. `gdzie-jest-permit`, Google Analytics możesz wyłączyć).
2. W menu: **Build → Realtime Database → Utwórz bazę danych** → lokalizacja **Europe (europe-west1)** → **Rozpocznij w trybie zablokowanym**.
3. Zakładka **Reguły** → wklej i opublikuj:
   ```json
   {
     "rules": {
       "permitApp": {
         ".read": true,
         "cars":    { "$id": { ".write": true } },
         "permits": { "$t":  { ".write": "$t.matches(/^WTG[0-9]{2}$/)" } },
         "log":     { "$id": { ".write": true } }
       }
     }
   }
   ```
4. Skopiuj adres bazy z góry zakładki **Dane**, np.
   `https://gdzie-jest-permit-default-rtdb.europe-west1.firebasedatabase.app`
5. Wklej go do pliku **`config.js`** w tym repo (edycja ołówkiem na GitHubie → Commit). Od tej chwili każdy, kto otworzy link, jest w tej samej bazie.

   *Alternatywa bez edycji repo:* w apce kliknij ⚙️ → wklej adres → „Kopiuj link dla ekipy” i wyślij link na grupę.

> ⚠️ Każdy, kto ma link, może edytować wpisy – to tablica do zaznaczania, nie system dokumentów. Nie wpisuj tu danych osobowych ani treści permitów, tylko „gdzie leży papier”.

## 🔒 Trackunit

Integracja z Trackunit została **usunięta** (21.11.2026). W repozytorium nie ma i nigdy nie było żadnych danych logowania do Trackunit.

## Pliki

| Plik | Co robi |
|---|---|
| `index.html` | cała aplikacja |
| `config.js` | adres wspólnej bazy |
| `manifest.webmanifest`, `icon-*.png` | ikona i tryb aplikacji na telefonie |
| `.nojekyll` | żeby GitHub Pages nic nie kombinował |
