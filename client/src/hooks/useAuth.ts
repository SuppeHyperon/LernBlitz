import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { User, RegisterUser, LoginUser } from "@shared/schema";

interface AuthResponse {
  user: Omit<User, 'password'>;
}

export function useAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/me"],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    user: user as Omit<User, 'password'> | undefined,
    isLoading,
    isAuthenticated: !!user,
  };
}

export function useRegister() {
  return useMutation({
    mutationFn: async (userData: RegisterUser): Promise<AuthResponse> => {
      const response = await apiRequest("POST", "/api/register", userData);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
    },
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: async (userData: LoginUser): Promise<AuthResponse> => {
      const response = await apiRequest("POST", "/api/login", userData);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
    },
  });
}

export function useLogout() {
  return useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      queryClient.clear();
    },
  });
}
