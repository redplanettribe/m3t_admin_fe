# Sync API spec

Run the script that syncs the backend REST API spec into the repo.

1. From the project root, run `./scripts/sync-swagger.sh` or `bash scripts/sync-swagger.sh`. Create `scripts/` or `docs/rest_api/` if they are missing (the script creates `docs/rest_api`).
2. The script fetches https://raw.githubusercontent.com/redplanettribe/m3t_admin_fe/refs/heads/main/docs/rest_api/swagger.json and writes it to `docs/rest_api/swagger.json`.
3. WebSocket contract is checked in at `docs/ws_api/asyncapi.json` (no sync script yet).
4. Report whether the command succeeded or show any error output.
