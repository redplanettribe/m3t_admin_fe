import { z } from "zod"

export const addTeamMemberSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
})

export type AddTeamMemberFormValues = z.infer<typeof addTeamMemberSchema>
