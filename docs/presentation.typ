#set page("a4", margin: (x: 2cm, y: 2.5cm))
#set text(size: 11pt, lang: "ro")
#set heading(numbering: "1.1")
#set par(justify: true, leading: 0.65em)

// Colors matching ParkShare brand
#let brand-green = rgb("#009967")
#let brand-dark = rgb("#101826")
#let brand-light = rgb("#f9fafb")

// Title Page
#align(center)[
  #v(4cm)
  #image("brand/png/lockup-horizontal.png", width: 9cm)
  #v(1cm)
  #text(size: 18pt, weight: "semibold", fill: brand-dark)[Business Plan & Arhitectură Tehnică]
  #v(0.5cm)
  #text(size: 14pt, fill: luma(100))[Platformă P2P pentru Închirieri de Locuri de Parcare Rezidențiale]
  #v(2cm)
  #text(size: 11pt)[#datetime.today().display()]
  #v(0.5cm)
  #text(size: 12pt, weight: "bold", fill: brand-green)[#link("https://park-share.ro")[www.park-share.ro]]
  #pagebreak()
]

#outline(title: "Cuprins", depth: 2)
#pagebreak()

= Rezumat Executiv (Executive Summary)

*ParkShare* abordează o problemă fundamentală din mediul urban aglomerat: lipsa locurilor de parcare publice, în contrast cu abundența de curți și spații private nefolosite. Platforma noastră conectează șoferii care au nevoie disperată de un loc de parcare (pentru câteva ore sau zile) cu proprietarii de imobile care doresc să își monetizeze spațiul privat (curtea, aleea, garajul) atunci când nu îl folosesc.

Modelul nostru este simplu, scalabil și bazat pe o aplicație modernă, performantă, construită cu cele mai noi tehnologii.

= Problema

1. *Congestia Traficului:* Peste 30% din traficul din marile orașe este generat de șoferi care caută un loc de parcare.
2. *Poluare și Timp Pierdut:* Un șofer pierde în medie 20-30 de minute zilnic doar căutând parcare, ceea ce duce la emisii uriașe de CO2.
3. *Resurse Nefolosite:* Sute de mii de locuri de parcare rezidențiale stau goale în timpul zilei, când proprietarii sunt la birou.

= Soluția: ParkShare

Platforma oferă o soluție *Peer-to-Peer (P2P)*:
- *Pentru Șoferi:* Posibilitatea de a găsi, rezerva și plăti un loc de parcare direct din aplicație, la prețuri competitive, eliminând stresul căutării.
- *Pentru Gazde:* O metodă pasivă și sigură de a genera venituri suplimentare prin închirierea locului de parcare propriu.

== User Journey (Fluxul Utilizatorului)
#align(center)[
  #box(
    fill: brand-light, inset: 15pt, radius: 5pt, stroke: 1pt + brand-dark,
    [
      #grid(
        columns: (auto, auto, auto, auto, auto, auto, auto),
        align: center + horizon,
        column-gutter: 10pt,
        rect(fill: brand-green, radius: 3pt, inset: 8pt)[#text(fill: white, weight: "bold")[1. Caută]],
        [#text(size: 16pt)[$arrow.r$]],
        rect(fill: brand-green, radius: 3pt, inset: 8pt)[#text(fill: white, weight: "bold")[2. Rezervă & Plătește]],
        [#text(size: 16pt)[$arrow.r$]],
        rect(fill: brand-green, radius: 3pt, inset: 8pt)[#text(fill: white, weight: "bold")[3. Parchează]],
        [#text(size: 16pt)[$arrow.r$]],
        rect(fill: brand-dark, radius: 3pt, inset: 8pt)[#text(fill: white, weight: "bold")[4. Gazda încasează]]
      )
    ]
  )
]

= Analiza Pieței și Statistici

Conform studiilor urbane și analizelor noastre interne, potențialul de piață este enorm. 

== Timpul pierdut de șoferi în marile orașe
#align(center)[
  #box(width: 80%, height: 120pt)[
    #grid(
      columns: (1fr, 1fr, 1fr, 1fr, 1fr),
      rows: (100pt, 20pt),
      align: (center+bottom, center+bottom, center+bottom, center+bottom, center+bottom),
      // BARS
      rect(width: 30pt, height: 80pt, fill: brand-green, radius: 2pt),
      rect(width: 30pt, height: 65pt, fill: brand-green, radius: 2pt),
      rect(width: 30pt, height: 45pt, fill: brand-green, radius: 2pt),
      rect(width: 30pt, height: 95pt, fill: brand-green, radius: 2pt),
      rect(width: 30pt, height: 15pt, fill: brand-dark, radius: 2pt),
      
      // LABELS
      text(size: 9pt)[București\ (41m)],
      text(size: 9pt)[Cluj\ (32m)],
      text(size: 9pt)[Timișoara\ (22m)],
      text(size: 9pt)[Londra\ (47m)],
      text(size: 9pt)[Cu ParkShare\ (~2m)]
    )
  ]
]

*(Sursă date: Conform TomTom Traffic Index 2025, șoferii din București pierd 171 de ore anual în trafic, adică o medie de 41 de minute/zi lucrătoare doar pe fondul congestiei).*

== Segmentarea Pieței (TAM, SAM, SOM)
- *TAM (Total Addressable Market):* Toți șoferii din zonele urbane europene care întâmpină dificultăți în a găsi parcare (aprox. 5 miliarde EUR/an).
- *SAM (Serviceable Available Market):* Șoferii din România și Europa de Est care folosesc smartphone-uri pentru servicii de mobilitate.
- *SOM (Serviceable Obtainable Market):* 5% din piața din București și Cluj-Napoca în primii 2 ani (estimat la 2.5 milioane EUR tranzacționați anual).

== Avantaj Competitiv
Majoritatea soluțiilor actuale se axează exclusiv pe digitalizarea parcărilor publice/de stat, ignorând complet oferta imensă de spații private.
#align(center)[
  #table(
    columns: (2fr, 1fr, 1fr, 1fr),
    inset: 10pt,
    align: horizon,
    [*Funcționalitate*], [*ParkShare*], [*Aplicații de Stat*], [*Parcări Tradiționale*],
    [Spații Private/Rezidențiale], [*Da*], [Nu], [Nu],
    [Sistem de Rating / Trust], [*Da*], [Nu], [Nu],
    [Prețuri Dinamice & Mici], [*Da*], [Nu (Tarif Fix)], [Nu (Tarif Ridicat)],
    [Rezervare Garantată Avans], [*Da*], [Depinde de noroc], [Nu (Primul venit)]
  )
]

