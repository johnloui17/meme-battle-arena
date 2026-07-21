import { useState } from "react";
import { authService } from "@/lib/api/services/auth.service";
import { useAsyncAction } from "@/hooks/use-async-action";
import { getErrorMessage } from "@/lib/errors";

export function useForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const [submit, isLoading] = useAsyncAction(async () => authService.forgotPassword({ email }), {
    onSuccess: () => setSent(true),
    onError: (err) => setError(typeof err === "string" ? err : getErrorMessage()),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    submit();
  };

  return { email, setEmail, error, isLoading, sent, handleSubmit };
}
