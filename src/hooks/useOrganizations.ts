import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api"
import { queryKeys } from "@/lib/queryKeys"
import { useOrganizationStore } from "@/store/organizationStore"
import type {
  AddOrganizationMemberRequest,
  CreateOrganizationRequest,
  ListOrganizationMembersResult,
  ListOrganizationsResult,
  Organization,
  OrganizationMember,
  OrganizationMembership,
  OrganizationWithRole,
  UpdateOrganizationMemberRequest,
  UpdateOrganizationRequest,
} from "@/types/organization"

function isOrganizationMembership(
  item: OrganizationWithRole | OrganizationMembership
): item is OrganizationMembership {
  return "organization" in item
}

function normalizeOrganizationWithRole(
  item: OrganizationWithRole | OrganizationMembership
): OrganizationWithRole {
  if (isOrganizationMembership(item)) {
    return { ...item.organization, role: item.role }
  }
  return item
}

function unwrapOrganizations(
  data: ListOrganizationsResult | OrganizationWithRole[] | OrganizationMembership[]
): OrganizationWithRole[] {
  if (Array.isArray(data)) {
    return data.map(normalizeOrganizationWithRole)
  }
  return (data.organizations ?? []).map(normalizeOrganizationWithRole)
}

function unwrapMembers(data: ListOrganizationMembersResult | OrganizationMember[]): OrganizationMember[] {
  if (Array.isArray(data)) return data
  return data.members ?? []
}

export function useOrganizations() {
  return useQuery({
    queryKey: queryKeys.organizations.list,
    queryFn: async () => {
      const data = await apiClient.get<
        ListOrganizationsResult | OrganizationWithRole[] | OrganizationMembership[]
      >("/organizations")
      return unwrapOrganizations(data)
    },
  })
}

export function useOrganization(organizationId: string | null) {
  return useQuery({
    queryKey: queryKeys.organizations.detail(organizationId ?? ""),
    queryFn: () => apiClient.get<Organization>(`/organizations/${organizationId}`),
    enabled: !!organizationId,
  })
}

export function useCreateOrganization() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateOrganizationRequest) =>
      apiClient.post<Organization>("/organizations", body),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organizations.list })
      useOrganizationStore.getState().setActiveOrganizationId(data.id)
    },
  })
}

export function useUpdateOrganization(organizationId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateOrganizationRequest) => {
      if (!organizationId) throw new Error("No organization selected")
      return apiClient.patch<Organization>(`/organizations/${organizationId}`, body)
    },
    onSuccess: () => {
      if (!organizationId) return
      queryClient.invalidateQueries({ queryKey: queryKeys.organizations.list })
      queryClient.invalidateQueries({
        queryKey: queryKeys.organizations.detail(organizationId),
      })
    },
  })
}

export function useOrganizationMembers(organizationId: string | null) {
  return useQuery({
    queryKey: queryKeys.organizations.members(organizationId ?? ""),
    queryFn: async () => {
      if (!organizationId) throw new Error("No organization selected")
      const data = await apiClient.get<ListOrganizationMembersResult | OrganizationMember[]>(
        `/organizations/${organizationId}/members`
      )
      return unwrapMembers(data)
    },
    enabled: !!organizationId,
  })
}

export function useAddOrganizationMember(organizationId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: AddOrganizationMemberRequest) => {
      if (!organizationId) throw new Error("No organization selected")
      return apiClient.post<OrganizationMember>(
        `/organizations/${organizationId}/members`,
        body
      )
    },
    onSuccess: () => {
      if (!organizationId) return
      queryClient.invalidateQueries({
        queryKey: queryKeys.organizations.members(organizationId),
      })
    },
  })
}

export function useRemoveOrganizationMember(organizationId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userID }: { userID: string }) => {
      if (!organizationId) throw new Error("No organization selected")
      return apiClient.delete<undefined>(
        `/organizations/${organizationId}/members/${userID}`
      )
    },
    onSuccess: () => {
      if (!organizationId) return
      queryClient.invalidateQueries({
        queryKey: queryKeys.organizations.members(organizationId),
      })
    },
  })
}

export function useUpdateOrganizationMemberRole(organizationId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      userID,
      body,
    }: {
      userID: string
      body: UpdateOrganizationMemberRequest
    }) => {
      if (!organizationId) throw new Error("No organization selected")
      return apiClient.patch<OrganizationMember>(
        `/organizations/${organizationId}/members/${userID}`,
        body
      )
    },
    onSuccess: () => {
      if (!organizationId) return
      queryClient.invalidateQueries({
        queryKey: queryKeys.organizations.members(organizationId),
      })
    },
  })
}
