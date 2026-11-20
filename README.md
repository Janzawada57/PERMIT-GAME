# 📋 GDZIE JEST PERMIT?!

Śmieszna apka dla ekipy na **FW Wałcz**, żeby nikt już nie pytał „kto ma permit do WTG12?”.

- 🅿️ **Plac z autami** – dodajesz auto (numer, ksywka, kolor), klikasz je i zaznaczasz, permity których turbin w nim leżą.
- 🌀 **Turbiny** (21 szt. – WTG01…WTG27) – klikasz turbinę i wskazujesz, gdzie jest jej permit: auto, kontener/biuro, na turbinie, u kierownika.
- 🔍 **Szukajka** – wpisz `WTG12`, `98314`, `797` albo nr permitu → apka podświetli, gdzie to jest.
- 😱 **Przycisk paniki** – lista „co gdzie jest” + słowa otuchy.
- 📜 **Kronika** – kto, co i kiedy przeniósł.
- 👷 **Podpis** – przy wejściu każdy podaje imię/ksywę; każdy permit pokazuje, kto i kiedy (dzień + godzina) go przypisał.
- 📡 **GPS z Trackunit** – co ~15 min robot pobiera pozycje aut; apka liczy z koordynatów turbin (UTM 33N), przy której turbinie stoi auto („📍 stoi przy WTG12”), pokazuje to na turbinach i na **mapie farmy** (4 sektory). Przycisk **🧭 Nawiguj** prowadzi do turbiny w Google Maps.
- 🏢 **Biuro** – otwórz auto, które stoi przy biurze → „Tu jest biuro”. Auta w promieniu 300 m pokazują „stoi przy biurze”.
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

## 📡 Robot GPS (Trackunit → apka)

Plik `.github/workflows/trackunit.yml` uruchamia co 15 min skrypt `scripts/trackunit-sync.mjs` (darmowe GitHub Actions).
Hasła **nie są w kodzie** – tylko w zaszyfrowanych sekretach repo: **Settings → Secrets and variables → Actions → New repository secret**:

| Sekret | Skąd |
|---|---|
| `TU_CLIENT_ID` | Trackunit Manager → użytkownik API → Identyfikator klienta |
| `TU_CLIENT_SECRET` | … → Klucz tajny klienta |
| `TU_USERNAME` | … → Nazwa użytkownika (TU-API-…) |
| `TU_PASSWORD` | … → Hasło |
| `FIREBASE_SECRET` | Firebase → ⚙️ Project settings → Service accounts → **Database secrets** → Show |

Potem: zakładka **Actions → „Trackunit → pozycje aut” → Run workflow** (pierwsze uruchomienie ręcznie). W logu widać, ile pojazdów zapisano.

🔒 Prywatność: współrzędne publikowane są tylko, gdy pojazd jest w promieniu 15 km od farmy (`FARM_RADIUS_KM`). Poza tym apka pokazuje tylko „🏠 poza farmą”.
Dopasowanie aut: automatycznie po numerze (np. auto „797” ↔ pojazd „Van 797 …” w Trackunit) albo ręcznie w oknie auta → 📡 Trackunit.

ℹ️ WTG11 (99359) nie ma współrzędnych w tabeli – dopisz je w `TCOORD` w `index.html`, jeśli będą.

## Pliki

| Plik | Co robi |
|---|---|
| `index.html` | cała aplikacja |
| `config.js` | adres wspólnej bazy |
| `manifest.webmanifest`, `icon-*.png` | ikona i tryb aplikacji na telefonie |
| `scripts/trackunit-sync.mjs`, `.github/workflows/trackunit.yml` | robot GPS Trackunit |
| `.nojekyll` | żeby GitHub Pages nic nie kombinował |