== Proiecții Financiare și KPI (Key Performance Indicators)
Pe baza modelului nostru cu comision de 15% pe tranzacție (calculat la o medie de 3 EUR/zi per loc):
- *Anul 1:* Preluarea a 500 de spații active zilnic. Venituri nete estimate (Net Revenue): ~80,000 EUR.
- *Anul 3 (Scalare Națională):* 5,000 spații active zilnic. Venituri nete estimate: ~1.2 milioane EUR.

*Costuri Reale de Validare (Bootstrapping / Lean Startup):*
Pentru lansarea MVP-ului pe piața locală, ne folosim de infrastructura modernă pentru a menține costurile extrem de reduse (buget total de doar *4,000 EUR* în primele 6 luni):
#align(center)[
  #table(
    columns: (1fr, 1fr, 2fr),
    inset: 8pt,
    align: horizon,
    [*Categorie*], [*Cost Estimat (Live)*], [*Explicație / Sursă Date*],
    [Legal & Setup SRL], [~250 EUR (one-time)], [ONRC + Capital Social (500 RON) + Servicii tip StartCo/Incorpo],
    [Infrastructură (Cloud & Hărți)], [~0 EUR / primele luni], [Google Maps Platform oferă credit lunar gratuit de \$200 (suficient pt. ~28.000 afișări hărți)],
    [Marketing (Achiziție Users)], [~3,500 EUR], [CAC estimat la 1.5 - 2 EUR (bazat pe un CPM mediu de \$4-\$6 pe Facebook/Meta Ads în RO)]
  )
]
Prin acest model extrem de "lean", riscul investițional este cvasi-zero, iar break-even point-ul operațional este atins imediat ce densitatea pe un cartier depășește pragul critic.

= Arhitectura Tehnică a Proiectului

ParkShare nu este doar o idee de afaceri, ci un produs tehnic complet funcțional, dezvoltat la standarde înalte:

