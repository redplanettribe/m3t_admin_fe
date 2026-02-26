import { useUserStore } from "@/store/userStore"

// In dev with no VITE_API_URL, use /api so Vite proxy forwards to backend (avoids CORS)
const baseUrl =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.DEV ? "/api" : "http://localhost:8080")

console.log("baseUrl", baseUrl)
console.log("import.meta.env.DEV", import.meta.env.DEV)
console.log("import.meta.env.VITE_API_URL", import.meta.env.VITE_API_URL)

export class ApiError extends Error {
  code?: string
  status?: number
  constructor(message: string, code?: string, status?: number) {
    super(message)
    this.name = "ApiError"
    this.code = code
    this.status = status
  }
}

async function request<T>(
  path: string,
  options: Omit<RequestInit, "body"> & { body?: object } = {}
): Promise<T> {
  const { body, ...init } = options
  const token = useUserStore.getState().token
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  const url = `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`
  const res = await fetch(url, {
    ...init,
    headers,
    ...(body !== undefined && { body: JSON.stringify(body) }),
  })

  const json = (await res.json().catch(() => ({}))) as {
    data?: T
    error?: { code: string; message: string }
  }

  if (!res.ok) {
    const msg = json.error?.message ?? res.statusText ?? "Request failed"
    throw new ApiError(msg, json.error?.code, res.status)
  }

  if (json.error) {
    throw new ApiError(json.error.message, json.error.code, res.status)
  }

  return json.data as T
}

export const apiClient = {
  get<T>(path: string): Promise<T> {
    return request<T>(path, { method: "GET" })
  },
  post<T>(path: string, body: object): Promise<T> {
    return request<T>(path, { method: "POST", body })
  },
  patch<T>(path: string, body?: object): Promise<T> {
    return request<T>(path, { method: "PATCH", ...(body !== undefined && { body }) })
  },
  delete<T>(path: string): Promise<T> {
    return request<T>(path, { method: "DELETE" })
  },
}
