# Mijn Geld

Een volledig offline PWA voor een rustig overzicht van je betaalmaand, openstaande uitgaven, saldi en spaarpotjes.

## Wat de app doet

- Je kiest zelf je salarisdag; valt die dag in het weekend, dan begint de betaalmaand op de vrijdag ervoor.
- Het dashboard begint met een vaste fictieve planning voor de volledige betaalmaand. Actuele saldi en betaalstatussen veranderen deze hoofdplanning niet.
- Overzicht, Planning, Spaarpotjes en Instellingen gebruiken dezelfde schermbrede sectiekoppen om hoofdonderdelen duidelijk van hun kaarten te scheiden.
- Je geeft twee rekeningen zelf een herkenbare naam. Actuele saldi invullen is optioneel.
- In een apart actueel blok kun je na extra of onverwachte uitgaven opnieuw laten berekenen wat er per dag, per twee dagen en per week overblijft.
- Die actuele herberekening telt nog te ontvangen inkomsten bij je banksaldi op en trekt openstaande uitgaven en spaaroverboekingen af.
- Planning toont inkomsten, sparen en uitgaven in drie losse blokken, met sparen vóór de uitgaven en een eigen totaal per groep.
- De geplande bedragen per dag, twee dagen en per week zijn vaste richtlijnen op basis van alle dagen in de betaalmaand.
- Een nieuwe installatie begint leeg en bevat geen persoonlijke voorbeeldbedragen. De korte checklist helpt met inkomsten, uitgaven en spaarinleg; actuele saldi zijn geen verplichte stap.
- Je kunt een eenmalig extra inkomen instellen met een eigen naam, bedrag, datum en doelrekening. Het kan net als andere inkomsten als ontvangen worden gemarkeerd.
- Verouderde of toekomstige eenmalige posten blijven via Planning te beheren, ook als ze buiten de huidige betaalmaand vallen.
- Alle gegevens staan uitsluitend in de browser op dit apparaat. Via Instellingen kun je een reservekopie exporteren.
- Nieuwe app-versies worden gemeld met een updatekaart. Je kunt de update toepassen zonder je lokale gegevens kwijt te raken.

## Lokaal openen

Open de map met een eenvoudige lokale webserver, bijvoorbeeld:

    python -m http.server 8080

Ga daarna naar http://localhost:8080/. Voor de offline-installatie moet de app via een webserver of HTTPS worden geopend, niet via een lokaal bestandspad.

## Dagelijks gebruik

1. Geef je rekeningen een naam, kies je salarisdag en voeg je vaste lasten, inkomsten, losse uitgaven en geplande spaaroverboekingen toe.
2. Gebruik de hoofdplanning als je vaste fictieve richtlijn voor de betaalmaand.
3. Wil je na extra uitgaven bijsturen? Vul dan optioneel je actuele banksaldi in en gebruik alleen het aparte actuele blok.
4. Werk voor een betrouwbare actuele herberekening je banksaldo bij wanneer er iets is af- of bijgeschreven en markeer de post daarna als betaald of ontvangen. Zo wordt niets dubbel geteld.
