#!/bin/bash

# Tailscale ACL Manager - Legacy Version
# Für Tailscale Versionen < 1.60.0 (ohne 'tailscale acl' Befehl)
# Erlaubt das Blockieren und Freigeben einzelner Geräte durch manuelle ACL-Dateiverwaltung
#
# Verwendung: ./tailscale-acl-manager-legacy.sh [OPTION]
#
# Optionen:
#   -h, --help       Diese Hilfe anzeigen
#   -l, --list       Geräteliste anzeigen
#   -s, --status     ACL-Status anzeigen
#   -b, --block      Gerät blockieren (interaktiv)
#   -u, --unblock    Gerät entblockieren (interaktiv)
#   -e, --edit       ACL-Datei manuell bearbeiten
#   -d, --download    ACL-Datei von Tailscale herunterladen
#   -p, --push        ACL-Datei zu Tailscale hochladen

set -euo pipefail

# Farben für die Ausgabe
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Standard ACL-Datei Pfad
ACL_FILE="tailscale-acl.json"

# Pruefen ob tailscale installiert ist
check_tailscale_installed() {
    if ! command -v tailscale &> /dev/null; then
        echo -e "${RED}Fehler: tailscale CLI ist nicht installiert.${NC}"
        echo "Installiere tailscale von https://tailscale.com/download"
        exit 1
    fi
}

# Pruefen ob angemeldet
check_tailscale_authenticated() {
    if ! tailscale status &> /dev/null; then
        echo -e "${RED}Fehler: Nicht mit Tailscale angemeldet.${NC}"
        echo "Fuehre 'tailscale up' oder 'tailscale login' aus und versuche es erneut."
        exit 1
    fi
}

# Pruefen ob jq installiert ist (für JSON-Verarbeitung)
check_jq_installed() {
    if ! command -v jq &> /dev/null; then
        echo -e "${RED}Fehler: jq ist nicht installiert.${NC}"
        echo "Installiere jq mit: sudo apt-get install jq"
        exit 1
    fi
}

