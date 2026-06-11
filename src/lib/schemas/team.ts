import { z } from "zod"

export const addTeamMembersSchema = z.object({
  emails: z.string().trim().min(1, "Enter at least one email"),
})

export type AddTeamMembersFormValues = z.infer<typeof addTeamMembersSchema>
