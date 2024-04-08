# BikeMap

In diesem Projekt geht es um das Thema "Geovisualisierung von mobilen Umweltdaten im Web". Das Tool soll es ermöglichen, Sensordaten hochzuladen, auf einer Karte zu visualisieren und herunterzuladen. Speziell geht es dabei um Umweltdaten, die beim Fahrrad fahren gesammelt werden können. Der Hauptfokus dieser Anwendung liegt in der Benutzerfreundlichkeit. Es zielt darauf ab, ein möglichst effizientes, effektives und benutzbares Tool zu erstellen, das vor allem auch für Nutzer/innen ohne Vorkenntnisse in der Geovisualisierung bedienbar ist.

**Link des Tools**
(https://bikemaptool.netlify.app/)

## Installation 
In der IDE ihrer Wahl können Sie das GitHub repository mit folgendem Befehl 
`https://github.com/derya-sen/BikeMap.git` clonen
oder das Projekt als zip-Datei herunterladen.

Die Webanwendung kann mit fogendem Befehl 
`node app.js`
gestartet werden.

## Das Geovisualisierungstool
<img width="959" alt="webseite-daten" src="https://github.com/derya-sen/BikeMap/assets/82390935/5ccb98ea-fc97-4686-a12c-d7a452fb6d2d">

Das Tool bietet die Möglichkeit verschiedene Umweltdaten und weitere zu visualisieren:
- Temperatur
- Luftfeuchtigkeit
- Feinstaub
  * pm1
  * pm2.5
  * pm4
  * pm10
- Distanz
- Geschwindigkeit
- Beschleunigung in x-, y-, z-Richtung (z: Erschütterung)
- Längen- und Breitengrad
- Zeitpunkt
Diese Daten können z.B. mit der senseBox:bike gesammelt werden, einem Sensormessgerät speziell für die Datenerhebung mit dem Fahrrad.
Zusätzlich bietet sich die Möglichkeit, die Fahrradroute mit einer Kamera aufzunehmen und auch in die Anwendung zu laden.
Die Testdaten sind als **"Sensordaten-Fahrradroute.csv"** im Dateiordner geladen. Das Video konnte aufgrund der Größe nicht hinzugefügt werden.

## Funktionen

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

## Anpassungen notwendig
- Tests erstellen & Fehler beheben
- Funktionen ergänzen:
    * Zeiger auf Tachometer animieren
    * Synchronisation verbessern
    * Kartenausschnitt für Download anpassen
    * Benutzeroberfläche für verschiedene Displaygrößen anpassen
  

## Quellen
- [https://www.w3schools.com/]
- [https://www.mapbox.com/]
- [https://d3js.org/]








