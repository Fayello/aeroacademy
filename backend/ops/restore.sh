#!/bin/bash
set -euo pipefail

BACKUP_DIR=/root/backups
CONTAINER="aeroacademy-db-1"
DB_USER="user"
DB_NAME="aeroacademy"

usage() {
  echo "Usage: $0 <backup_file|latest|list>"
  echo ""
  echo "  list                  List available backups"
  echo "  latest                Restore the most recent backup"
  echo "  <backup_file.sql.gz>  Restore a specific backup"
  echo ""
  echo "Examples:"
  echo "  $0 list"
  echo "  $0 latest"
  echo "  $0 aeroacademy_20260904_020002.sql.gz"
  exit 1
}

list_backups() {
  echo "Available backups:"
  echo "---"
  ls -lhS "$BACKUP_DIR"/aeroacademy_*.sql.gz 2>/dev/null | awk '{print $5, $NF}' | sed 's|.*/||'
  echo "---"
  echo "Total: $(ls "$BACKUP_DIR"/aeroacademy_*.sql.gz 2>/dev/null | wc -l) backups"
}

do_restore() {
  local BACKUP_FILE="$1"

  if [ ! -f "$BACKUP_FILE" ]; then
    BACKUP_FILE="$BACKUP_DIR/$BACKUP_FILE"
  fi

  if [ ! -f "$BACKUP_FILE" ]; then
    echo "ERROR: Backup file not found: $BACKUP_FILE"
    exit 1
  fi

  echo "=== Pre-restore safety dump ==="
  SAFETY="$BACKUP_DIR/pre-restore-$(date +%Y%m%d_%H%M%S).sql.gz"
  docker exec "$CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" --no-owner --no-privileges 2>/dev/null | gzip -9 > "$SAFETY"
  echo "Safety backup: $SAFETY ($(du -h "$SAFETY" | cut -f1))"

  echo ""
  echo "=== Verifying backup file ==="
  if ! gzip -t "$BACKUP_FILE" 2>/dev/null; then
    echo "ERROR: Backup file is corrupted"
    exit 1
  fi
  echo "Integrity: OK"

  echo ""
  echo "=== Dropping and recreating database ==="
  docker exec "$CONTAINER" psql -U "$DB_USER" -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='$DB_NAME' AND pid <> pg_backend_pid();" 2>/dev/null || true
  docker exec "$CONTAINER" psql -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"
  docker exec "$CONTAINER" psql -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"

  echo ""
  echo "=== Restoring from $BACKUP_FILE ==="
  zcat "$BACKUP_FILE" | docker exec -i "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" --quiet 2>&1 | tail -5

  echo ""
  echo "=== Verify table count ==="
  TABLE_COUNT=$(docker exec "$CONTAINER" psql -U "$DB_USER" -d $DB_NAME -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null | tr -d ' ')
  echo "Tables restored: $TABLE_COUNT"

  echo ""
  echo "=== Restore complete ==="
  echo "Safety backup saved at: $SAFETY"
}

case "${1:-}" in
  list)
    list_backups
    ;;
  latest)
    LATEST=$(ls -t "$BACKUP_DIR"/aeroacademy_*.sql.gz 2>/dev/null | head -1)
    if [ -z "$LATEST" ]; then
      echo "No backups found"
      exit 1
    fi
    echo "Restoring latest: $(basename "$LATEST")"
    do_restore "$LATEST"
    ;;
  ""|-h|--help)
    usage
    ;;
  *)
    do_restore "$1"
    ;;
esac
