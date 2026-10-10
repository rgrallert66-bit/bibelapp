# Wie Rooted lernt – die wissenschaftliche Grundlage

Rooted soll sich wie eine Reihe kleiner Erfolge anfühlen, aber die tatsächliche Gedächtnisleistung darf dabei
nie zugunsten billiger Belohnungen geopfert werden. Jede Mechanik der App ist deshalb einer gut belegten
Lernmethode zugeordnet.

## 1. Abrufen statt Wiederlesen (Testing-Effekt)

Wer Information aktiv aus dem Gedächtnis holt, behält sie deutlich länger als jemand, der sie erneut liest
(Roediger & Karpicke, 2006; Karpicke & Roediger, 2008). Dunlosky et al. (2013) bewerten „Practice Testing“
als eine der beiden Lerntechniken mit dem höchsten Nutzen.

**In Rooted:** Der Kern jeder Einheit ist der *Anfangsbuchstaben-Modus*. Für jedes Wort tippt man nur den
ersten Buchstaben – das Wort selbst muss aus dem Gedächtnis kommen. Das ist schnell (ein Fingertipp pro Wort,
ideal für kurze Aufmerksamkeitsspannen), aber es ist echter Abruf und kein Wiedererkennen.

## 2. Hilfen, die verschwinden (Vanishing Cues / Fading)

Die Methode der verschwindenden Hinweise (Glisky, Schacter & Tulving, 1986) reduziert Unterstützung schrittweise,
bis die Erinnerung allein trägt. Fehlerarmes Lernen am Anfang verhindert, dass sich falsche Versionen einprägen.

**In Rooted:** Ein neuer Vers durchläuft eine Leiter mit abnehmender Hilfe:

| Stufe | Übung | Hilfe |
|---|---|---|
| Entdecken | Vers entfaltet sich Satzteil für Satzteil, Kernaussage, optional Vorlesen | volle Hilfe |
| Bauen | Satzteile/Wörter in die richtige Reihenfolge tippen | Wiedererkennen + Sequenz |
| Ergänzen | Lücken der wichtigsten Inhaltswörter füllen (bei längeren Versen) | Auswahl aus 3 |
| Tippen | Anfangsbuchstaben, ~50 % der Wörter als blasse Hinweise | teilweise |
| Abrufen | Anfangsbuchstaben, keine Hinweise | keine |

Bei einem Fehler erscheint zuerst nur der Anfangsbuchstabe als Hinweis (abgestufte Hilfe), erst beim zweiten
Fehler wird das Wort aufgedeckt. Das hält die „wünschenswerte Schwierigkeit“ (Bjork, 1994) im produktiven Bereich.

## 3. Generieren statt Konsumieren (Generation Effect)

Selbst erzeugte Inhalte werden besser behalten als gelesene (Slamecka & Graf, 1978). Bauen, Ergänzen und
Tippen verlangen alle, dass der Lernende etwas *produziert*.

## 4. Laut sprechen (Production Effect)

Halblautes Mitlesen verbessert das Behalten gegenüber stillem Lesen (MacLeod et al., 2010). Die Entdecken-Stufe
fordert ausdrücklich dazu auf („Lies ihn halblaut mit“) und bietet eine Vorlesefunktion.

## 5. Chunking

Das Arbeitsgedächtnis hält etwa vier Einheiten (Cowan, 2001). Verse werden an Satzzeichen in Phrasen von
2–7 Wörtern zerlegt (`src/lib/text.ts → chunk`); längere Verse werden phrasenweise aufgebaut.

## 6. Verteiltes Wiederholen im optimalen Moment (Spacing + FSRS)

Verteiltes Lernen schlägt massiertes Lernen robust (Cepeda et al., 2006; 2008). Den richtigen Abstand berechnet
Rooted mit **FSRS** (Free Spaced Repetition Scheduler; Ye, Su & Cao, 2022), einem modernen Gedächtnismodell mit
den Größen Schwierigkeit, Stabilität und Abrufwahrscheinlichkeit. Ziel-Behaltensrate: 90 %.

* Die Bewertung (Again/Hard/Good/Easy) wird **nicht** vom Nutzer erfragt, sondern aus der tatsächlichen Leistung
  abgeleitet (Anteil korrekt beim ersten Versuch, Tempo) – ehrlicher und reibungsloser.
* Weil wortgetreuer Text empfindlicher ist als eine Vokabel, startet die Stabilität konservativer, und jeder neue
  Vers kommt am nächsten Tag wieder (Konsolidierung im Schlaf, Diekelmann & Born, 2010).
* Fehlgeschlagener Abruf → der Vers wird noch in derselben Einheit mit Hilfe neu gelernt und erneut abgerufen
  (Successive Relearning, Rawson & Dunlosky, 2011; Feedback nach Tests, Butler & Roediger, 2008).

## 7. Abstand und Mischung innerhalb einer Einheit (Interleaving)

Zwischen dem Studium eines neuen Verses und seinem ersten freien Abruf liegen Wiederholungen anderer Verse.
Das erzeugt eine kurze Verzögerung (der Abruf wird echter) und mischt Inhalte (Kornell & Bjork, 2008).
Gelegentlich wird zusätzlich die *Stelle* abgefragt („Wo steht das?“), damit Text und Adresse verknüpft werden.

## 8. Ausarbeitung (Elaboration)

Jeder Vers hat eine einzeilige Kernaussage in eigenen Worten. Bedeutung ist der stärkste Anker für Erinnerung.

## 9. Motivation ohne Manipulation

Rooted orientiert sich an der Selbstbestimmungstheorie (Ryan & Deci, 2000): **Kompetenz**, **Autonomie**,
**Verbundenheit**.

