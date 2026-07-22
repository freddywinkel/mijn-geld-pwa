# Mijn Geld

Een volledig offline PWA voor een rustig overzicht van je betaalmaand, openstaande uitgaven, saldi en spaarpotjes.

## Wat de app doet

- De betaalmaand begint op de 25e; valt die dag in het weekend, dan begint hij op de vrijdag ervoor.
- Het dashboard toont per volledige betaalmaand de totale inkomsten, uitgaven, spaarinleg, het ingevulde spaarsaldo en wat vrij te besteden is.
- Je vult de actuele saldi van Rabobank en Bunq zelf in.
- Niet-betaalde uitgaven en spaaroverboekingen worden afgetrokken; verwachte inkomsten worden opgeteld.
- De app toont wat vrij te besteden is tot de volgende salarisdag, plus een gemiddeld budget per dag, twee dagen en week.
- Rabobank is bedoeld voor vaste lasten. Bunq is voor besteedbaar geld en losse spaarpotjes.
- De eerste setup bevat de terugkerende inkomsten, uitgaven, abonnementen en maandelijkse spaarinleg uit het financiële werkblad. Controleer bedragen en datums in Planning; wijzigingen worden niet automatisch bijgewerkt.
- Je kunt een eenmalige extra inkomst instellen met een eigen naam, bedrag, datum en doelrekening. Wanneer ze is ingeschakeld, telt ze mee in de inkomsten, rekeningprognose en overzichtstotalen.
- Alle gegevens staan uitsluitend in de browser op dit apparaat. Via Instellingen kun je een reservekopie exporteren.
- Nieuwe app-versies worden gemeld met een updatekaart. Je kunt de update toepassen zonder je lokale gegevens kwijt te raken.

## Lokaal openen

Open de map met een eenvoudige lokale webserver, bijvoorbeeld:

    python -m http.server 8080

Ga daarna naar http://localhost:8080/finances-pwa/. Voor de offline-installatie moet de app via een webserver of HTTPS worden geopend, niet via een lokaal bestandspad.

## Dagelijks gebruik

1. Vul eerst je actuele Rabobank- en Bunq-saldo in.
2. Voeg je vaste lasten, inkomsten, losse uitgaven en geplande spaaroverboekingen toe.
3. Werk je echte banksaldo bij wanneer er iets is af- of bijgeschreven en markeer de post daarna als betaald of ontvangen. Zo wordt niets dubbel geteld.
