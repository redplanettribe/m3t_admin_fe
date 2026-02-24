import { z } from "zod"

export const createEventSchema = z.object({
  name: z.string().min(1, "Name is required"),
})

export type CreateEventFormValues = z.infer<typeof createEventSchema>
