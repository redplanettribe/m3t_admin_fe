import { z } from "zod"

export const signUpSchema = z
  .object({
    email: z.string().min(1, "Email is required").email("Invalid email address"),
    name: z.string().min(1, "Name is required"),
    last_name: z.string().optional(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export type SignUpFormValues = z.infer<typeof signUpSchema>

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

export type LoginFormValues = z.infer<typeof loginSchema>
