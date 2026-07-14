import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/store";
import { registerUser } from "@/store/slices/common/auth.slice";
import { useAsyncAction } from "@/hooks/use-async-action";
import { getErrorMessage } from "@/lib/errors";

export function useRegister() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [submit, isLoading] = useAsyncAction(
    async () => {
      const result = await dispatch(registerUser({ email, password, display_name: displayName })).unwrap();
      return result;
    },
    {
      onSuccess: () => router.push("/"),
      onError: (err) => setError(typeof err === "string" ? err : getErrorMessage()),
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    submit();
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    displayName,
    setDisplayName,
    error,
    isLoading,
    handleSubmit,
  };
}
