export interface SignUpRequest {
  email: string
  name: string
  last_name?: string
  password: string
  role?: "admin" | "attendee"
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  token_type: string
  user?: User
}

export interface APIError {
  code: string
  message: string
}

export interface APIResponse<T> {
  data?: T
  error?: APIError
}

export interface User {
  id: string
  email: string
  name: string
  last_name?: string
  role?: string
}
