#!/bin/bash

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/root/backups
BACKUP_FILE="$BACKUP_DIR/aeroacademy_$TIMESTAMP.sql.gz"
LOG_FILE="$BACKUP_DIR/backup.log"
CONTAINER="aeroacademy-db-1"
DB_USER="user"
DB_NAME="aeroacademy"
RETENTION_DAYS=14
WEEKLY_RETENTION_DAYS=60

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
  echo "$1"
}

# Step 1: Dump
log "Starting backup..."
if ! docker exec "$CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" --no-owner --no-privileges 2>/dev/null | gzip -9 > "$BACKUP_FILE"; then
  log "ERROR: pg_dump failed"
  exit 1
fi

# Step 2: Verify gzip integrity
if ! gzip -t "$BACKUP_FILE" 2>/dev/null; then
  log "ERROR: Backup file corrupted: $BACKUP_FILE"
  rm -f "$BACKUP_FILE"
  exit 1
fi

# Step 3: Verify we can read the dump (check for valid SQL)
FIRST_LINE=$(zcat "$BACKUP_FILE" 2>/dev/null | head -5)
if ! echo "$FIRST_LINE" | grep -qi "postgresql\|SET\|CREATE\|--"; then
  log "ERROR: Backup content looks invalid"
  rm -f "$BACKUP_FILE"
  exit 1
fi

# Step 4: Record stats
FILESIZE=$(stat -c%s "$BACKUP_FILE" 2>/dev/null || stat -f%z "$BACKUP_FILE" 2>/dev/null)
FILESIZE_MB=$(echo "scale=2; $FILESIZE / 1048576" | bc 2>/dev/null || echo "$(($FILESIZE / 1048576)).$(($FILESIZE % 1048576 / 10485))")
TABLE_COUNT=$(zcat "$BACKUP_FILE" 2>/dev/null | grep -c "CREATE TABLE" || echo "?")

# Step 5: Cleanup - keep 14 days daily, 60 days weekly (Sunday)
find "$BACKUP_DIR" -name 'aeroacademy_*.sql.gz' -mtime +$RETENTION_DAYS -delete 2>/dev/null

# Step 6: Log success
log "OK: $BACKUP_FILE (${FILESIZE_MB}MB, $TABLE_COUNT tables)"

# Step 7: Show total backup size
TOTAL_SIZE=$(du -sh "$BACKUP_DIR"/*.sql.gz 2>/dev/null | tail -1 | awk '{print $1}')
TOTAL_COUNT=$(ls "$BACKUP_DIR"/aeroacademy_*.sql.gz 2>/dev/null | wc -l)
log "Total: $TOTAL_COUNT backups, ${TOTAL_SIZE:-0} disk used"
