#!/bin/bash
set -e

MODE="$1"
case "$MODE" in
  ips)
    echo "Switching to IPS mode (NFQ)..."
    systemctl stop suricata 2>/dev/null || true
    iptables -I INPUT 1 -j NFQUEUE --queue-num 0 --queue-bypass
    iptables -I FORWARD 1 -j NFQUEUE --queue-num 0 --queue-bypass
    systemctl start suricata-ips
    echo "IPS mode active. Suricata is now dropping malicious packets."
    ;;
  ids)
    echo "Switching to IDS mode (AF_PACKET)..."
    systemctl stop suricata-ips 2>/dev/null || true
    iptables -D INPUT -j NFQUEUE --queue-num 0 --queue-bypass 2>/dev/null || true
    iptables -D FORWARD -j NFQUEUE --queue-num 0 --queue-bypass 2>/dev/null || true
    systemctl start suricata
    echo "IDS mode active. Suricata is monitoring only."
    ;;
  status)
    echo "=== Suricata IPS ==="
    systemctl is-active suricata-ips 2>/dev/null || echo "inactive"
    echo "=== Suricata IDS ==="
    systemctl is-active suricata 2>/dev/null || echo "inactive"
    echo "=== NFQUEUE rules ==="
    iptables -L INPUT -n | grep NFQUEUE || echo "none"
    ;;
  *)
    echo "Usage: $0 {ips|ids|status}"
    exit 1
    ;;
esac
