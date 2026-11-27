#!/usr/bin/env bash
# One-shot root steps for mcadmin.palvi.org. Run: sudo /programming/mc-server/deploy-root.sh
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p /mnt/media/backups/minecraft
chown 1000:1000 /mnt/media/backups/minecraft
(cd helper && bash ./install.sh)
install -m 0755 mc-watch/mc-watch /usr/local/bin/mc-watch
install -m 0644 mc-watch/mc-watch.service /etc/systemd/system/mc-watch.service
systemctl daemon-reload
systemctl restart mc-watch
sleep 2
cat /run/mc-watch/state.json
ls -l /run/mc-admin-helper/helper.sock