* **Kompetenz sichtbar machen:** Der Baum zeigt das Gedächtnis selbst. Jeder Vers reift von Knospe → Blüte →
  Frucht → goldener Frucht – genau im Tempo seiner FSRS-Stabilität (3, 21, 90 Tage). Belohnt wird also echtes
  Behalten, nicht Klickzahl.
* **Beständigkeit statt Masse:** Der Baum wächst nur durch *Tage mit erreichtem Tagesziel* („Wurzeln“), nicht durch
  zusätzliche Wiederholungen. Freiwilliges Üben ist möglich, lässt den Baum aber nicht schneller wachsen – es gibt
  keinen Anreiz, endlos weiterzuspielen. Nach der Einheit sagt die App bewusst: *Genug für heute.*
* **Keine Verlustangst:** Es gibt keine Streak, die bricht, und der Baum welkt nie („dessen Laub nicht verwelkt“,
  Ps 1,3). Verpasste Tage pausieren nur das Wachstum. Ein Vers, der eine Wiederholung braucht, wirkt lediglich
  etwas blasser („durstig“).
* **Autonomie:** Tagesziel (3/5/10 Min) und die nächsten Verse wählt der Nutzer selbst.
* **Gewohnheit verankern:** Nach der ersten Einheit wird ein fester Moment gewählt („Nach dem Aufstehen“ …) –
  eine Implementation Intention (Gollwitzer, 1999). Gewohnheiten brauchen im Mittel rund 66 Tage (Lally et al., 2010);
  genau dort liegt ein Meilenstein („Goldene Wurzeln“).
* **Überraschungen mit Bedeutung:** Meilensteine (Vogel, Glühwürmchen, Blütenzeit, Schmetterlinge, eine Laterne
  nach Ps 119,105 …) sind vorher angekündigt („Noch 2 Tage bis zur nächsten Überraschung“), also Vorfreude statt
  Glücksspiel-Mechanik.
* **Flow:** Sofortiges Feedback auf jeden Tastendruck, eine aufsteigende pentatonische Melodie bei Treffer-Serien
  und ein Flow-Zähler halten die Aufmerksamkeit im Moment (Csikszentmihalyi, 1990).

## Literatur

* Bjork, R. A. (1994). Memory and metamemory considerations in the training of human beings. In J. Metcalfe & A. Shimamura (Eds.), *Metacognition*. MIT Press.
* Butler, A. C., & Roediger, H. L. (2008). Feedback enhances the positive effects and reduces the negative effects of multiple-choice testing. *Memory & Cognition, 36*(3), 604–616.
* Cepeda, N. J., Pashler, H., Vul, E., Wixted, J. T., & Rohrer, D. (2006). Distributed practice in verbal recall tasks. *Psychological Bulletin, 132*(3), 354–380.
* Cepeda, N. J., Vul, E., Rohrer, D., Wixted, J. T., & Pashler, H. (2008). Spacing effects in learning: A temporal ridgeline of optimal retention. *Psychological Science, 19*(11), 1095–1102.
* Cowan, N. (2001). The magical number 4 in short-term memory. *Behavioral and Brain Sciences, 24*(1), 87–114.
* Csikszentmihalyi, M. (1990). *Flow: The Psychology of Optimal Experience.* Harper & Row.
* Diekelmann, S., & Born, J. (2010). The memory function of sleep. *Nature Reviews Neuroscience, 11*, 114–126.
* Dunlosky, J., Rawson, K. A., Marsh, E. J., Nathan, M. J., & Willingham, D. T. (2013). Improving students’ learning with effective learning techniques. *Psychological Science in the Public Interest, 14*(1), 4–58.
* Glisky, E. L., Schacter, D. L., & Tulving, E. (1986). Learning and retention of computer-related vocabulary in memory-impaired patients: Method of vanishing cues. *Journal of Clinical and Experimental Neuropsychology, 8*(3), 292–312.
* Gollwitzer, P. M. (1999). Implementation intentions: Strong effects of simple plans. *American Psychologist, 54*(7), 493–503.
* Karpicke, J. D., & Roediger, H. L. (2008). The critical importance of retrieval for learning. *Science, 319*(5865), 966–968.
* Kornell, N., & Bjork, R. A. (2008). Learning concepts and categories: Is spacing the “enemy of induction”? *Psychological Science, 19*(6), 585–592.
* Lally, P., van Jaarsveld, C. H. M., Potts, H. W. W., & Wardle, J. (2010). How are habits formed: Modelling habit formation in the real world. *European Journal of Social Psychology, 40*(6), 998–1009.
* MacLeod, C. M., Gopie, N., Hourihan, K. L., Neary, K. R., & Ozubko, J. D. (2010). The production effect: Delineation of a phenomenon. *Journal of Experimental Psychology: Learning, Memory, and Cognition, 36*(3), 671–685.
* Rawson, K. A., & Dunlosky, J. (2011). Optimizing schedules of retrieval practice for durable and efficient learning. *Journal of Experimental Psychology: General, 140*(3), 283–302.
* Roediger, H. L., & Karpicke, J. D. (2006). Test-enhanced learning: Taking memory tests improves long-term retention. *Psychological Science, 17*(3), 249–255.
* Ryan, R. M., & Deci, E. L. (2000). Self-determination theory and the facilitation of intrinsic motivation, social development, and well-being. *American Psychologist, 55*(1), 68–78.
* Slamecka, N. J., & Graf, P. (1978). The generation effect: Delineation of a phenomenon. *Journal of Experimental Psychology: Human Learning and Memory, 4*(6), 592–604.
* Ye, J., Su, J., & Cao, Y. (2022). A stochastic shortest path algorithm for optimizing spaced repetition scheduling. *Proceedings of KDD ’22*, 4381–4390.
