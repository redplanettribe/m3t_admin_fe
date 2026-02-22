# Sync API spec

Run the script that syncs the backend API spec into the repo.

1. From the project root, run `./scripts/sync-swagger.sh` or `bash scripts/sync-swagger.sh`. Create `scripts/` or `docs/api/` if they are missing (the script creates `docs/api`).
2. The script fetches https://raw.githubusercontent.com/redplanettribe/m3t_be/main/docs/swagger.json and writes it to `docs/api/swagger.json`.
3. Report whether the command succeeded or show any error output.
