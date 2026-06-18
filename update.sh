#!/bin/sh
set -e

echo "╔══════════════════════════════════════╗"
echo "║       MachineFlow – Update           ║"
echo "╚══════════════════════════════════════╝"

echo ""
echo "▶ Lade neueste Version von GitHub..."
git pull

echo ""
echo "▶ Baue und starte Container neu..."
docker compose up --build -d

echo ""
echo "▶ Warte auf Datenbankmigrationen..."
sleep 5

echo ""
echo "▶ Container-Status:"
docker compose ps

echo ""
echo "✓ Update abgeschlossen!"
echo "  App erreichbar unter: http://$(hostname -i | awk '{print $1}'):5174"
