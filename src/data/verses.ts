// Curated starter collection.
//
// German:  Elberfelder Bibel 2006 (revidierte Fassung), © 2006 SCM R.Brockhaus, Witten/Holzgerlingen.
// English: New King James Version®, © 1982 Thomas Nelson. Used by permission. All rights reserved.
//
// The set is deliberately small (well below the publishers' gratis quotation limits). Before a public
// release every text must be checked against the licensed edition and written permission obtained for
// use inside an app – see LICENSING.md. `checked` records how each German text was verified so far:
//   'source' – compared against a published ELB 2006 rendering
//   'pending' – transcribed carefully, still needs a final check against the printed edition

export type Lang = 'de' | 'en'

export interface Verse {
  id: string
  path: string
  ref: Record<Lang, string>
  text: Record<Lang, string>
  /** One-line key thought (own words) – supports elaborative encoding. */
  core: Record<Lang, string>
  checked: 'source' | 'pending'
}

export interface Path {
  id: string
  title: Record<Lang, string>
  subtitle: Record<Lang, string>
  hue: number
  icon: 'seed' | 'shield' | 'dove' | 'heart' | 'fruit' | 'lamp' | 'star'
}

export const PATHS: Path[] = [
  { id: 'start', title: { de: 'Erste Schritte', en: 'First Steps' }, subtitle: { de: 'Kurz, stark, unvergesslich', en: 'Short, strong, unforgettable' }, hue: 145, icon: 'seed' },
  { id: 'courage', title: { de: 'Mut', en: 'Courage' }, subtitle: { de: 'Für Tage, an denen es zählt', en: 'For the days that count' }, hue: 32, icon: 'shield' },
  { id: 'peace', title: { de: 'Frieden', en: 'Peace' }, subtitle: { de: 'Ruhe mitten im Lärm', en: 'Rest in the middle of the noise' }, hue: 200, icon: 'dove' },
  { id: 'grace', title: { de: 'Gnade', en: 'Grace' }, subtitle: { de: 'Das Herz des Evangeliums', en: 'The heart of the gospel' }, hue: 340, icon: 'heart' },
  { id: 'fruit', title: { de: 'Frucht', en: 'Fruit' }, subtitle: { de: 'Verwurzelt leben', en: 'Living rooted' }, hue: 95, icon: 'fruit' },
  { id: 'truth', title: { de: 'Wahrheit', en: 'Truth' }, subtitle: { de: 'Licht für den Weg', en: 'Light for the path' }, hue: 48, icon: 'lamp' },
  { id: 'identity', title: { de: 'Identität', en: 'Identity' }, subtitle: { de: 'Wer du in Gottes Augen bist', en: 'Who you are in God’s eyes' }, hue: 265, icon: 'star' },
]

