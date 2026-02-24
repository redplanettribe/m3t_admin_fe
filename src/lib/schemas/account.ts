import { z } from "zod"

export const updateProfileSchema = z.object({
  name: z.string().optional(),
  last_name: z.string().optional(),
})

export type UpdateProfileFormValues = z.infer<typeof updateProfileSchema>
