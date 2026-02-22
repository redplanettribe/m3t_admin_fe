---
name: add-api-hook
description: Add a TanStack Query hook for an API endpoint. Use when integrating a new backend endpoint, CRUD operation, or when the user asks for an API hook or data fetching.
---

# Add API Hook

Add a TanStack Query hook for a backend endpoint following project conventions.

## API contract

The backend API spec lives in the repo at `docs/api/swagger.json`. When adding or changing a hook, read that file (or reference `@docs/api/swagger.json`) for endpoints, request body schemas (e.g. `CreateEventRequest`, `LoginRequest`), and response shape (`APIResponse` / `APIError`). Type the hook to match these definitions.

## Query key convention

- Define keys in a central module (e.g. `src/lib/queryKeys.ts`).
- Use a factory object (e.g. `events: { list: (filters?) => [...], detail: (id) => [...] }`) so keys are consistent and easy to invalidate.

## useQuery pattern

- Create a hook (e.g. `useEvents`, `useEvent(id)`) that calls `useQuery` with:
  - `queryKey` from the central factory
  - `queryFn` that fetches (e.g. `fetch` or project API client) and returns typed data
- Export the hook from `src/hooks/` (or a feature-specific hooks file).
- Type the response; do not use `any`.

## useMutation pattern

- For create/update/delete, use `useMutation` with:
  - `mutationFn` that calls the API
  - `onSuccess`: invalidate relevant query keys (e.g. `queryClient.invalidateQueries({ queryKey: queryKeys.events.list() })`) or update the cache
- Type the mutation variables and the API response.
- Return the mutation from the hook so the UI can call `mutate` or `mutateAsync` and handle loading/error.

## Error handling

- Let TanStack Query handle errors; ensure the `queryFn`/`mutationFn` throw on non-2xx so `isError` and `error` are set.
- Optionally map API error shape to a user-friendly message in the UI.
