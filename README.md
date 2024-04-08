# BikeMap

In diesem Projekt geht es um das Thema "Geovisualisierung von mobilen Umweltdaten im Web". Das Tool soll es ermöglichen, Sensordaten hochzuladen, auf einer Karte zu visualisieren und herunterzuladen. Speziell geht es dabei um Umweltdaten, die beim Fahrrad fahren gesammelt werden können. Der Hauptfokus dieser Anwendung liegt in der Benutzerfreundlichkeit. Es zielt darauf ab, ein möglichst effizientes, effektives und benutzbares Tool zu erstellen, das vor allem auch für Nutzer/innen ohne Vorkenntnisse in der Geovisualisierung bedienbar ist.

**Link des Tools**
(https://bikemaptool.netlify.app/)

## Installation 
In der IDE ihrer Wahl können Sie das GitHub repository mit folgendem Befehl clonen
`https://github.com/derya-sen/BikeMap.git`
oder das Projekt als zip-Datei herunterladen.

Die Webanwendung kann mit fogendem Befehl 
`node app.js`
gestartet werden.

## Funktionen:

### Upload
Es bestehen zwei Uploadfunktionen.
Mit der einen kann eine csv-Datei mit den Umweltdaten hochgeladen werden. Diese wird in geojson umformatiert und als Layer der Karte hinzugefügt.
Die andere Funktion ist dafür da, bei ein vorhandes Video der Route hochzuladen.

### Kartenlayer
Auf der Karte werden die Sensordaten visualisiert. Es wird eine entsprechende Legende für die Layer erstellt, die an- und ausgeschaltet werden können. Außerdem erscheint ein Popup mit genaueren Informationen zu einem Datenpunkt, mit einem Mausklick auf den ausgewählten Punkt.
Außerdem erscheint ein Tachometer auf der Karte mit Angaben zur Geschwindigkeit und Zeit.

### Video
Beim Abspielen des Videos wird synchron dazu die Route als Linie auf der Karte animiert. Gleichzeitig aktualisiert sich auch die Geschwindigkeit auf dem Tachometer. Mit einem Schieberegler unterhalb des Videos kann die Geschwindigkeit angepasst werden. Nach Ablauf des Videos werden alle Daten auf die Standardeinstellungen zurückgesetzt.

### Download
Die Karte kann mit einem oder mehreren Layer/n der Wahl heruntergeladen werden.

<img width="959" alt="webseite-daten" src="https://github.com/derya-sen/BikeMap/assets/82390935/5ccb98ea-fc97-4686-a12c-d7a452fb6d2d">



## Quellen
[https://www.w3schools.com/]
[https://www.mapbox.com/]
[https://d3js.org/]


## Verbesserung
- Tests erstellen & Fehler beheben
- Funktionen ergänzen:
    * Zeiger auf Tachometer animieren
    * Synchronisation verbessern
    * Kartenausschnitt für Download anpassen
    * Benutzeroberfläche für verschiedene Displaygrößen anpassen
  








Zusätzlich bietet sich die Möglichkeit, die Fahrradroute mit aufzunehmen und auch in die Anwendung zu laden. 
