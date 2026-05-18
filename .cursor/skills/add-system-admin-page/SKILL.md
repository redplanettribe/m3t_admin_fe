---
name: add-system-admin-page
description: Add a new page under /system (platform system_admin). Use when creating system administration screens guarded by RequireSystemAdmin.
---

# Add System Admin Page

Add a page under `/system` for platform (system_admin) users. Follow [system-admin-authorization](.cursor/rules/system-admin-authorization.mdc) for security.

## Steps

1. **Route** — In [src/routes/index.tsx](src/routes/index.tsx), add a child under the existing `/system` branch (`RequireAuth` → `RequireSystemAdmin` → `SystemAdminLayout`). Do not add duplicate guards on each child unless you introduce a new nested layout.

2. **Page** — Create a PascalCase component in `src/pages/` (e.g. `SystemUsersPage.tsx`) or `src/pages/system/` if the section grows.

3. **Navigation** — Add the page to `systemNavMain` in [src/components/SystemAdminLayout.tsx](src/components/SystemAdminLayout.tsx). For cross-link from event admin, optional entry in [AppLayout.tsx](src/components/AppLayout.tsx) inside the `useAdminPing()` success block only. Nav visibility is not security.

4. **API data** — For new endpoints under `/admin/*`: read [docs/api/swagger.json](docs/api/swagger.json), add types, extend `queryKeys.admin`, add a hook in `src/hooks/` using `apiClient`. Expect 403 for non-admins; handle errors in UI.

5. **Review** — Re-read [system-admin-authorization.mdc](.cursor/rules/system-admin-authorization.mdc) before shipping.

## Conventions

- One page per file; use shadcn/ui and Tailwind like other admin pages.
- Match layout patterns from existing pages (e.g. [SettingsPage](src/pages/SettingsPage.tsx)).
