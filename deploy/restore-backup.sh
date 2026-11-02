#!/bin/bash
# =============================================================================
# Instant Database Rollback Script
# Restores a specific or the most recent PostgreSQL backup snapshot.
# Usage: sudo ./restore-backup.sh [/path/to/backup.sql.gz]
# =============================================================================

set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
if [ -f "$DIR/.env" ]; then
    export $(grep -v '^#' "$DIR/.env" | xargs)
fi

BACKUP_DIR="${BACKUP_DIR:-/opt/shopify-engine/backups}"
DB_NAME="${POSTGRES_DB:-shopify_engine}"
DB_USER="${POSTGRES_USER:-shopify_admin}"

TARGET_FILE="$1"
if [ -z "$TARGET_FILE" ]; then
    TARGET_FILE=$(ls -t "$BACKUP_DIR"/backup_*.sql.gz 2>/dev/null | head -n 1)
fi

if [ -z "$TARGET_FILE" ] || [ ! -f "$TARGET_FILE" ]; then
    echo "❌ ERROR: No backup file found in $BACKUP_DIR or file does not exist!"
    exit 1
fi

echo "========================================================="
echo "🔄 Rolling back database '$DB_NAME' to snapshot:"
echo "   File: $TARGET_FILE"
echo "========================================================="

echo "⏳ Restoring database into container 'shopify_engine_db'..."
gunzip -c "$TARGET_FILE" | docker exec -i shopify_engine_db psql -U "$DB_USER" -d "$DB_NAME"

echo "✅ Database rollback complete! Restarting backend-api container..."
docker compose restart backend-api

echo "🎉 Rollback finished and backend restarted successfully."

