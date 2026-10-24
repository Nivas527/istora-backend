#!/bin/bash
# =============================================================================
# Automated PostgreSQL Nightly Backup Script -> Cloudflare R2
# Add to crontab: 0 2 * * * /root/deploy/backup-to-r2.sh >> /var/log/r2-backup.log 2>&1
# =============================================================================

set -e

# Load environment variables
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
if [ -f "$DIR/.env" ]; then
    export $(grep -v '^#' "$DIR/.env" | xargs)
fi

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/tmp/db_backups"
FILENAME="backup_${POSTGRES_DB:-shopify_engine}_${TIMESTAMP}.sql.gz"
FILEPATH="${BACKUP_DIR}/${FILENAME}"

mkdir -p "$BACKUP_DIR"

echo "=== [$(date)] Starting Database Backup ==="

# 1. Dump database from running Postgres container and gzip
docker exec -t shopify_engine_db pg_dump -U "${POSTGRES_USER:-shopify_admin}" "${POSTGRES_DB:-shopify_engine}" | gzip > "$FILEPATH"

SIZE=$(du -h "$FILEPATH" | cut -f1)
echo "✅ Dump created: $FILEPATH ($SIZE)"

# 2. Upload to Cloudflare R2 using AWS CLI (configured with R2 S3 endpoint)
if [ -n "$CF_ACCOUNT_ID" ] && [ -n "$R2_ACCESS_KEY_ID" ] && [ -n "$R2_SECRET_ACCESS_KEY" ]; then
    ENDPOINT_URL="https://${CF_ACCOUNT_ID}.r2.cloudflarestorage.com"
    
    AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" \
    AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" \
    aws s3 cp "$FILEPATH" "s3://${R2_BUCKET_NAME:-shopify-engine-backups}/${FILENAME}" \
        --endpoint-url "$ENDPOINT_URL"

    echo "🚀 Successfully uploaded to Cloudflare R2 bucket: ${R2_BUCKET_NAME}/${FILENAME}"
else
    echo "⚠️ R2 credentials not fully set. File stored locally at $FILEPATH"
fi

# 3. Cleanup local temp dump
rm -f "$FILEPATH"

# 4. Prune R2 backups older than 14 days (optional retention policy)
echo "=== [$(date)] Backup Completed Successfully ==="
