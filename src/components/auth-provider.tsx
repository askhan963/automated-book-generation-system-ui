import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type User } from "@/lib/api";
import { clearToken, getToken, setToken } from "@/lib/auth-storage";
import {
  AuthContext,
  authMeQueryKey,
  type AuthContextValue,
} from "@/hooks/use-auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setTokenState] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setTokenState(getToken());
    setHydrated(true);
  }, []);

  const meQuery = useQuery({
    queryKey: authMeQueryKey,
    queryFn: api.me,
    enabled: hydrated && Boolean(token),
    retry: false,
    staleTime: 60_000,
  });

  const login = useCallback(
    async (email: string, password: string): Promise<User> => {
      const { access_token } = await api.login(email, password);
      setToken(access_token);
      setTokenState(access_token);
      const user = await api.me();
      queryClient.setQueryData(authMeQueryKey, user);
      return user;
    },
    [queryClient],
  );

  const register = useCallback(
    async (email: string, password: string): Promise<User> => {
      await api.register({ email, password });
      return login(email, password);
    },
    [login],
  );

  const logout = useCallback(() => {
    clearToken();
    setTokenState(null);
    queryClient.setQueryData(authMeQueryKey, null);
    queryClient.removeQueries({ queryKey: authMeQueryKey });
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(() => {
    const isLoading = !hydrated || (Boolean(token) && meQuery.isLoading);
    const user =
      token && meQuery.isSuccess && meQuery.data ? meQuery.data : null;

    return {
      user,
      token,
      isLoading,
      login,
      register,
      logout,
    };
  }, [
    hydrated,
    token,
    meQuery.isLoading,
    meQuery.isSuccess,
    meQuery.data,
    login,
    register,
    logout,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
