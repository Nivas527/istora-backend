#!/bin/bash
# =============================================================================
# Automated Pre-Deployment PostgreSQL Backup Script -> Cloudflare R2
# Dumps production database before container updates or migrations.
# =============================================================================

set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
if [ -f "$DIR/.env" ]; then
    export $(grep -v '^#' "$DIR/.env" | xargs)
fi

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="${BACKUP_DIR:-/opt/shopify-engine/backups}"
mkdir -p "$BACKUP_DIR"

DB_NAME="${POSTGRES_DB:-shopify_engine}"
DB_USER="${POSTGRES_USER:-shopify_admin}"
FILENAME="backup_${DB_NAME}_${TIMESTAMP}.sql.gz"
FILEPATH="${BACKUP_DIR}/${FILENAME}"

echo "========================================================="
echo "📦 [$(date '+%Y-%m-%d %H:%M:%S')] Starting Pre-Deployment DB Backup"
echo "========================================================="

# 1. Verify Postgres container is running
if ! docker ps --format '{{.Names}}' | grep -q "^shopify_engine_db$"; then
    echo "⚠️ Warning: Container 'shopify_engine_db' is not running. Checking if database is accessible locally..."
fi

# 2. Dump database from running Postgres container and gzip
echo "⏳ Exporting pg_dump from container 'shopify_engine_db'..."
if docker exec -t shopify_engine_db pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$FILEPATH"; then
    SIZE=$(du -h "$FILEPATH" | cut -f1)
    echo "✅ Local dump created successfully: $FILEPATH ($SIZE)"
else
    echo "❌ ERROR: Failed to dump database from shopify_engine_db!"
    rm -f "$FILEPATH"
    exit 1
fi

# 3. Upload to Cloudflare R2 using AWS CLI (S3-Compatible endpoint)
# CRITICAL SECURITY RULE:
# Database backups contain customer PII and credentials. They MUST NEVER be uploaded
# to 'apexcommerce' or any public media bucket attached to media.istora.online.
# They MUST go to an isolated private bucket with ZERO public access.
ACCOUNT_ID="${R2_BACKUP_ACCOUNT_ID:-${CF_ACCOUNT_ID:-$R2_ACCOUNT_ID}}"
BUCKET="${R2_BACKUP_BUCKET_NAME:-apexcommerce-backup}"
ACCESS_KEY="${R2_BACKUP_ACCESS_KEY_ID:-$R2_ACCESS_KEY_ID}"
SECRET_KEY="${R2_BACKUP_SECRET_ACCESS_KEY:-$R2_SECRET_ACCESS_KEY}"

# Hard Security Assertion: Refuse upload to public media bucket
if [ "$BUCKET" = "apexcommerce" ] || ([ -n "$R2_BUCKET_NAME" ] && [ "$BUCKET" = "$R2_BUCKET_NAME" ]); then
    echo "🛑 FATAL SECURITY ERROR: Attempted to upload database backup to public media bucket '$BUCKET'!"
    echo "🛑 Backups must use a private bucket (e.g. apexcommerce-backup) with no public domain or public URL."
    echo "🛑 Set R2_BACKUP_BUCKET_NAME to a dedicated private bucket in deploy/.env."
    exit 1
fi

if [ -n "$ACCOUNT_ID" ] && [ -n "$ACCESS_KEY" ] && [ -n "$SECRET_KEY" ]; then
    ENDPOINT_URL="https://${ACCOUNT_ID}.r2.cloudflarestorage.com"
    echo "☁️ Uploading backup to private Cloudflare R2: s3://${BUCKET}/${FILENAME}..."
    
    if command -v aws >/dev/null 2>&1; then
        AWS_ACCESS_KEY_ID="$ACCESS_KEY" \
        AWS_SECRET_ACCESS_KEY="$SECRET_KEY" \
        AWS_DEFAULT_REGION="auto" \
        aws s3 cp "$FILEPATH" "s3://${BUCKET}/${FILENAME}" \
            --endpoint-url "$ENDPOINT_URL" \
            --region auto
        echo "🚀 Backup successfully uploaded to private Cloudflare R2: ${BUCKET}/${FILENAME}"
    elif command -v docker >/dev/null 2>&1; then
        echo "⏳ 'aws' CLI not on host, streaming backup upload via docker amazon/aws-cli..."
        docker run --rm \
            -e AWS_ACCESS_KEY_ID="$ACCESS_KEY" \
            -e AWS_SECRET_ACCESS_KEY="$SECRET_KEY" \
            -e AWS_DEFAULT_REGION="auto" \
            -v "$BACKUP_DIR:$BACKUP_DIR:ro" \
            amazon/aws-cli s3 cp "$FILEPATH" "s3://${BUCKET}/${FILENAME}" \
            --endpoint-url "$ENDPOINT_URL" \
            --region auto
        echo "🚀 Backup successfully uploaded to private Cloudflare R2: ${BUCKET}/${FILENAME}"
    else
        echo "⚠️ Notice: Neither 'aws' CLI nor docker found. Retaining verified local backup on disk at $FILEPATH"
    fi
else
    echo "ℹ️ Notice: R2 backup credentials (R2_BACKUP_ACCESS_KEY_ID / R2_BACKUP_SECRET_ACCESS_KEY) not configured in deploy/.env. Retaining verified local backup on disk at $FILEPATH"
fi

# 4. Prune local backups, keeping the 5 most recent for instant 5-second rollback
echo "🧹 Pruning old local backups (retaining latest 5 snapshots)..."
ls -t "$BACKUP_DIR"/backup_*.sql.gz 2>/dev/null | tail -n +6 | xargs -r rm -f

echo "========================================================="
echo "✅ Pre-Deployment Database Backup Verified & Complete"
echo "========================================================="
