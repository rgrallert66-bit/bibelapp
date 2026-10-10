# Rooted – Gottes Wort. Tief verwurzelt.

Eine mobile Web-App (PWA), mit der junge Menschen Bibelverse spielerisch, mühelos und dauerhaft auswendig lernen.
Jede Einheit dauert wenige Minuten, jede Berührung gibt sofortiges Feedback – und ein lebendiger Baum zeigt,
wie fest Gottes Wort schon im Herzen verwurzelt ist.

> „Er ist wie ein Baum, gepflanzt an Wasserbächen, der seine Frucht bringt zu seiner Zeit …“ – Psalm 1,3

## Das Konzept

**Der Baum ist dein Gedächtnis.**
* **Wurzeln** wachsen mit jedem Tag, an dem du dein Tagesziel erreichst – nicht mit der Zahl der Klicks.
* **Zweige und Krone** entfalten sich Tag für Tag (prozedural und für jeden Nutzer einzigartig).
* **Jeder gelernte Vers hängt im Baum** und reift im Tempo seiner Gedächtnisstabilität:
  Knospe → Blüte → Frucht → goldene Frucht. Antippen zeigt Vers, Gedächtnisstärke und nächste Wiederholung.
* **Meilensteine** (Vogel, Glühwürmchen, Blütenzeit, Schmetterlinge, Laterne, goldene Wurzeln, Nest) werden
  vorher angekündigt. Der Baum welkt nie – keine Streak-Angst.
* Der Himmel folgt der echten Tageszeit (Morgenrot, Tag, Abendrot, Sternennacht), am Fuß des Baumes fließt der Bach.

**Die tägliche Einheit (3–10 Minuten)** mischt Wiederholungen fälliger Verse mit einem neuen Vers, der eine
Leiter mit verschwindender Hilfe hinaufsteigt: *Entdecken → Bauen → Ergänzen → Tippen mit Hinweisen → frei abrufen*.
Kern ist der Anfangsbuchstaben-Modus: ein Tipp pro Wort, jedes richtige Wort erscheint mit Glühen, Partikeln und
dem nächsten Ton einer aufsteigenden Melodie.

Die wissenschaftliche Begründung jeder Mechanik steht in **[docs/WISSENSCHAFT.md](docs/WISSENSCHAFT.md)**.

## Bibeltexte

* Deutsch: **Elberfelder Bibel 2006** (SCM R.Brockhaus)
* Englisch: **New King James Version** (Thomas Nelson)

Beide sind urheberrechtlich geschützt. Die App enthält eine kleine Auswahl von 39 Versen pro Sprache mit
Copyright-Hinweis. **Vor einer öffentlichen Veröffentlichung sind Lizenzen der Verlage einzuholen und die Texte
gegen die lizenzierten Ausgaben zu prüfen** – Details und Prüfstatus jedes Verses: [docs/LIZENZEN.md](docs/LIZENZEN.md).

## Entwicklung

```bash
npm install
npm run dev        # Entwicklungsserver
npm test           # Unit-Tests (FSRS, Sitzungsplanung, Text, Baum)
npm run build      # Produktions-Build nach dist/
npm run preview    # Build lokal ausliefern (http://localhost:4173)
npm run build:single  # alles in einer einzigen HTML-Datei (dist-single/)
```

Technik: React 19, TypeScript, Vite, Motion (Animationen), Web Audio API (alle Klänge werden live synthetisiert),
SVG (Baum), Canvas (Partikel), localStorage (Fortschritt bleibt auf dem Gerät), Service Worker (offline).

### Test- und Demo-Schalter (URL-Parameter)

| Parameter | Wirkung |
|---|---|
| `?reset` | Neustart mit Onboarding |
| `?lang=de` / `?lang=en` | Übersetzung erzwingen |
| `?demo=30` | Demo-Profil mit 30 Wachstumstagen und Versen in allen Reifestufen |
| `?hour=21` | Szene zu einer festen Tageszeit |
| `?day=3` | so tun, als wäre es 3 Tage später (Wiederholungsplanung testen) |

### Automatischer Durchlauf mit Screenshots

```bash
npm run build && npm run preview &
node scripts/qa.mjs --out screenshots            # Onboarding, 2 Lerntage, Bäume, Bibliothek, Profil
node scripts/qa.mjs --out screenshots --mistakes # mit eingestreuten Fehlern
```

## Projektstruktur

```
src/
  data/verses.ts          Verse (ELB 2006 / NKJV), Pfade, Kernaussagen, Prüfstatus
  lib/fsrs.ts             Gedächtnismodell (FSRS-4.5)
  lib/session.ts          Planung der Tageseinheit, Bewertung, Tagesziel
  lib/text.ts             Wörter, Phrasen (Chunking), Hinweis- und Lückenauswahl
  lib/tree.ts             prozeduraler Baum (Äste, Laub, Fruchtplätze, Wurzeln)
  lib/audio.ts            Klangdesign (Web Audio), Haptik, Vorlesen
  components/TreeScene.tsx  Szene mit Himmel, Baum, Bach, Wurzeln, Meilenstein-Leben
  components/exercises/   Entdecken, Bauen, Ergänzen, Tippen/Abrufen, Stelle
  screens/                Onboarding, Baum, Einheit, Abschluss, Verse, Ich, Sheets
```
