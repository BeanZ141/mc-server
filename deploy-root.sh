#!/usr/bin/env bash
# One-shot root steps for mcadmin.palvi.org. Run: sudo /programming/mc-server/deploy-root.sh
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p /mnt/media/backups/minecraft
chown 1000:1000 /mnt/media/backups/minecraft
rm -f /opt/stacks/minecraft/mc.env.tmp.*   # leftovers from failed write-env runs
(cd helper && bash ./install.sh)
# media-stop stops everything not in KEEP: keep the panel alive (idempotent)
grep -q 'mc-panel' /usr/local/bin/media-stop || sed -i 's/^KEEP="\(.*\)"\(.*\)$/KEEP="\1 mc-panel mc-socket-proxy"\2/' /usr/local/bin/media-stop
grep -n '^KEEP=' /usr/local/bin/media-stop
install -m 0755 mc-watch/mc-watch /usr/local/bin/mc-watch
install -m 0644 mc-watch/mc-watch.service /etc/systemd/system/mc-watch.service
systemctl daemon-reload
systemctl restart mc-watch
sleep 2
cat /run/mc-watch/state.json
ls -l /run/mc-admin-helper/helper.sock
