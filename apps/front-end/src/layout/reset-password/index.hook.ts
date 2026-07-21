import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { authService } from "@/lib/api/services/auth.service";
import { useAsyncAction } from "@/hooks/use-async-action";
import { getErrorMessage } from "@/lib/errors";

export function useResetPassword() {
  const token = useSearchParams().get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const [submit, isLoading] = useAsyncAction(
    async () => {
      if (password !== confirmPassword) throw "Passwords don't match.";
      return authService.resetPassword({ token: token!, password });
    },
    {
      onSuccess: () => setDone(true),
      onError: (err) => setError(typeof err === "string" ? err : getErrorMessage()),
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    submit();
  };

  return {
    hasToken: Boolean(token),
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    setShowPassword,
    error,
    isLoading,
    done,
    handleSubmit,
  };
}
