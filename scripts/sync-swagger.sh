#!/usr/bin/env bash
set -e

SPEC_URL="https://raw.githubusercontent.com/redplanettribe/m3t_admin_fe/refs/heads/main/docs/api/swagger.json"
OUT_DIR="docs/api"
OUT_FILE="${OUT_DIR}/swagger.json"

mkdir -p "$OUT_DIR"
if curl -f -sS -o "$OUT_FILE" "$SPEC_URL"; then
  echo "OK: API spec written to ${OUT_FILE}"
else
  echo "ERROR: Failed to fetch or write API spec from ${SPEC_URL}" >&2
  exit 1
fi