export const VERSES: Verse[] = [
  // ── Erste Schritte ──────────────────────────────────────────────
  {
    id: 'ps23_1', path: 'start', checked: 'pending',
    ref: { de: 'Psalm 23,1', en: 'Psalm 23:1' },
    text: { de: 'Der HERR ist mein Hirte, mir wird nichts mangeln.', en: 'The LORD is my shepherd; I shall not want.' },
    core: { de: 'Wer zu Gott gehört, ist versorgt.', en: 'Belonging to God means being cared for.' },
  },
  {
    id: 'ps119_11', path: 'start', checked: 'pending',
    ref: { de: 'Psalm 119,11', en: 'Psalm 119:11' },
    text: { de: 'In meinem Herzen habe ich dein Wort verwahrt, damit ich nicht gegen dich sündige.', en: 'Your word I have hidden in my heart, That I might not sin against You.' },
    core: { de: 'Genau darum geht es hier: Gottes Wort im Herzen tragen.', en: 'Exactly what you are doing here: keeping God’s word in your heart.' },
  },
  {
    id: 'heb13_8', path: 'start', checked: 'pending',
    ref: { de: 'Hebräer 13,8', en: 'Hebrews 13:8' },
    text: { de: 'Jesus Christus ist derselbe gestern und heute und in Ewigkeit.', en: 'Jesus Christ is the same yesterday, today, and forever.' },
    core: { de: 'Alles ändert sich – er nicht.', en: 'Everything changes – He doesn’t.' },
  },
  {
    id: 'gen1_1', path: 'start', checked: 'pending',
    ref: { de: '1. Mose 1,1', en: 'Genesis 1:1' },
    text: { de: 'Im Anfang schuf Gott die Himmel und die Erde.', en: 'In the beginning God created the heavens and the earth.' },
    core: { de: 'Am Anfang von allem steht Gott.', en: 'At the start of everything stands God.' },
  },
  {
    id: 'jhn3_16', path: 'start', checked: 'pending',
    ref: { de: 'Johannes 3,16', en: 'John 3:16' },
    text: { de: 'Denn so hat Gott die Welt geliebt, dass er seinen eingeborenen Sohn gab, damit jeder, der an ihn glaubt, nicht verloren geht, sondern ewiges Leben hat.', en: 'For God so loved the world that He gave His only begotten Son, that whoever believes in Him should not perish but have everlasting life.' },
    core: { de: 'Die ganze gute Nachricht in einem Satz.', en: 'The whole good news in one sentence.' },
  },
  {
    id: 'jhn1_1', path: 'start', checked: 'pending',
    ref: { de: 'Johannes 1,1', en: 'John 1:1' },
    text: { de: 'Im Anfang war das Wort, und das Wort war bei Gott, und das Wort war Gott.', en: 'In the beginning was the Word, and the Word was with God, and the Word was God.' },
    core: { de: 'Jesus ist Gottes Wort in Person.', en: 'Jesus is God’s Word in person.' },
  },

  // ── Mut ─────────────────────────────────────────────────────────
  {
    id: 'php4_13', path: 'courage', checked: 'pending',
    ref: { de: 'Philipper 4,13', en: 'Philippians 4:13' },
    text: { de: 'Alles vermag ich in dem, der mich kräftigt.', en: 'I can do all things through Christ who strengthens me.' },
    core: { de: 'Meine Kraft hat eine Quelle, die nicht versiegt.', en: 'My strength has a source that never runs dry.' },
  },
  {
    id: 'jos1_9', path: 'courage', checked: 'source',
    ref: { de: 'Josua 1,9', en: 'Joshua 1:9' },
    text: { de: 'Habe ich dir nicht geboten: Sei stark und mutig? Erschrick nicht und fürchte dich nicht! Denn mit dir ist der HERR, dein Gott, wo immer du gehst.', en: 'Have I not commanded you? Be strong and of good courage; do not be afraid, nor be dismayed, for the LORD your God is with you wherever you go.' },
    core: { de: 'Mut entsteht aus Gottes Gegenwart, nicht aus Gefühl.', en: 'Courage comes from God’s presence, not from a feeling.' },
  },
  {
    id: '2ti1_7', path: 'courage', checked: 'pending',
    ref: { de: '2. Timotheus 1,7', en: '2 Timothy 1:7' },
    text: { de: 'Denn Gott hat uns nicht einen Geist der Furchtsamkeit gegeben, sondern der Kraft und der Liebe und der Besonnenheit.', en: 'For God has not given us a spirit of fear, but of power and of love and of a sound mind.' },
    core: { de: 'Angst ist nicht das letzte Wort über dich.', en: 'Fear is not the final word about you.' },
  },
  {
    id: 'ps46_11', path: 'courage', checked: 'pending',
    ref: { de: 'Psalm 46,11', en: 'Psalm 46:10' },
    text: { de: 'Lasst ab und erkennt, dass ich Gott bin! Ich werde erhaben sein unter den Nationen, ich werde erhaben sein auf der Erde.', en: 'Be still, and know that I am God; I will be exalted among the nations, I will be exalted in the earth!' },
    core: { de: 'Stillwerden ist kein Aufgeben – es ist Vertrauen.', en: 'Being still is not giving up – it is trust.' },
  },
  {
    id: 'isa40_31', path: 'courage', checked: 'pending',
    ref: { de: 'Jesaja 40,31', en: 'Isaiah 40:31' },
    text: { de: 'aber die auf den HERRN hoffen, gewinnen neue Kraft; sie heben die Schwingen empor wie die Adler, sie laufen und ermatten nicht, sie gehen und ermüden nicht.', en: 'But those who wait on the LORD Shall renew their strength; They shall mount up with wings like eagles, They shall run and not be weary, They shall walk and not faint.' },
    core: { de: 'Hoffnung auf Gott ist wie Rückenwind.', en: 'Hope in God is like a tailwind.' },
  },

  // ── Frieden ─────────────────────────────────────────────────────
  {
    id: 'mat11_28', path: 'peace', checked: 'pending',
    ref: { de: 'Matthäus 11,28', en: 'Matthew 11:28' },
    text: { de: 'Kommt her zu mir, alle ihr Mühseligen und Beladenen, und ich werde euch Ruhe geben!', en: 'Come to Me, all you who labor and are heavy laden, and I will give you rest.' },
    core: { de: 'Jesus lädt die Müden ein – nicht die Perfekten.', en: 'Jesus invites the tired – not the perfect.' },
  },
  {
    id: '1pe5_7', path: 'peace', checked: 'pending',
    ref: { de: '1. Petrus 5,7', en: '1 Peter 5:7' },
    text: { de: 'Alle eure Sorge werft auf ihn! Denn er ist besorgt für euch.', en: 'casting all your care upon Him, for He cares for you.' },
    core: { de: 'Sorgen darf man abgeben.', en: 'Worries are allowed to be handed over.' },
  },
  {
    id: 'jhn14_27', path: 'peace', checked: 'pending',
    ref: { de: 'Johannes 14,27', en: 'John 14:27' },
    text: { de: 'Frieden lasse ich euch, meinen Frieden gebe ich euch; nicht wie die Welt gibt, gebe ich euch. Euer Herz werde nicht bestürzt, sei auch nicht furchtsam.', en: 'Peace I leave with you, My peace I give to you; not as the world gives do I give to you. Let not your heart be troubled, neither let it be afraid.' },
    core: { de: 'Sein Frieden hängt nicht von den Umständen ab.', en: 'His peace does not depend on circumstances.' },
  },
  {
    id: 'php4_6', path: 'peace', checked: 'pending',
    ref: { de: 'Philipper 4,6', en: 'Philippians 4:6' },
    text: { de: 'Seid um nichts besorgt, sondern in allem sollen durch Gebet und Flehen mit Danksagung eure Anliegen vor Gott kundwerden;', en: 'Be anxious for nothing, but in everything by prayer and supplication, with thanksgiving, let your requests be made known to God;' },
    core: { de: 'Jede Sorge kann ein Gebet werden.', en: 'Every worry can become a prayer.' },
  },
  {
    id: 'ps34_9', path: 'peace', checked: 'pending',
    ref: { de: 'Psalm 34,9', en: 'Psalm 34:8' },
    text: { de: 'Schmeckt und seht, dass der HERR gütig ist! Glücklich der Mann, der sich bei ihm birgt!', en: 'Oh, taste and see that the LORD is good; Blessed is the man who trusts in Him!' },
    core: { de: 'Gottes Güte will erlebt werden, nicht nur gewusst.', en: 'God’s goodness wants to be experienced, not just known.' },
  },

  // ── Gnade ───────────────────────────────────────────────────────
  {
    id: 'eph2_8', path: 'grace', checked: 'pending',
    ref: { de: 'Epheser 2,8-9', en: 'Ephesians 2:8-9' },
    text: { de: 'Denn aus Gnade seid ihr errettet durch Glauben, und das nicht aus euch, Gottes Gabe ist es; nicht aus Werken, damit niemand sich rühme.', en: 'For by grace you have been saved through faith, and that not of yourselves; it is the gift of God, not of works, lest anyone should boast.' },
    core: { de: 'Rettung ist Geschenk, nicht Leistung.', en: 'Salvation is a gift, not an achievement.' },
  },
  {
    id: 'rom5_8', path: 'grace', checked: 'pending',
    ref: { de: 'Römer 5,8', en: 'Romans 5:8' },
    text: { de: 'Gott aber erweist seine Liebe zu uns darin, dass Christus, als wir noch Sünder waren, für uns gestorben ist.', en: 'But God demonstrates His own love toward us, in that while we were still sinners, Christ died for us.' },
    core: { de: 'Gott liebte zuerst – nicht erst, als wir gut waren.', en: 'God loved first – not once we were good.' },
  },
  {
    id: 'rom6_23', path: 'grace', checked: 'pending',
    ref: { de: 'Römer 6,23', en: 'Romans 6:23' },
    text: { de: 'Denn der Lohn der Sünde ist der Tod, die Gnadengabe Gottes aber ewiges Leben in Christus Jesus, unserem Herrn.', en: 'For the wages of sin is death, but the gift of God is eternal life in Christ Jesus our Lord.' },
    core: { de: 'Lohn verdient man – ein Geschenk empfängt man.', en: 'Wages are earned – a gift is received.' },
  },
  {
    id: '1jn1_9', path: 'grace', checked: 'pending',
    ref: { de: '1. Johannes 1,9', en: '1 John 1:9' },
    text: { de: 'Wenn wir unsere Sünden bekennen, ist er treu und gerecht, dass er uns die Sünden vergibt und uns reinigt von jeder Ungerechtigkeit.', en: 'If we confess our sins, He is faithful and just to forgive us our sins and to cleanse us from all unrighteousness.' },
    core: { de: 'Ehrlichkeit vor Gott führt in die Freiheit.', en: 'Honesty before God leads to freedom.' },
  },
  {
    id: '2co5_17', path: 'grace', checked: 'pending',
    ref: { de: '2. Korinther 5,17', en: '2 Corinthians 5:17' },
    text: { de: 'Daher, wenn jemand in Christus ist, so ist er eine neue Schöpfung; das Alte ist vergangen, siehe, Neues ist geworden.', en: 'Therefore, if anyone is in Christ, he is a new creation; old things have passed away; behold, all things have become new.' },
    core: { de: 'In Christus beginnt etwas wirklich Neues.', en: 'In Christ something truly new begins.' },
  },
  {
    id: 'rom10_9', path: 'grace', checked: 'pending',
    ref: { de: 'Römer 10,9', en: 'Romans 10:9' },
    text: { de: 'dass, wenn du mit deinem Mund Jesus als Herrn bekennen und in deinem Herzen glauben wirst, dass Gott ihn aus den Toten auferweckt hat, du gerettet werden wirst.', en: 'that if you confess with your mouth the Lord Jesus and believe in your heart that God has raised Him from the dead, you will be saved.' },
    core: { de: 'Glaube wohnt im Herzen und spricht mit dem Mund.', en: 'Faith lives in the heart and speaks with the mouth.' },
  },

  // ── Frucht ──────────────────────────────────────────────────────
  {
    id: 'jhn15_5', path: 'fruit', checked: 'source',
    ref: { de: 'Johannes 15,5', en: 'John 15:5' },
    text: { de: 'Ich bin der Weinstock, ihr seid die Reben. Wer in mir bleibt und ich in ihm, der bringt viel Frucht, denn getrennt von mir könnt ihr nichts tun.', en: 'I am the vine, you are the branches. He who abides in Me, and I in him, bears much fruit; for without Me you can do nothing.' },
    core: { de: 'Frucht kommt aus Verbundenheit, nicht aus Anstrengung.', en: 'Fruit comes from connection, not from strain.' },
  },
  {
    id: 'ps1_3', path: 'fruit', checked: 'pending',
    ref: { de: 'Psalm 1,3', en: 'Psalm 1:3' },
    text: { de: 'Er ist wie ein Baum, gepflanzt an Wasserbächen, der seine Frucht bringt zu seiner Zeit, und dessen Laub nicht verwelkt; alles, was er tut, gelingt ihm.', en: 'He shall be like a tree Planted by the rivers of water, That brings forth its fruit in its season, Whose leaf also shall not wither; And whatever he does shall prosper.' },
    core: { de: 'Das Bild hinter deinem Baum: Wer in Gottes Wort lebt, wächst.', en: 'The picture behind your tree: whoever lives in God’s word grows.' },
  },
  {
    id: 'gal5_22', path: 'fruit', checked: 'pending',
    ref: { de: 'Galater 5,22-23', en: 'Galatians 5:22-23' },
    text: { de: 'Die Frucht des Geistes aber ist: Liebe, Freude, Friede, Langmut, Freundlichkeit, Güte, Treue, Sanftmut, Enthaltsamkeit. Gegen diese ist das Gesetz nicht gerichtet.', en: 'But the fruit of the Spirit is love, joy, peace, longsuffering, kindness, goodness, faithfulness, gentleness, self-control. Against such there is no law.' },
    core: { de: 'Neun Seiten einer einzigen Frucht.', en: 'Nine sides of one single fruit.' },
  },
  {
    id: 'pro3_5', path: 'fruit', checked: 'pending',
    ref: { de: 'Sprüche 3,5-6', en: 'Proverbs 3:5-6' },
    text: { de: 'Vertraue auf den HERRN mit deinem ganzen Herzen und stütze dich nicht auf deinen Verstand! Auf all deinen Wegen erkenne nur ihn, dann ebnet er selbst deine Pfade.', en: 'Trust in the LORD with all your heart, And lean not on your own understanding; In all your ways acknowledge Him, And He shall direct your paths.' },
    core: { de: 'Vertrauen ist ein Weg, kein einmaliger Moment.', en: 'Trust is a path, not a single moment.' },
  },
  {
    id: 'mat6_33', path: 'fruit', checked: 'pending',
    ref: { de: 'Matthäus 6,33', en: 'Matthew 6:33' },
    text: { de: 'Trachtet aber zuerst nach dem Reich Gottes und nach seiner Gerechtigkeit! Und dies alles wird euch hinzugefügt werden.', en: 'But seek first the kingdom of God and His righteousness, and all these things shall be added to you.' },
    core: { de: 'Die richtige Reihenfolge ordnet alles andere.', en: 'The right order puts everything else in place.' },
  },
  {
    id: 'mat5_16', path: 'fruit', checked: 'pending',
    ref: { de: 'Matthäus 5,16', en: 'Matthew 5:16' },
    text: { de: 'So soll euer Licht leuchten vor den Menschen, damit sie eure guten Werke sehen und euren Vater, der in den Himmeln ist, verherrlichen.', en: 'Let your light so shine before men, that they may see your good works and glorify your Father in heaven.' },
    core: { de: 'Dein Leben kann auf Gott zeigen.', en: 'Your life can point to God.' },
  },

  // ── Wahrheit ────────────────────────────────────────────────────
  {
    id: 'ps119_105', path: 'truth', checked: 'pending',
    ref: { de: 'Psalm 119,105', en: 'Psalm 119:105' },
    text: { de: 'Dein Wort ist Leuchte meinem Fuß und Licht für meinen Pfad.', en: 'Your word is a lamp to my feet And a light to my path.' },
    core: { de: 'Nicht der ganze Weg – aber der nächste Schritt wird hell.', en: 'Not the whole road – but the next step becomes bright.' },
  },
  {
    id: 'jhn14_6', path: 'truth', checked: 'pending',
    ref: { de: 'Johannes 14,6', en: 'John 14:6' },
    text: { de: 'Jesus spricht zu ihm: Ich bin der Weg und die Wahrheit und das Leben. Niemand kommt zum Vater als nur durch mich.', en: 'Jesus said to him, “I am the way, the truth, and the life. No one comes to the Father except through Me.”' },
    core: { de: 'Jesus zeigt nicht nur den Weg – er ist es.', en: 'Jesus doesn’t just show the way – He is it.' },
  },
  {
    id: 'jhn8_32', path: 'truth', checked: 'pending',
    ref: { de: 'Johannes 8,32', en: 'John 8:32' },
    text: { de: 'und ihr werdet die Wahrheit erkennen, und die Wahrheit wird euch frei machen.', en: 'And you shall know the truth, and the truth shall make you free.' },
    core: { de: 'Wahrheit ist kein Käfig, sondern ein Schlüssel.', en: 'Truth is not a cage but a key.' },
  },
  {
    id: 'mat4_4', path: 'truth', checked: 'pending',
    ref: { de: 'Matthäus 4,4', en: 'Matthew 4:4' },
    text: { de: 'Er aber antwortete und sprach: Es steht geschrieben: »Nicht von Brot allein soll der Mensch leben, sondern von jedem Wort, das durch den Mund Gottes ausgeht.«', en: 'But He answered and said, “It is written, ‘Man shall not live by bread alone, but by every word that proceeds from the mouth of God.’ ”' },
    core: { de: 'Jesus kämpfte mit auswendig gelernten Worten.', en: 'Jesus fought with words He knew by heart.' },
  },
  {
    id: 'rom12_2', path: 'truth', checked: 'pending',
    ref: { de: 'Römer 12,2', en: 'Romans 12:2' },
    text: { de: 'Und seid nicht gleichförmig dieser Welt, sondern werdet verwandelt durch die Erneuerung des Sinnes, dass ihr prüfen mögt, was der Wille Gottes ist: das Gute und Wohlgefällige und Vollkommene.', en: 'And do not be conformed to this world, but be transformed by the renewing of your mind, that you may prove what is that good and acceptable and perfect will of God.' },
    core: { de: 'Was du denkst, formt, wer du wirst.', en: 'What you think shapes who you become.' },
  },
  {
    id: 'gal2_20', path: 'truth', checked: 'pending',
    ref: { de: 'Galater 2,20', en: 'Galatians 2:20' },
    text: { de: 'Ich bin mit Christus gekreuzigt, und nicht mehr lebe ich, sondern Christus lebt in mir; was ich aber jetzt im Fleisch lebe, lebe ich im Glauben, und zwar im Glauben an den Sohn Gottes, der mich geliebt und sich selbst für mich hingegeben hat.', en: 'I have been crucified with Christ; it is no longer I who live, but Christ lives in me; and the life which I now live in the flesh I live by faith in the Son of God, who loved me and gave Himself for me.' },
    core: { de: 'Ein ganzes Leben, neu begründet in seiner Liebe.', en: 'A whole life, newly grounded in His love.' },
  },

  // ── Identität ───────────────────────────────────────────────────
  {
    id: 'ps139_14', path: 'identity', checked: 'pending',
    ref: { de: 'Psalm 139,14', en: 'Psalm 139:14' },
    text: { de: 'Ich preise dich darüber, dass ich auf eine erstaunliche, ausgezeichnete Weise gemacht bin. Wunderbar sind deine Werke, und meine Seele erkennt es sehr wohl.', en: 'I will praise You, for I am fearfully and wonderfully made; Marvelous are Your works, And that my soul knows very well.' },
    core: { de: 'Du bist kein Zufallsprodukt.', en: 'You are not an accident.' },
  },
  {
    id: 'jer29_11', path: 'identity', checked: 'pending',
    ref: { de: 'Jeremia 29,11', en: 'Jeremiah 29:11' },
    text: { de: 'Denn ich kenne ja die Gedanken, die ich über euch denke, spricht der HERR, Gedanken des Friedens und nicht zum Unheil, um euch Zukunft und Hoffnung zu gewähren.', en: 'For I know the thoughts that I think toward you, says the LORD, thoughts of peace and not of evil, to give you a future and a hope.' },
    core: { de: 'Gott denkt an dich – und zwar gut.', en: 'God thinks about you – and kindly.' },
  },
  {
    id: 'rom8_28', path: 'identity', checked: 'pending',
    ref: { de: 'Römer 8,28', en: 'Romans 8:28' },
    text: { de: 'Wir wissen aber, dass denen, die Gott lieben, alle Dinge zum Guten mitwirken, denen, die nach dem Vorsatz berufen sind.', en: 'And we know that all things work together for good to those who love God, to those who are the called according to His purpose.' },
    core: { de: 'Nichts ist verloren in Gottes Hand.', en: 'Nothing is wasted in God’s hand.' },
  },
  {
    id: 'mic6_8', path: 'identity', checked: 'pending',
    ref: { de: 'Micha 6,8', en: 'Micah 6:8' },
    text: { de: 'Er hat dir mitgeteilt, Mensch, was gut ist. Und was fordert der HERR von dir, als Recht zu üben und Güte zu lieben und demütig zu gehen mit deinem Gott?', en: 'He has shown you, O man, what is good; And what does the LORD require of you But to do justly, To love mercy, And to walk humbly with your God?' },
    core: { de: 'Glaube wird sichtbar: gerecht, gütig, demütig.', en: 'Faith becomes visible: just, kind, humble.' },
  },
  {
    id: 'ps37_4', path: 'identity', checked: 'pending',
    ref: { de: 'Psalm 37,4', en: 'Psalm 37:4' },
    text: { de: 'und habe deine Lust am HERRN, so wird er dir geben die Bitten deines Herzens!', en: 'Delight yourself also in the LORD, And He shall give you the desires of your heart.' },
    core: { de: 'Wer sich an Gott freut, dessen Wünsche verändern sich.', en: 'Delight in God reshapes what you desire.' },
  },
]

export const VERSE_BY_ID: Record<string, Verse> = Object.fromEntries(VERSES.map((v) => [v.id, v]))

/** Default learning order: path order, then listed order. */
export const DEFAULT_ORDER: string[] = PATHS.flatMap((p) => VERSES.filter((v) => v.path === p.id).map((v) => v.id))

export const TRANSLATION: Record<Lang, { name: string; short: string; notice: string }> = {
  de: {
    name: 'Elberfelder Bibel 2006',
    short: 'ELB',
    notice: 'Bibeltexte: Elberfelder Bibel 2006, © 2006 SCM R.Brockhaus in der SCM Verlagsgruppe GmbH, Witten/Holzgerlingen.',
  },
  en: {
    name: 'New King James Version',
    short: 'NKJV',
    notice: 'Scripture taken from the New King James Version®. Copyright © 1982 by Thomas Nelson. Used by permission. All rights reserved.',
  },
}
