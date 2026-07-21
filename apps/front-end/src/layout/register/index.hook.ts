import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/store";
import { registerUser, googleLoginUser } from "@/store/slices/common/auth.slice";
import { useAsyncAction } from "@/hooks/use-async-action";
import { getErrorMessage } from "@/lib/errors";
import { requestGoogleAuthCode, GoogleAuthError } from "@/lib/google-identity";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export function useRegister() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [submit, isLoading] = useAsyncAction(
    async () => dispatch(registerUser({ email, password, display_name: displayName, remember })).unwrap(),
    {
      onSuccess: () => router.push("/"),
      onError: (err) => setError(typeof err === "string" ? err : getErrorMessage()),
    }
  );

  const [signInWithGoogle, isGoogleLoading] = useAsyncAction(
    async () => {
      const code = await requestGoogleAuthCode(GOOGLE_CLIENT_ID!);
      return dispatch(googleLoginUser({ code, remember })).unwrap();
    },
    {
      onSuccess: () => router.push("/"),
      onError: (err) => {
        if (err instanceof GoogleAuthError && err.dismissed) return;
        setError(typeof err === "string" ? err : "Google sign-in is unavailable right now.");
      },
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    submit();
  };

  const handleGoogleLogin = () => {
    setError(null);
    signInWithGoogle();
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    displayName,
    setDisplayName,
    remember,
    setRemember,
    error,
    isLoading,
    isGoogleLoading,
    handleSubmit,
    handleGoogleLogin,
    googleEnabled: Boolean(GOOGLE_CLIENT_ID),
  };
}
