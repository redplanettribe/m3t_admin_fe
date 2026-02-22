---
name: add-form-with-validation
description: Add an admin form with validation (e.g. create/edit event, settings). Use when building forms that submit to the API with client-side validation.
---

# Add Form with Validation

Add a form using shadcn form components and Zod validation, submitting via TanStack Query mutation.

## Steps

1. **Schema**: Define a **Zod** schema for the form (e.g. `eventSchema`, `settingsSchema`). Match fields to the API payload where applicable; use Zod for types and validation.

2. **Form UI**: Use shadcn form components (e.g. `Form`, `FormField`, `FormItem`, `FormControl`, `FormMessage`). If the project uses the shadcn form pattern with `react-hook-form` and `zodResolver`, follow that: `useForm` with `zodResolver(schema)` and pass control to `FormField`.

3. **Submit**: On submit, call the **mutation** from a TanStack Query hook (e.g. `useCreateEvent`, `useUpdateEvent`). Use `mutate` or `mutateAsync` with the validated form values. On success, invalidate relevant queries (e.g. event list or detail) so the UI updates.

4. **Loading and error**: Disable the submit button while the mutation is pending. Show mutation error (e.g. toast or inline message) when `isError`; optionally map API errors to field-level messages.

## Conventions

- Colocate the schema with the form or in a shared `schemas` file; export the inferred TypeScript type with `z.infer<typeof schema>`.
- Use existing shadcn form components from `@/components/ui`; style with Tailwind.
- Keep form components in `src/components/` or next to the page that uses them.
