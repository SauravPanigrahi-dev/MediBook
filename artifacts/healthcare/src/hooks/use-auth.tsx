import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, useGetMe, useLogin, useRegister, useLogout, LoginBody, RegisterBody } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (data: LoginBody) => Promise<void>;
  register: (data: RegisterBody) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(localStorage.getItem("accessToken"));
  const queryClient = useQueryClient();

  const { data: user, isLoading: isUserLoading, error } = useGetMe({
    query: {
      enabled: !!accessToken,
      retry: false,
    }
  });

  useEffect(() => {
    if (error) {
      setAccessToken(null);
      localStorage.removeItem("accessToken");
    }
  }, [error]);

  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const logoutMutation = useLogout();

  const login = async (data: LoginBody) => {
    const res = await loginMutation.mutateAsync({ data });
    setAccessToken(res.accessToken);
    localStorage.setItem("accessToken", res.accessToken);
    queryClient.invalidateQueries();
  };

  const registerUser = async (data: RegisterBody) => {
    const res = await registerMutation.mutateAsync({ data });
    setAccessToken(res.accessToken);
    localStorage.setItem("accessToken", res.accessToken);
    queryClient.invalidateQueries();
  };

  const logoutUser = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch {
      // ignore logout API errors
    }
    setAccessToken(null);
    localStorage.removeItem("accessToken");
    queryClient.clear();
  };

  return (
    <AuthContext.Provider value={{
      user: user ?? null,
      accessToken,
      isLoading: isUserLoading || loginMutation.isPending || registerMutation.isPending,
      login,
      register: registerUser,
      logout: logoutUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
