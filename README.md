# Mijn Geld

Een volledig offline PWA voor een rustig overzicht van je betaalmaand, openstaande uitgaven, saldi en spaarpotjes.

## Wat de app doet

- Je kiest zelf je salarisdag; valt die dag in het weekend, dan begint de betaalmaand op de vrijdag ervoor.
- Het dashboard begint met wat nu beschikbaar is en toont daaronder openstaande posten, rekeningprognoses en de planning voor de volledige betaalmaand.
- Je geeft twee rekeningen zelf een herkenbare naam en vult de actuele saldi handmatig in.
- Niet-betaalde uitgaven en spaaroverboekingen worden afgetrokken; verwachte inkomsten worden opgeteld.
- Planning groepeert inkomsten apart van uitgaven en spaarinleg, met een eigen totaal per groep.
- De app toont wat vrij te besteden is tot de volgende salarisdag, plus een budget per dag, twee dagen en maximaal zeven dagen. Die korte periodes worden nooit hoger dan het totaal dat nog resteert.
- Een nieuwe installatie begint leeg en bevat geen persoonlijke voorbeeldbedragen. De korte checklist helpt met saldi, inkomsten en uitgaven.
- Je kunt een eenmalig extra inkomen instellen met een eigen naam, bedrag, datum en doelrekening. Het kan net als andere inkomsten als ontvangen worden gemarkeerd.
- Verouderde of toekomstige eenmalige posten blijven via Planning te beheren, ook als ze buiten de huidige betaalmaand vallen.
- Alle gegevens staan uitsluitend in de browser op dit apparaat. Via Instellingen kun je een reservekopie exporteren.
- Nieuwe app-versies worden gemeld met een updatekaart. Je kunt de update toepassen zonder je lokale gegevens kwijt te raken.

## Lokaal openen

Open de map met een eenvoudige lokale webserver, bijvoorbeeld:

    python -m http.server 8080

Ga daarna naar http://localhost:8080/. Voor de offline-installatie moet de app via een webserver of HTTPS worden geopend, niet via een lokaal bestandspad.

## Dagelijks gebruik

1. Geef je rekeningen een naam, kies je salarisdag en vul de actuele saldi in.
2. Voeg je vaste lasten, inkomsten, losse uitgaven en geplande spaaroverboekingen toe.
3. Werk je echte banksaldo bij wanneer er iets is af- of bijgeschreven en markeer de post daarna als betaald of ontvangen. Zo wordt niets dubbel geteld.
