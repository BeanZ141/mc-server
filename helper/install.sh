#!/usr/bin/env bash
# Helper installation script for palviserver
set -euo pipefail

if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root (sudo ./install.sh)" 
   exit 1
fi

echo "Creating container data directory..."
mkdir -p /opt/containers/mc-panel
chown 1000:1000 /opt/containers/mc-panel
chmod 0700 /opt/containers/mc-panel

echo "Installing mc-admin-helper..."
install -m 0755 mc-admin-helper /usr/local/bin/mc-admin-helper

echo "Installing systemd socket and service units..."
install -m 0644 mc-admin-helper.socket /etc/systemd/system/mc-admin-helper.socket
install -m 0644 mc-admin-helper@.service /etc/systemd/system/mc-admin-helper@.service

mkdir -p /run/mc-admin-helper
chown root:1000 /run/mc-admin-helper
chmod 0755 /run/mc-admin-helper

systemctl daemon-reload
systemctl enable --now mc-admin-helper.socket

echo "mc-admin-helper socket is active and listening at /run/mc-admin-helper/helper.sock"
