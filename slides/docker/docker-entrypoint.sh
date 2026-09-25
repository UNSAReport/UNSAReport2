#!/bin/sh
set -e

if [ "${AUTO_MIGRATE:-true}" = "true" ]; then
  echo "Running slides database migrations..."
  bun ./dist/db/migrate.js
fi

exec "$@"