# Alle Geraete anzeigen
show_devices() {
    echo -e "\n${BLUE}===== Geräteliste =====${NC}\n"

    if ! tailscale status &> /dev/null; then
        echo -e "${RED}Fehler: Konnte Geräteliste nicht abrufen.${NC}"
        return 1
    fi

    # Versuchen, JSON-Ausgabe zu bekommen
    local devices
    devices=$(tailscale status --json 2>/dev/null || tailscale status)

    if echo "$devices" | jq empty 2>/dev/null; then
        # JSON-Verarbeitung
        echo "$(printf '%s\n' "$devices" | jq -r '.Peer[] | "Hostname: \(.DNSName // .HostName) | IP: \(.TailscaleIPs[0]) | Status: \(if .Online then "Online" else "Offline" end) | Node: \(.NodeID[:8])"')"
        echo ""
        echo "$(printf '%s\n' "$devices" | jq -r '.Self | "Hostname: \(.DNSName // .HostName) | IP: \(.TailscaleIPs[0]) | Status: \(if .Online then "Online" else "Offline" end) | Node: \(.NodeID[:8]) | (SELBST)"')"
    else
        # Einfache Textausgabe
        echo "$devices"
    fi

    echo ""
}

# ACL-Datei herunterladen (manuell von Admin Console)
download_acl() {
    echo -e "\n${BLUE}===== ACL-Datei herunterladen =====${NC}\n"
    echo "Da deine Tailscale-Version (1.102.3) den 'acl' Befehl nicht unterstützt,"
    echo "musst du die ACL-Datei manuell von der Tailscale Admin Console herunterladen:"
    echo ""
    echo "1. Öffne: https://login.tailscale.com/admin/acls"
    echo "2. Klicke auf 'Download ACL file'"
    echo "3. Speichere die Datei als: $ACL_FILE"
    echo ""
    
    read -p "Hast du die ACL-Datei heruntergeladen? (j/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Jj]$ ]]; then
        echo -e "${YELLOW}Abbruch.${NC}"
        return 1
    fi
    
    if [[ -f "$ACL_FILE" ]]; then
        echo -e "${GREEN}ACL-Datei gefunden: $ACL_FILE${NC}"
        show_acls
    else
        echo -e "${RED}ACL-Datei nicht gefunden: $ACL_FILE${NC}"
        return 1
    fi
}

# ACL-Status anzeigen (lokal)
show_acls() {
    echo -e "\n${BLUE}===== Aktuelle ACLs (lokal) =====${NC}\n"

    if [[ -f "$ACL_FILE" ]]; then
        cat "$ACL_FILE"
        echo ""
        echo -e "${YELLOW}Hinweis: Dies ist die lokale ACL-Datei.${NC}"
        echo "Um die aktiven ACLs auf Tailscale zu sehen, besuche:"
        echo "https://login.tailscale.com/admin/acls"
    else
        echo -e "${YELLOW}Keine lokale ACL-Datei gefunden.${NC}"
        echo "Lade die ACL-Datei zuerst mit --download herunter oder erstelle eine neue."
    fi
    echo ""
}

# ACL-Datei hochladen (manuell zur Admin Console)
push_acl() {
    echo -e "\n${BLUE}===== ACL-Datei hochladen =====${NC}\n"
    
    if [[ ! -f "$ACL_FILE" ]]; then
        echo -e "${RED}Fehler: ACL-Datei nicht gefunden: $ACL_FILE${NC}"
        echo "Erstelle oder lade zuerst eine ACL-Datei herunter."
        return 1
    fi
    
    echo "Um die ACL-Datei auf Tailscale anzuwenden:"
    echo ""
    echo "1. Öffne: https://login.tailscale.com/admin/acls"
    echo "2. Klicke auf 'Edit ACL file'"
    echo "3. Kopiere den Inhalt von $ACL_FILE"
    echo "4. Füge ihn in das Textfeld ein"
    echo "5. Klicke auf 'Save'"
    echo ""
    echo "Die Änderungen werden automatisch innerhalb von 1-2 Minuten angewendet."
    echo ""
    
    read -p "Möchtest du die ACL-Datei jetzt in deinem Standard-Editor öffnen? (j/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Jj]$ ]]; then
        edit_acl_manually
    fi
}

# Standard-ACL erstellen
create_default_acl() {
    cat > "$ACL_FILE" << 'EOF'
{
  "acls": [
    // Standard-Regeln für alle Mitglieder
    {
      "action": "accept",
      "src": ["autogroup:members"],
      "dst": ["autogroup:members:*"]
    },
    // Erlaube Zugriff auf alle Dienste im Netzwerk
    {
      "action": "accept",
      "src": ["autogroup:members"],
      "dst": ["autogroup:self"]
    },
    {
      "action": "accept",
      "src": ["autogroup:self"],
      "dst": ["autogroup:members"]
    }
  ]
}
EOF
    echo -e "${GREEN}Standard-ACL-Datei erstellt: $ACL_FILE${NC}"
}

# Geraet blockieren (ACL-Datei bearbeiten)
block_device() {
    local node_id="$1"
    local hostname="$2"
    local short_id="${node_id:0:8}"

    if [[ -z "$node_id" ]]; then
        echo -e "${RED}Fehler: Keine Node-ID angegeben.${NC}"
        return 1
    fi

    # ACL-Datei erstellen falls nicht vorhanden
    if [[ ! -f "$ACL_FILE" ]]; then
        create_default_acl
    fi

    # Pruefen ob bereits blockiert
    if grep -q "node:${node_id}" "$ACL_FILE" 2>/dev/null; then
        local action
        action=$(grep "node:${node_id}" "$ACL_FILE" | grep -o '"action": *"[^"]*"' | head -1 | cut -d'"' -f4)
        if [[ "$action" == "drop" ]]; then
            echo -e "${YELLOW}Gerät $short_id ist bereits blockiert.${NC}"
            return 0
        fi
    fi

    # Block-Regel hinzufuegen
    local block_rule
    if [[ -n "$hostname" ]]; then
        block_rule="    {\n      \"action\": \"drop\",\n      \"src\": [\"node:${node_id}\"],\n      \"dst\": [\"autogroup:all\"],\n      \"comment\": \"Blocked: ${hostname}\"\n    }"
    else
        block_rule="    {\n      \"action\": \"drop\",\n      \"src\": [\"node:${node_id}\"],\n      \"dst\": [\"autogroup:all\"]\n    }"
    fi

    # Regel einfuegen vor dem letzten }
    sed -i "/^}/i\\n${block_rule}," "$ACL_FILE"

    echo -e "${GREEN}Gerät $short_id wurde zur Blocklist hinzugefügt.${NC}"
    echo ""
    echo "Um die Änderungen anzuwenden, lade die ACL-Datei hoch:"
    echo "  ./tailscale-acl-manager-legacy.sh --push"
    echo ""
}

# Geraet entblockieren (ACL-Datei bearbeiten)
unblock_device() {
    local node_id="$1"
    local hostname="$2"
    local short_id="${node_id:0:8}"

    if [[ -z "$node_id" ]]; then
        echo -e "${RED}Fehler: Keine Node-ID angegeben.${NC}"
        return 1
    fi

    if [[ ! -f "$ACL_FILE" ]]; then
        echo -e "${YELLOW}Keine ACL-Datei gefunden.${NC}"
        echo "Das Gerät ist nicht explizit blockiert."
        return 0
    fi

    # Pruefen ob blockiert
    if ! grep -q "node:${node_id}" "$ACL_FILE" 2>/dev/null; then
        echo -e "${YELLOW}Gerät $short_id ist nicht blockiert.${NC}"
        return 0
    fi

    # Block-Regel entfernen
    local line_start
    line_start=$(grep -n "node:${node_id}" "$ACL_FILE" | head -1 | cut -d: -f1)
    local line_end
    line_end=$(awk -v start="$line_start" 'NR>=start {print NR; if (/^    },?$/) exit}' "$ACL_FILE" | tail -1)

    if [[ -n "$line_start" && -n "$line_end" ]]; then
        sed -i "${line_start},${line_end}d" "$ACL_FILE"
        echo -e "${GREEN}Gerät $short_id wurde von der Blocklist entfernt.${NC}"
    else
        echo -e "${RED}Fehler: Konnte Block-Regel nicht finden.${NC}"
        return 1
    fi

    echo ""
    echo "Um die Änderungen anzuwenden, lade die ACL-Datei hoch:"
    echo "  ./tailscale-acl-manager-legacy.sh --push"
    echo ""
}

# Geraet auswaehlen
select_device() {
    local action="$1"

    echo -e "\n${BLUE}Wähle ein Gerät zum ${action}en:${NC}\n"

    # Geraete abrufen
    local devices
    devices=$(tailscale status --json 2>/dev/null || true)

    if [[ -z "$devices" ]]; then
        echo -e "${RED}Keine Geräte gefunden. Bitte stelle sicher, dass tailscale läuft.${NC}"
        return 1
    fi

    # Geraete anzeigen
    local count=0
    local node_ids=()
    local hostnames=()

    while IFS= read -r line; do
        local node_id
        node_id=$(echo "$line" | jq -r '.NodeID' 2>/dev/null || true)
        local hostname
        hostname=$(echo "$line" | jq -r '.DNSName // .HostName' 2>/dev/null || true)
        local ip
        ip=$(echo "$line" | jq -r '.TailscaleIPs[0]' 2>/dev/null || true)
        local online
        online=$(echo "$line" | jq -r 'if .Online then "Online" else "Offline" end' 2>/dev/null || true)

        if [[ -n "$node_id" ]]; then
            echo "$((count+1)). $hostname | $ip | $online | Node: ${node_id:0:8}"
            node_ids+=("$node_id")
            hostnames+=("$hostname")
            count=$((count + 1))
        fi
    done < <(printf '%s\n' "$devices" | jq -c '.Peer[]')

    # Selbst hinzufuegen
    local self_node
    self_node=$(echo "$devices" | jq -r '.Self.NodeID' 2>/dev/null || true)
    local self_hostname
    self_hostname=$(echo "$devices" | jq -r '.Self.DNSName // .Self.HostName' 2>/dev/null || true)
    local self_ip
    self_ip=$(echo "$devices" | jq -r '.Self.TailscaleIPs[0]' 2>/dev/null || true)

    if [[ -n "$self_node" ]]; then
        echo "$((count+1)). $self_hostname | $self_ip | Online | Node: ${self_node:0:8} (SELBST)"
        node_ids+=("$self_node")
        hostnames+=("$self_hostname")
        count=$((count + 1))
    fi

    if [[ $count -eq 0 ]]; then
        echo -e "${RED}Keine Geräte zum Auswählen gefunden.${NC}"
        return 1
    fi

    # Auswahl
    read -p "Gib die Nummer (1-$count) oder Node-ID (erste 8 Zeichen) ein: " selection

    if [[ -z "$selection" ]]; then
        echo -e "${RED}Keine Auswahl getroffen.${NC}"
        return 1
    fi

    local selected_node=""
    local selected_hostname=""

    # Pruefen ob Nummer eingegeben wurde
    if [[ "$selection" =~ ^[0-9]+$ ]]; then
        local index=$((selection - 1))
        if [[ $index -ge 0 && $index -lt $count ]]; then
            selected_node="${node_ids[$index]}"
            selected_hostname="${hostnames[$index]}"
        else
            echo -e "${RED}Ungültige Nummer.${NC}"
            return 1
        fi
    else
        # Node-ID suchen
        for i in "${!node_ids[@]}"; do
            if [[ "${node_ids[$i]}" == *"$selection"* ]]; then
                selected_node="${node_ids[$i]}"
                selected_hostname="${hostnames[$i]}"
                break
            fi
        done

        if [[ -z "$selected_node" ]]; then
            echo -e "${RED}Gerät nicht gefunden.${NC}"
            return 1
        fi
    fi

    # Aktion ausfuehren
    if [[ "$action" == "block" ]]; then
        block_device "$selected_node" "$selected_hostname"
    else
        unblock_device "$selected_node" "$selected_hostname"
    fi
}

# ACL-Datei manuell bearbeiten
edit_acl_manually() {
    echo -e "\n${BLUE}===== ACL manuell bearbeiten =====${NC}\n"

    if [[ ! -f "$ACL_FILE" ]]; then
        create_default_acl
    fi

    # Editor oeffnen
    if command -v nano &> /dev/null; then
        nano "$ACL_FILE"
    elif command -v vim &> /dev/null; then
        vim "$ACL_FILE"
    elif command -v vi &> /dev/null; then
        vi "$ACL_FILE"
    else
        echo -e "${RED}Kein Texteditor gefunden (nano, vim, vi).${NC}"
        echo "Die ACL-Datei liegt unter: $ACL_FILE"
        return 1
    fi

    echo -e "\n${GREEN}ACL-Datei bearbeitet.${NC}"
    echo ""
    echo "Um die Änderungen anzuwenden, lade die ACL-Datei hoch:"
    echo "  ./tailscale-acl-manager-legacy.sh --push"
    echo ""
}

# Hilfe anzeigen
show_help() {
    cat << EOF

${BLUE}Tailscale ACL Manager - Legacy Version (für Tailscale < 1.60.0)${NC}

Verwendung: $(basename "$0") [OPTION]

Optionen:
  -h, --help       Diese Hilfe anzeigen
  -l, --list       Geräteliste anzeigen
  -s, --status     ACL-Status (lokal) anzeigen
  -b, --block      Gerät blockieren (interaktiv)
  -u, --unblock    Gerät entblockieren (interaktiv)
  -e, --edit       ACL-Datei manuell bearbeiten
  -d, --download    ACL-Datei herunterladen (manuell)
  -p, --push        ACL-Datei hochladen (manuell)

Beispiele:
  $(basename "$0") --list     # Alle Geräte anzeigen
  $(basename "$0") --block    # Gerät blockieren (interaktiv)
  $(basename "$0") --unblock  # Gerät entblockieren (interaktiv)
  $(basename "$0") --status   # Lokale ACL-Datei anzeigen
  $(basename "$0") --edit     # ACL-Datei bearbeiten
  $(basename "$0") --download # ACL-Datei herunterladen
  $(basename "$0") --push     # ACL-Datei hochladen

Interaktiver Modus:
  Ohne Optionen startet das Skript im interaktiven Modus mit Menü.

Wichtig für Tailscale < 1.60.0:
  - Der 'tailscale acl' Befehl existiert nicht
  - ACL-Dateien müssen manuell in der Admin Console verwaltet werden:
    https://login.tailscale.com/admin/acls
  - Dieses Skript verwaltet die ACL-Datei lokal
  - Änderungen müssen manuell hochgeladen werden

Benötigte Tools:
  - Tailscale CLI (1.102.3 oder höher)
  - jq (für JSON-Verarbeitung)
  - Angemeldet bei Tailscale (tailscale up)

Beispiel-ACL zum Blockieren eines Geräts:
  {
    "action": "drop",
    "src": ["node:node1234567890abcdef"],
    "dst": ["autogroup:all"],
    "comment": "Blocked: hostname"
  }

EOF
}

# Interaktives Hauptmenue
interactive_menu() {
    while true; do
        clear
        echo -e "${BLUE}========================================${NC}"
        echo -e "${BLUE}   Tailscale ACL Manager (Legacy)${NC}"
        echo -e "${BLUE}   Für Tailscale Version < 1.60.0${NC}"
        echo -e "${BLUE}========================================${NC}"
        echo ""
        echo "1. Geräteliste anzeigen"
        echo "2. ACL-Status anzeigen"
        echo "3. Gerät blockieren"
        echo "4. Gerät entblockieren"
        echo "5. ACL-Datei manuell bearbeiten"
        echo "6. ACL-Datei herunterladen"
        echo "7. ACL-Datei hochladen"
        echo "8. Hilfe anzeigen"
        echo "0. Beenden"
        echo ""
        read -p "Wähle eine Option (0-8): " choice

        case "$choice" in
            1)
                show_devices
                read -p "Drücke Enter zum Fortfahren..." 
                ;;
            2)
                show_acls
                read -p "Drücke Enter zum Fortfahren..." 
                ;;
            3)
                select_device "block"
                read -p "Drücke Enter zum Fortfahren..." 
                ;;
            4)
                select_device "unblock"
                read -p "Drücke Enter zum Fortfahren..." 
                ;;
            5)
                edit_acl_manually
                read -p "Drücke Enter zum Fortfahren..." 
                ;;
            6)
                download_acl
                read -p "Drücke Enter zum Fortfahren..." 
                ;;
            7)
                push_acl
                read -p "Drücke Enter zum Fortfahren..." 
                ;;
            8)
                show_help
                read -p "Drücke Enter zum Fortfahren..." 
                ;;
            0)
                echo -e "${GREEN}Auf Wiedersehen!${NC}"
                exit 0
                ;;
            *)
                echo -e "${RED}Ungültige Auswahl. Bitte wähle 0-8.${NC}"
                read -p "Drücke Enter zum Fortfahren..." 
                ;;
        esac
    done
}

# Hauptprogramm
main() {
    # Wenn nur Hilfe angefordert wird, ohne Pruefungen
    if [[ $# -gt 0 && ("$1" == "-h" || "$1" == "--help") ]]; then
        show_help
        exit 0
    fi

    check_tailscale_installed
    check_tailscale_authenticated
    check_jq_installed

    if [[ $# -gt 0 ]]; then
        case "$1" in
            -h|--help)
                show_help
                exit 0
                ;;
            -l|--list)
                show_devices
                exit 0
                ;;
            -s|--status)
                show_acls
                exit 0
                ;;
            -b|--block)
                select_device "block"
                exit $?
                ;;
            -u|--unblock)
                select_device "unblock"
                exit $?
                ;;
            -e|--edit)
                edit_acl_manually
                exit $?
                ;;
            -d|--download)
                download_acl
                exit $?
                ;;
            -p|--push)
                push_acl
                exit $?
                ;;
            *)
                echo -e "${RED}Unbekannte Option: $1${NC}"
                echo "Verwende --help für die verfügbaren Optionen."
                exit 1
                ;;
        esac
    else
        # Interaktiver Modus
        interactive_menu
    fi
}

# Skript starten
main "$@"
