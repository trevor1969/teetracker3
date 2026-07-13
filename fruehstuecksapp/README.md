# Frühstückskonten Verwaltung

Eine Web-App zur Verwaltung von Frühstückskonten für den Offenen Treff. Besucher können über eine PIN ihren Kontostand abfragen, Mitarbeiter können Einzahlungen und Abbuchungen vornehmen.

## Funktionen

### Für Besucher
- Kontostand mit 4-stelliger PIN abfragen
- Übersichtlicher Kontostand in großem Format

### Für Mitarbeiter
- Konten anlegen und verwalten
- Einzahlungen und Abbuchungen durchführen
- Transaktionshistorie einsehen
- Feste Artikelpreise verwenden oder manuelle Beträge eingeben

### Für Administratoren
- Alle Mitarbeiterfunktionen
- Artikelverwaltung (anlegen, bearbeiten, löschen)
- Benutzerverwaltung (Mitarbeiter anlegen, löschen)

## Installation

### Voraussetzungen
- Node.js (Version 14 oder höher)
- npm (wird mit Node.js installiert)

### Schritte

1. **Repository klonen und in das Verzeichnis wechseln:**
```bash
cd fruehstuecksapp
```

2. **Abhängigkeiten installieren:**
```bash
npm install
```

3. **Datenbank initialisieren:**
   Die Datenbank wird automatisch beim ersten Start erstellt.

4. **Anwendung starten:**
```bash
npm start
```

   Für die Entwicklung mit automatischem Neustart:
```bash
npm run dev
```

5. **Im Browser öffnen:**
   [http://localhost:3000](http://localhost:3000)

## Standard-Anmeldung

- **Benutzername:** admin
- **Passwort:** admin123

## Datenbank

Die Anwendung verwendet SQLite und speichert die Daten in der Datei `fruehstueck.db` im Projektverzeichnis.

### Datenbank-Schema

- **users:** Mitarbeiter und Administratoren
- **accounts:** Besucher-Konten mit PIN
- **items:** Artikel mit festen Preisen
- **transactions:** Alle Transaktionen (Einzahlungen und Abbuchungen)

## Sicherheit

- Alle Passwörter und PINs werden mit bcrypt gehasht
- Sessions werden serverseitig verwaltet
- Standard-Admin-Passwort sollte nach der ersten Anmeldung geändert werden

## Konfiguration

### Umgebungsvariablen

- **PORT:** Port für den Server (Standard: 3000)
- **SESSION_SECRET:** Geheimnis für Session-Cookies (Standard: 'fruehstueck-secret-key')

### Beispiel für .env-Datei:
```
PORT=3000
SESSION_SECRET=your-secret-key-here
```

## API-Endpunkte

### GET /pin-check
- Seite zur PIN-Abfrage für Besucher

### POST /api/pin-check
- JSON-API zur PIN-Abfrage (für mögliche mobile Integration)
- Request: `{ "pin": "1234" }`
- Response: `{ "success": true, "name": "Max Mustermann", "balance": 15.50 }`

## Lizenz

Diese Software ist für den internen Gebrauch im Offenen Treff bestimmt.
