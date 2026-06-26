import { z } from "zod"

export const organizationRoleSchema = z.enum(["owner", "admin", "member"])

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
})

export const updateOrganizationSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
})

export const addOrganizationMemberSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  role: organizationRoleSchema,
})

export type CreateOrganizationFormValues = z.infer<typeof createOrganizationSchema>
export type UpdateOrganizationFormValues = z.infer<typeof updateOrganizationSchema>
export type AddOrganizationMemberFormValues = z.infer<typeof addOrganizationMemberSchema>
