import { z } from "zod"

export const createUgcSocialNetworkSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Code is required")
    .max(64, "Code must be at most 64 characters")
    .regex(
      /^[a-z][a-z0-9_-]*$/,
      "Code must start with a letter and contain only lowercase letters, numbers, hyphens, or underscores"
    ),
  display_name: z.string().trim().min(1, "Display name is required"),
})

export type CreateUgcSocialNetworkFormValues = z.infer<typeof createUgcSocialNetworkSchema>
