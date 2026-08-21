#!/usr/bin/env bash
# Rebuild a local Postgres database from the migrations in supabase/migrations.
# Applies the local auth shim first so the migrations can run outside Supabase.
set -euo pipefail

DB="${1:-${PGDATABASE:-untitled}}"
HOST="${PGHOST:-127.0.0.1}"
USER="${PGUSER:-app}"
export PGPASSWORD="${PGPASSWORD:-app}"

psql -h "$HOST" -U "$USER" -d postgres -v ON_ERROR_STOP=1 -q \
  -c "drop database if exists \"$DB\" with (force);" -c "create database \"$DB\";"

for f in supabase/local/*.sql supabase/migrations/*.sql; do
  echo "  apply $(basename "$f")"
  psql -h "$HOST" -U "$USER" -d "$DB" -v ON_ERROR_STOP=1 -q -f "$f"
done

echo "database '$DB' rebuilt"
