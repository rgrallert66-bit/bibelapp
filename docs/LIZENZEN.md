# Bibeltexte, Rechte und Prüfstatus

## Übersetzungen

| Sprache | Übersetzung | Rechteinhaber |
|---|---|---|
| Deutsch | Elberfelder Bibel 2006 (revidierte Fassung, aktueller Textstand von SCM R.Brockhaus) | SCM R.Brockhaus in der SCM Verlagsgruppe GmbH, Witten/Holzgerlingen |
| Englisch | New King James Version (NKJV) | Thomas Nelson / HarperCollins Christian Publishing |

Beide Übersetzungen sind urheberrechtlich geschützt. **Für eine öffentliche Veröffentlichung der App ist vorher
eine schriftliche Genehmigung bzw. Lizenz beider Verlage nötig.**

* **NKJV:** HarperCollins Christian Publishing erlaubt laut seiner Permissions-Seite das Zitieren ohne Anfrage nur
  in engen Grenzen (derzeit bis 500 Verse insgesamt, weitere Bedingungen) und verlangt eine Genehmigung, wenn man
  „ein Produkt entwickelt“, das Texte verwendet. Eine App ist ein solches Produkt → Anfrage über
  https://www.harpercollinschristian.com/permissions/ (Bearbeitungszeit laut Verlag ca. 6–8 Wochen).
* **Elberfelder 2006:** Konkrete Freigrenzen für Apps sind öffentlich nicht eindeutig dokumentiert → direkt bei
  SCM R.Brockhaus anfragen. Bis dahin ist der Copyright-Hinweis in der App unter *Ich → Rechte & Quellen* hinterlegt.

Die App enthält bewusst nur eine kleine Auswahl (39 Verse pro Sprache), also deutlich unter den üblichen
Zitatgrenzen, und zeigt die Copyright-Hinweise der Verlage an.

Alternativ lassen sich lizenzierte Texte zur Laufzeit über eine lizenzierte Schnittstelle laden (z. B. API.Bible
für Übersetzungen, für die dort eine Lizenz besteht); die Datenstruktur in `src/data/verses.ts` ist dafür vorbereitet.

## Wortgetreue Wiedergabe – Prüfstatus

Jeder Vers in `src/data/verses.ts` hat ein Feld `checked`:

* `source` – Wortlaut wurde mit einer veröffentlichten Elberfelder-2006-Wiedergabe abgeglichen
  (aktuell: Josua 1,9 und Johannes 15,5).
* `pending` – sorgfältig übertragen, **muss vor der Veröffentlichung noch gegen die lizenzierte Druck- oder
  Digitalausgabe geprüft werden.** Das gilt besonders für Zeichensetzung und Kleinigkeiten wie
  „Leuchte meinem Fuß“ (Ps 119,105) oder die Kommasetzung in Ps 1,3.

Die NKJV-Texte folgen dem Standardtext (Großschreibung der Zeilenanfänge in poetischen Büchern, „LORD“ in
Kapitälchen-Schreibung als Großbuchstaben); auch sie sind vor einer Veröffentlichung mit der lizenzierten Ausgabe
abzugleichen.

Aus diesem Grund kann die Prüfung nicht automatisiert erfolgen: Die Verlagsseiten waren aus der
Entwicklungsumgebung nicht erreichbar, und die Texte dürfen nicht aus nicht-lizenzierten Quellen übernommen werden.
