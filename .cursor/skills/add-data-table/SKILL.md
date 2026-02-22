---
name: add-data-table
description: Add a data table for events or other entities backed by an API. Use when building a list view, event list, or admin table with server data.
---

# Add Data Table

Add a table that displays list data from the API with loading and error states.

## Steps

1. **Data fetching**: Use TanStack Query (`useQuery`) in a custom hook (e.g. `useEvents`, `useEventRegistrations`). Use the project’s query key factory from `src/lib/queryKeys.ts` (or equivalent). Type the response.

2. **Table UI**: Use shadcn Table components (`Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell`). If the project has a reusable DataTable or list component, use or extend it for consistency.

3. **Loading and error**: Handle `isLoading` and `isError` from the query. Show a loading state (skeleton or spinner) and an error state (message and optional retry). Render the table only when data is successfully loaded.

4. **Optional filters**: If the list supports filtering or search, keep filter state in URL (query params) or local state (e.g. `useState`) and pass to the query (e.g. as query key and variables). Keep filters in sync with the query so refetches use current values.

## Conventions

- Put the query hook in `src/hooks/` and the table component in `src/components/` or inside the page that uses it.
- Prefer shadcn Table for structure; add sorting/pagination later if needed.
- Follow project rules for TypeScript (typed responses) and styling (Tailwind, shadcn).
