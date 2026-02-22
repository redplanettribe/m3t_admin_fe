---
name: add-admin-page
description: Add a new admin page with routing and layout. Use when creating a new screen, section, or view in the event admin app.
---

# Add Admin Page

Add a new page to the event admin app with routing and layout.

## Steps

1. **Add the route** in the router config (e.g. `src/routes/` or `main.tsx` / `App.tsx` where routes are defined). Use a path that matches the feature (e.g. `/events`, `/events/:id`, `/settings`).

2. **Create the page component** under `src/pages/` with a PascalCase name (e.g. `EventsPage.tsx`, `EventDetailPage.tsx`). Export a single functional component.

3. **Use the app layout** so the new page is rendered inside the main layout (sidebar/nav, etc.). Ensure the route element is wrapped by the layout route or layout component as in the existing setup.

4. **Add navigation** if the page should appear in the sidebar or nav: add a link (e.g. using React Router’s `Link` or `NavLink`) in the layout/nav component with the same path as the route.

## Conventions

- One page per file; place in `src/pages/`.
- Page components can be minimal at first (e.g. a heading and placeholder content); add data fetching and subcomponents in follow-up steps.
- Use existing layout and UI patterns (shadcn, Tailwind) for consistency.
