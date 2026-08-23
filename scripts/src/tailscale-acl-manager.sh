#!/bin/bash

# Tailscale ACL Manager
# Ein einfaches Bash-Skript zur Verwaltung von Tailscale ACLs
# Erlaubt das Blockieren und Freigeben einzelner Geräte
#
# Verwendung: ./tailscale-acl-manager.sh [OPTION]
#
# Optionen:
#   -h, --help       Diese Hilfe anzeigen
#   -l, --list       Geräteliste anzeigen
#   -s, --status     ACL-Status anzeigen
#   -b, --block      Gerät blockieren (interaktiv)
#   -u, --unblock    Gerät entblockieren (interaktiv)
#   -e, --edit       ACL-Datei manuell bearbeiten

set -euo pipefail

# Farben für die Ausgabe
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Pruefen ob Admin-Rechte vorhanden sind
check_admin_rights() {
    if ! tailscale acl list &> /dev/null; then
        echo -e "${RED}Fehler: Keine Admin-Rechte im Tailscale-Netzwerk.${NC}"
        echo "Dieses Skript benoetigt Admin-Rechte um ACLs zu verwalten."
        exit 1
    fi
}

# Alle Geraete anzeigen
show_devices() {
    echo -e "\n${BLUE}===== Geraeteliste =====${NC}\n"
    tailscale status
    echo ""
}

# Aktuelle ACLs anzeigen
show_acls() {
    echo -e "\n${BLUE}===== Aktuelle ACLs =====${NC}\n"
    if ! tailscale acl list &> /dev/null; then
        echo -e "${YELLOW}Keine benutzerdefinierten ACLs gefunden.${NC}"
        echo "Standard-ACLs sind aktiv."
        return
    fi
    tailscale acl list
    echo ""
}

