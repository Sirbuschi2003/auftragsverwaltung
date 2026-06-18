#!/bin/sh
set -e

main() {
  REPO="Sirbuschi2003/machineflow"
  BRANCH="master"
  INSTALL_DIR="$(cd "$(dirname "$0")" && pwd)"
  COMPOSE="/usr/libexec/docker/cli-plugins/docker-compose"

  echo "MachineFlow - Update"
  echo "--------------------"

  echo "Lade neueste Version von GitHub..."
  curl -fsSL "https://github.com/${REPO}/archive/refs/heads/${BRANCH}.tar.gz" -o /tmp/machineflow.tar.gz

  echo "Entpacke Dateien..."
  tar -xzf /tmp/machineflow.tar.gz -C /tmp/
  find /tmp/machineflow-${BRANCH} -mindepth 1 -maxdepth 1 ! -name 'update.sh' -exec cp -rf {} "${INSTALL_DIR}/" \;
  rm -rf /tmp/machineflow.tar.gz /tmp/machineflow-${BRANCH}

  cd "${INSTALL_DIR}"

  echo "Baue Images..."
  $COMPOSE build

  echo "Starte Container..."
  $COMPOSE up -d

  echo "Warte auf Migrationen..."
  sleep 8

  echo "Status:"
  $COMPOSE ps

  echo "Fertig!"
}

main
