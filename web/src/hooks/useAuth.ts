import { api } from "../config/axios";
import { useMutation } from "@tanstack/react-query";

type AuthenthicationDataType = {
  email: string;
  password: string;
};

type AuthResponse = {
  success: boolean;
  id?: number;
  message?: string;
  error?: string;
};

const signup = async (data: AuthenthicationDataType): Promise<AuthResponse> => {
  const result = await api.post<AuthResponse>("/signup", data);
  return result.data;
};
const login = async (data: AuthenthicationDataType): Promise<AuthResponse> => {
  const result = await api.post<AuthResponse>("/login", data);
  return result.data;
};
export function useAuth() {
  const signupMutation = useMutation({
    mutationFn: signup,
    mutationKey: ["auth", "signup"],
  });
  const loginMutation = useMutation({
    mutationFn: login,
    mutationKey: ["auth", "login"],
  });
  return {
    signup: signupMutation.mutateAsync,
    login: loginMutation.mutateAsync,
    signupIsPending: signupMutation.isPending,
    loginIsPending: loginMutation.isPending,
    signupIsError: signupMutation.isError,
    loginIsError: loginMutation.isError,
    signupData: signupMutation.data,
    loginData: loginMutation.data,
  };
}
