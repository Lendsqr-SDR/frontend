import { api, unwrapData } from "@/api/api";
import { clearAccessToken, setAccessToken } from "@/api/token";
import type { ApiSuccess } from "@/types/api";
import type { AuthResponse, LoginRequest, RegisterRequest, User } from "@/types/auth/auth.types";

export const AuthService = {
  async login(payload: LoginRequest): Promise<AuthResponse> {
    const data = await unwrapData(api.post<ApiSuccess<AuthResponse>>("/auth/login", payload));
    setAccessToken(data.token);
    return data;
  },

  async googleLogin(credential: string): Promise<AuthResponse> {
    const data = await unwrapData(
      api.post<ApiSuccess<AuthResponse>>("/auth/google", { credential }),
    );
    setAccessToken(data.token);
    return data;
  },

  async register(payload: RegisterRequest): Promise<AuthResponse> {
    return unwrapData(api.post<ApiSuccess<AuthResponse>>("/auth/register", payload));
  },

  async getCurrentUser(): Promise<User> {
    return unwrapData(api.get<ApiSuccess<User>>("/auth/me"));
  },

  /** Backend has no logout endpoint — clear the local Bearer token only. */
  logout(): void {
    clearAccessToken();
  },
};
