#!/bin/sh
set -e

main() {
  REPO="Sirbuschi2003/machineflow"
  BRANCH="master"
  INSTALL_DIR="$(cd "$(dirname "$0")" && pwd)"

  # Detect docker compose command
  if command -v docker-compose > /dev/null 2>&1; then
    COMPOSE="docker-compose"
  elif docker compose version > /dev/null 2>&1; then
    COMPOSE="docker compose"
  else
    echo "FEHLER: Weder 'docker-compose' noch 'docker compose' gefunden!"
    exit 1
  fi

  echo "╔══════════════════════════════════════╗"
  echo "║       MachineFlow – Update           ║"
  echo "╚══════════════════════════════════════╝"
  echo "  (Compose: $COMPOSE)"

  echo ""
  echo "▶ Lade neueste Version von GitHub..."
  curl -fsSL "https://github.com/${REPO}/archive/refs/heads/${BRANCH}.tar.gz" -o /tmp/machineflow.tar.gz

  echo "▶ Entpacke Dateien..."
  tar -xzf /tmp/machineflow.tar.gz -C /tmp/

  echo "▶ Kopiere Dateien (update.sh wird nicht überschrieben)..."
  find /tmp/machineflow-${BRANCH} -mindepth 1 -maxdepth 1 ! -name 'update.sh' -exec cp -rf {} "${INSTALL_DIR}/" \;
  rm -rf /tmp/machineflow.tar.gz /tmp/machineflow-${BRANCH}

  cd "${INSTALL_DIR}"

  echo ""
  echo "▶ Baue Images..."
  $COMPOSE build

  echo ""
  echo "▶ Starte Container..."
  $COMPOSE up -d

  echo ""
  echo "▶ Warte auf Datenbankmigrationen..."
  sleep 8

  echo ""
  echo "▶ Container-Status:"
  $COMPOSE ps

  echo ""
  echo "✓ Update abgeschlossen!"
}

main