== 1. Frontend & Mobile (User Experience)
- Dezvoltat folosind ecosistemul React.
- Design System modern ("Apple/Linear style") utilizând culori personalizate (Emerald Green #009967), aplicat unitar prin componente partajate (`Screen` / `ScreenHeader` și panouri de tip "glass") pentru consistență vizuală pe toate ecranele.
- Hărți interactive pentru găsirea locurilor de parcare live.
- Ecran dedicat "Trust & Safety" (status, scoruri, notificări și apeluri) și consolă completă de administrare (dashboard, moderare utilizatori, spații, rezervări și rapoarte).

== 2. Infrastructura Backend
- Arhitectură robustă care gestionează tranzacții, sisteme de rating (Host & Guest) și status-ul live al locurilor de parcare.
- Prevenirea "dublei rezervări" se face server-side, printr-o verificare atomică a suprapunerilor de rezervări în interiorul unei tranzacții de bază de date (Prisma `$transaction`), garantând consistența fără a depinde de conexiuni persistente.

== 3. Trust & Safety & Moderare (Reputație)
Spre deosebire de platformele concurente, ParkShare integrează un sistem complet de reputație și siguranță, atât pentru *șoferi*, cât și pentru *gazde*:
- *Rating bidirecțional:* După fiecare cursă, șoferul și gazda se pot evalua reciproc. Recenziile sunt opționale — un banner discret, ușor de închis, în locul unei ferestre pop-up forțate.
- *Scor de încredere (Standing):* Fiecare cont are un status vizibil — `ACTIVE`, `WARNING`, `SUSPENDED` sau `BANNED` — calculat pe baza notelor primite (minim 5 recenzii înainte de automatizare).
- *Sancțiuni automate, proporționale:* Sub 3.5 stele se emite un avertisment; sub 3.0 stele contul este suspendat temporar (14 zile implicit); 3 note foarte mici în 90 de zile declanșează aceeași măsură. Blocările permanente (ban) sunt confirmate exclusiv manual de un administrator.
- *Dreptul la apel:* Utilizatorii sancționați pot trimite un apel direct din ecranul de Trust & Safety și pot fi reabilitați de un administrator.
- *Notificări & audit:* Fiecare acțiune de moderare este înregistrată (audit log), iar utilizatorul este notificat în aplicație.

== 4. Marketing Video Programatic (Remotion)
O componentă tehnică inovatoare a proiectului nostru este generarea materialelor de marketing direct din cod. Am construit un sistem video bazat pe `Remotion` (React):
- Renderizează un promo high-end de *11 scene* (~52 de secunde, 1920×1080 la 30fps), ce acoperă tot fluxul utilizatorului: *Găsește → Rezervă → Parchează → Economisește → Listează → Câștigă → Încredere*.
- *Bilingv:* fiecare scenă este randată în română *și* engleză printr-un dicționar `i18n` partajat (inclusiv noul conținut: "Park Plus", "Garanție anulată", "Gazde verificate").
- Motion scriptat: typography kinetică, animații spring, mockup-uri de telefon animate (cronometru de parcare live, portofel & pass-uri, grila de disponibilitate a gazdei) și o bară de progres branded.

= Modelul de Business & Monetizare

ParkShare folosește un model de *Marketplace cu comision*:
1. *Comision per tranzacție:* 15% reținut de la șoferi la fiecare rezervare.
2. *Gratuit pentru gazde:* Listarea locului de parcare este complet gratuită pentru a încuraja adopția rapidă și formarea rețelei de spații (Supply).
3. *Abonamente Premium (B2B):* Flote auto, firme de curierat sau companii de rent-a-car pot achiziționa abonamente lunare pentru acces garantat și facturare consolidată.

= Strategia de Lansare (Go-to-Market)

- *Faza 1 (Seed):* Lansare într-un singur cartier aglomerat / zonă de birouri din oraș. Achiziția a primelor 50 de locuri de parcare (supply) înainte de lansarea pentru șoferi.
- *Faza 2 (Growth):* Campanii de marketing direcționate (folosind videoclipurile generate procedural) pe rețele sociale (Facebook, Instagram, TikTok) vizând persoanele care stau zilnic în trafic pe rute specifice.
- *Faza 3 (Scale):* Parteneriate cu autoritățile locale pentru integrarea ParkShare ca soluție alternativă de reducere a congestiei urbane.

= Fezabilitate și Riscuri

Dezvoltarea și scalarea unei platforme de tip P2P în sectorul parcărilor implică anumite riscuri ce trebuie atenuate printr-o execuție precisă.

== Riscuri Juridice (Legal)
- *Reglementări locale privind închirierea:* Unele municipalități ar putea avea reglementări specifice privind subînchirierea spațiilor rezidențiale. *Atenuare:* Ne vom asigura că termenii și condițiile noastre (ToS) specifică clar că gazdele sunt responsabile pentru respectarea legilor locale și obținerea eventualelor acorduri de la asociațiile de proprietari.
- *Răspunderea în caz de daune:* Posibile daune auto pe proprietatea privată. *Atenuare:* Platforma va include o politică de asigurare integrată pentru tranzacțiile procesate și verificări KYC (Cunoaște-ți Clientul) pentru toți utilizatorii.

== Riscuri Economice și Operaționale
- *Chicken-and-Egg Problem:* Lipsa de parcări disponibile inițial descurajează șoferii. *Atenuare:* Adoptăm o lansare hiper-localizată, concentrându-ne pe o singură zonă/cartier până la atingerea lichidității.
- *Elasticitatea Prețului:* Prețurile cerute de gazde pot depăși parcările publice. *Atenuare:* Algoritmul nostru va sugera prețuri dinamice bazate pe cerere și ofertă, asigurându-se că parcările ParkShare rămân mai ieftine și mai atractive decât alternativele publice.

= Echipa și Viziunea

Pentru a asigura succesul platformei, execuția tehnică excelentă trebuie combinată cu o strategie de creștere ascuțită. 
*Viziunea noastră* este să transformăm felul în care orașele europene gestionează spațiul urban, mutând accentul de pe "construcția de noi parcări din beton" pe "optimizarea spațiilor deja existente prin tehnologie". Echipa combină know-how tehnic avansat (React, Sisteme Real-Time) cu înțelegerea pieței locale de mobilitate.

= Concluzii

ParkShare reprezintă o soluție tehnologică matură la o problemă urbană cronică. Prin utilizarea tehnologiilor de ultimă generație (React, sisteme real-time, Remotion pentru marketing) și un model de business scalabil (P2P), platforma are un potențial disruptiv masiv pe piața de mobilitate urbană.

Vă mulțumim pentru oportunitatea de a prezenta această inovație!