# Geraet blockieren
block_device() {
    local node_id="$1"
    local hostname="$2"
    local short_id="${node_id:0:8}"

    if [[ -z "$node_id" ]]; then
        echo -e "${RED}Fehler: Keine Node-ID angegeben.${NC}"
        return 1
    fi

    local acl_file="tailscale-acl-$(date +%s).json"

    if ! tailscale acl list &> /dev/null; then
        cat > "$acl_file" << 'EOF'
{
  "acls": [
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
    else
        tailscale acl list > "$acl_file" 2>/dev/null
    fi

    if grep -q "node:${node_id}" "$acl_file" 2>/dev/null; then
        local action
        action=$(grep "node:${node_id}" "$acl_file" | grep -o '"action": *"[^"]*"' | head -1 | cut -d'"' -f4)
        if [[ "$action" == "drop" ]]; then
            echo -e "${YELLOW}Geraet $short_id ist bereits blockiert.${NC}"
            rm -f "$acl_file"
            return 0
        fi
    fi

    local block_rule
    if [[ -n "$hostname" ]]; then
        block_rule="    {\n      \"action\": \"drop\",\n      \"src\": [\"node:${node_id}\"],\n      \"dst\": [\"autogroup:all\"],\n      \"comment\": \"Blocked: ${hostname}\"\n    }"
    else
        block_rule="    {\n      \"action\": \"drop\",\n      \"src\": [\"node:${node_id}\"],\n      \"dst\": [\"autogroup:all\"]\n    }"
    fi

    sed -i "/^}/i\\n${block_rule}," "$acl_file"

    echo -e "${YELLOW}Blockiere Geraet $short_id...${NC}"
    if tailscale acl push "$acl_file" 2>/dev/null; then
        echo -e "${GREEN}Geraet $short_id erfolgreich blockiert.${NC}"
    else
        echo -e "${RED}Fehler beim Blockieren des Geraets.${NC}"
        echo "Bitte pruefe deine Admin-Rechte und die ACL-Syntax."
        rm -f "$acl_file"
        return 1
    fi

    rm -f "$acl_file"
}

# Geraet entblockieren
unblock_device() {
    local node_id="$1"
    local hostname="$2"
    local short_id="${node_id:0:8}"

    if [[ -z "$node_id" ]]; then
        echo -e "${RED}Fehler: Keine Node-ID angegeben.${NC}"
        return 1
    fi

    local acl_file="tailscale-acl-$(date +%s).json"

    if ! tailscale acl list &> /dev/null; then
        echo -e "${YELLOW}Keine benutzerdefinierten ACLs gefunden.${NC}"
        return 0
    fi

    tailscale acl list > "$acl_file" 2>/dev/null

    if ! grep -q "node:${node_id}" "$acl_file" 2>/dev/null; then
        echo -e "${YELLOW}Geraet $short_id ist nicht blockiert.${NC}"
        rm -f "$acl_file"
        return 0
    fi

    local line_start
    line_start=$(grep -n "node:${node_id}" "$acl_file" | head -1 | cut -d: -f1)
    local line_end
    line_end=$(awk -v start="$line_start" 'NR>=start {print NR; if (/^    },?$/) exit}' "$acl_file" | tail -1)

    if [[ -n "$line_start" && -n "$line_end" ]]; then
        sed -i "${line_start},${line_end}d" "$acl_file"
    fi

    echo -e "${YELLOW}Entblockiere Geraet $short_id...${NC}"
    if tailscale acl push "$acl_file" 2>/dev/null; then
        echo -e "${GREEN}Geraet $short_id erfolgreich entblockiert.${NC}"
    else
        echo -e "${RED}Fehler beim Entblockieren des Geraets.${NC}"
        echo "Bitte pruefe deine Admin-Rechte und die ACL-Syntax."
        rm -f "$acl_file"
        return 1
    fi

    rm -f "$acl_file"
}

# Geraet auswaehlen
select_device() {
    local action="$1"
    echo -e "\n${BLUE}Waehle ein Geraet zum ${action}en:${NC}\n"

    local devices
    devices=$(tailscale status --json 2>/dev/null || true)

    if [[ -z "$devices" ]]; then
        echo -e "${RED}Keine Geraete gefunden. Bitte stelle sicher, dass tailscale laeuft.${NC}"
        return 1
    fi

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
        echo -e "${RED}Keine Geraete zum Auswaehlen gefunden.${NC}"
        return 1
    fi

    read -p "Gib die Nummer (1-$count) oder Node-ID (erste 8 Zeichen) ein: " selection

    if [[ -z "$selection" ]]; then
        echo -e "${RED}Keine Auswahl getroffen.${NC}"
        return 1
    fi

    local selected_node=""
    local selected_hostname=""

    if [[ "$selection" =~ ^[0-9]+$ ]]; then
        local index=$((selection - 1))
        if [[ $index -ge 0 && $index -lt $count ]]; then
            selected_node="${node_ids[$index]}"
            selected_hostname="${hostnames[$index]}"
        else
            echo -e "${RED}Ungueltige Nummer.${NC}"
            return 1
        fi
    else
        for i in "${!node_ids[@]}"; do
            if [[ "${node_ids[$i]}" == *"$selection"* ]]; then
                selected_node="${node_ids[$i]}"
                selected_hostname="${hostnames[$i]}"
                break
            fi
        done

        if [[ -z "$selected_node" ]]; then
            echo -e "${RED}Geraet nicht gefunden.${NC}"
            return 1
        fi
    fi

    if [[ "$action" == "block" ]]; then
        block_device "$selected_node" "$selected_hostname"
    else
        unblock_device "$selected_node" "$selected_hostname"
    fi
}

# ACL-Datei manuell bearbeiten
edit_acl_manually() {
    echo -e "\n${BLUE}===== ACL manuell bearbeiten =====${NC}\n"

    local acl_file="tailscale-acl-$(date +%s).json"

    if ! tailscale acl list &> /dev/null; then
        cat > "$acl_file" << 'EOF'
{
  "acls": [
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
        echo "Standard-ACL-Datei erstellt."
    else
        tailscale acl list > "$acl_file" 2>/dev/null
        echo "Aktuelle ACL-Datei heruntergeladen."
    fi

    if command -v nano &> /dev/null; then
        nano "$acl_file"
    elif command -v vim &> /dev/null; then
        vim "$acl_file"
    elif command -v vi &> /dev/null; then
        vi "$acl_file"
    else
        echo -e "${RED}Kein Texteditor gefunden (nano, vim, vi).${NC}"
        echo "Die ACL-Datei liegt unter: $acl_file"
        return 1
    fi

    read -p "Moechtest du die geaenderte ACL anwenden? (j/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Jj]$ ]]; then
        echo -e "${YELLOW}Wende ACL-Aenderungen an...${NC}"
        if tailscale acl push "$acl_file" 2>/dev/null; then
            echo -e "${GREEN}ACL erfolgreich aktualisiert.${NC}"
        else
            echo -e "${RED}Fehler beim Anwenden der ACL.${NC}"
            echo "Bitte pruefe deine Admin-Rechte und die JSON-Syntax."
        fi
    fi

    rm -f "$acl_file"
}

# Hilfe anzeigen
show_help() {
    cat << EOF

Tailscale ACL Manager - Hilfe

Verwendung: $(basename "$0") [OPTION]

Optionen:
  -h, --help       Diese Hilfe anzeigen
  -l, --list       Geraeteliste anzeigen
  -s, --status     ACL-Status anzeigen
  -b, --block      Geraet blockieren (interaktiv)
  -u, --unblock    Geraet entblockieren (interaktiv)
  -e, --edit       ACL-Datei manuell bearbeiten

Beispiele:
  $(basename "$0") --list    # Alle Geraete anzeigen
  $(basename "$0") --block   # Geraet blockieren (interaktiv)
  $(basename "$0") --unblock # Geraet entblockieren (interaktiv)
  $(basename "$0") --status  # Aktuelle ACLs anzeigen
  $(basename "$0") --edit    # ACL-Datei manuell bearbeiten

Interaktive Modi:
  Ohne Optionen startet das Skript im interaktiven Modus mit Menue.

Benötigte Rechte:
  - Tailscale CLI installiert
  - Angemeldet bei Tailscale (tailscale up)
  - Admin-Rechte im Tailscale-Netzwerk

Beispiel-ACL zum Blockieren eines Geraets:
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
        echo -e "${BLUE}     Tailscale ACL Manager${NC}"
        echo -e "${BLUE}========================================${NC}"
        echo ""
        echo "1. Geraeteliste anzeigen"
        echo "2. Aktuelle ACLs anzeigen"
        echo "3. Geraet blockieren"
        echo "4. Geraet entblockieren"
        echo "5. ACL-Datei manuell bearbeiten"
        echo "6. Hilfe anzeigen"
        echo "0. Beenden"
        echo ""
        read -p "Waehle eine Option (0-6): " choice

        case "$choice" in
            1)
                show_devices
                read -p "Druecke Enter zum Fortfahren..." 
                ;;
            2)
                show_acls
                read -p "Druecke Enter zum Fortfahren..." 
                ;;
            3)
                select_device "block"
                read -p "Druecke Enter zum Fortfahren..." 
                ;;
            4)
                select_device "unblock"
                read -p "Druecke Enter zum Fortfahren..." 
                ;;
            5)
                edit_acl_manually
                read -p "Druecke Enter zum Fortfahren..." 
                ;;
            6)
                show_help
                read -p "Druecke Enter zum Fortfahren..." 
                ;;
            0)
                echo -e "${GREEN}Auf Wiedersehen!${NC}"
                exit 0
                ;;
            *)
                echo -e "${RED}Ungueltige Auswahl. Bitte waehle 0-6.${NC}"
                read -p "Druecke Enter zum Fortfahren..." 
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
    check_admin_rights

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
            *)
                echo -e "${RED}Unbekannte Option: $1${NC}"
                echo "Verwende --help fuer die verfuegbaren Optionen."
                exit 1
                ;;
        esac
    else
        interactive_menu
    fi
}

# Skript starten
main "$@"
