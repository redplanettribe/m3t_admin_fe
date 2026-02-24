import { z } from "zod"

export const requestLoginCodeSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
})

export type RequestLoginCodeFormValues = z.infer<typeof requestLoginCodeSchema>

export const verifyLoginCodeSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  code: z.string().min(1, "Code is required"),
})

export type VerifyLoginCodeFormValues = z.infer<typeof verifyLoginCodeSchema>
