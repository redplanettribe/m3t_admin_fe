import { z } from "zod"

export const createEventSchema = z.object({
  name: z.string().min(1, "Name is required"),
})

export type CreateEventFormValues = z.infer<typeof createEventSchema>

export const sendInvitationsSchema = z.object({
  emails: z.string().trim().min(1, "Enter at least one email"),
})

export type SendInvitationsFormValues = z.infer<typeof sendInvitationsSchema>
