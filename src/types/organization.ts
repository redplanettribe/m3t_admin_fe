export type OrganizationRole = "owner" | "admin" | "member"

export interface Organization {
  id: string
  name: string
  created_at?: string
  updated_at?: string
}

export interface OrganizationWithRole extends Organization {
  role: OrganizationRole
}

/** GET /organizations returns memberships, not flat organizations. */
export interface OrganizationMembership {
  organization: Organization
  role: OrganizationRole
}

export interface OrganizationMember {
  user_id: string
  email?: string
  name?: string
  last_name?: string
  role: OrganizationRole
}

export interface ListOrganizationsResult {
  organizations: OrganizationWithRole[]
}

export interface ListOrganizationMembersResult {
  members: OrganizationMember[]
}

export interface CreateOrganizationRequest {
  name: string
}

export interface UpdateOrganizationRequest {
  name: string
}

export interface AddOrganizationMemberRequest {
  email: string
  role: OrganizationRole
}

export interface UpdateOrganizationMemberRequest {
  role: OrganizationRole
}
