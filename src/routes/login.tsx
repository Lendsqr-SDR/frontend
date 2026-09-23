import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { GuestRoute } from "@/components/protected-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogin, useRegister } from "@/hooks/auth/use-auth";
import { ApiError } from "@/types/api";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — Lendsqr SDR Tracker" },
      { name: "description", content: "Sign in to the Lendsqr SDR Tracker." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  return (
    <GuestRoute>
      <LoginForm />
    </GuestRoute>
  );
}

function LoginForm() {
  const navigate = useNavigate();
  const { login, isLoading: isLoggingIn, error: loginError } = useLogin();
  const { register, isLoading: isRegistering, error: registerError } = useRegister();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const pending = isLoggingIn || isRegistering;
  const apiError = mode === "login" ? loginError : registerError;

  const errorMessage = (() => {
    if (localError) return localError;
    if (apiError instanceof ApiError) return apiError.message;
    if (apiError instanceof Error) return apiError.message;
    return null;
  })();

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLocalError(null);

    if (!email.trim() || password.length < 8) {
      setLocalError("Enter a valid email and a password of at least 8 characters.");
      return;
    }
    if (mode === "register" && name.trim().length < 2) {
      setLocalError("Name must be at least 2 characters.");
      return;
    }

    try {
      if (mode === "login") {
        await login({ email: email.trim(), password });
      } else {
        await register({
          email: email.trim(),
          password,
          name: name.trim(),
        });
      }
      await navigate({ to: "/dashboard" });
    } catch {
      // Error surfaced via mutation state / ApiError message
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">Lendsqr SDR Tracker</CardTitle>
          <CardDescription>
            {mode === "login"
              ? "Sign in with your work email and password."
              : "Create an SDR account to start tracking leads."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
            {mode === "register" ? (
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={pending}
                  required
                  minLength={2}
                />
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={pending}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={pending}
                required
                minLength={8}
              />
            </div>

            {errorMessage ? (
              <p className="text-sm text-destructive" role="alert">
                {errorMessage}
              </p>
            ) : null}

            <Button type="submit" className="w-full" disabled={pending}>
              {pending
                ? mode === "login"
                  ? "Signing in…"
                  : "Creating account…"
                : mode === "login"
                  ? "Sign in"
                  : "Create account"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            {mode === "login" ? (
              <>
                Need an account?{" "}
                <button
                  type="button"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                  onClick={() => {
                    setMode("register");
                    setLocalError(null);
                  }}
                >
                  Register
                </button>
              </>
            ) : (
              <>
                Already registered?{" "}
                <button
                  type="button"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                  onClick={() => {
                    setMode("login");
                    setLocalError(null);
                  }}
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
