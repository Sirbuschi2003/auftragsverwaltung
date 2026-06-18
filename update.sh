#!/bin/sh
set -e

REPO="Sirbuschi2003/machineflow"
BRANCH="master"
INSTALL_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "╔══════════════════════════════════════╗"
echo "║       MachineFlow – Update           ║"
echo "╚══════════════════════════════════════╝"

echo ""
echo "▶ Lade neueste Version von GitHub..."
curl -fsSL "https://github.com/${REPO}/archive/refs/heads/${BRANCH}.tar.gz" -o /tmp/machineflow.tar.gz

echo "▶ Entpacke Dateien..."
tar -xzf /tmp/machineflow.tar.gz -C /tmp/
cp -rf /tmp/machineflow-${BRANCH}/. "${INSTALL_DIR}/"
rm -rf /tmp/machineflow.tar.gz /tmp/machineflow-${BRANCH}

echo ""
echo "▶ Baue und starte Container neu..."
cd "${INSTALL_DIR}"
docker compose up --build -d

echo ""
echo "▶ Warte auf Datenbankmigrationen..."
sleep 5

echo ""
echo "▶ Container-Status:"
docker compose ps

echo ""
echo "✓ Update abgeschlossen!"
echo "  App erreichbar unter: http://$(hostname -i 2>/dev/null | awk '{print $1}' || echo '<NAS-IP>'):5174"
