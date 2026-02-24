export interface RequestLoginCodeRequest {
  email: string
}

export interface VerifyLoginCodeRequest {
  email: string
  code: string
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

export interface UpdateUserRequest {
  name?: string
  last_name?: string
}
