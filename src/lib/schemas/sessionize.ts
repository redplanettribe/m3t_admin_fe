import { z } from "zod"

export const sessionizeImportSchema = z.object({
  sessionizeId: z
    .string()
    .length(8, "Sessionize API ID must be exactly 8 characters"),
})

export type SessionizeImportFormValues = z.infer<typeof sessionizeImportSchema>
