import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type User } from "@/lib/api";
import {
  clearToken,
  getToken,
  onUnauthorized,
  setToken,
} from "@/lib/auth-storage";
import { clearRecentBooks } from "@/lib/recent-books";
import {
  AuthContext,
  authMeQueryKey,
  type AuthContextValue,
} from "@/hooks/use-auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setTokenState] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    setTokenState(getToken());
    setHydrated(true);
  }, []);

  const clearSession = useCallback(() => {
    if (userIdRef.current) clearRecentBooks(userIdRef.current);
    clearRecentBooks();
    userIdRef.current = null;
    setTokenState(null);
    queryClient.setQueryData(authMeQueryKey, null);
    queryClient.removeQueries({ queryKey: authMeQueryKey });
    queryClient.clear();
  }, [queryClient]);

  useEffect(() => onUnauthorized(clearSession), [clearSession]);

  const meQuery = useQuery({
    queryKey: authMeQueryKey,
    queryFn: api.me,
    enabled: hydrated && Boolean(token),
    retry: false,
    staleTime: 60_000,
  });

  useEffect(() => {
    userIdRef.current = meQuery.data?.id ?? null;
  }, [meQuery.data?.id]);

  const login = useCallback(
    async (email: string, password: string): Promise<User> => {
      const { access_token } = await api.login(email, password);
      setToken(access_token);
      setTokenState(access_token);
      const user = await api.me();
      userIdRef.current = user.id;
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
    clearSession();
  }, [clearSession]);

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
