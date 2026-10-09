import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { GuestRoute } from "@/components/protected-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGoogleLogin, useLogin, useRegister } from "@/hooks/auth/use-auth";
import { ApiError } from "@/types/api";

type GoogleCredentialResponse = { credential: string };

type GoogleButtonOptions = {
  theme: "outline";
  size: "large";
  text: "continue_with";
  shape: "rectangular";
  width: number;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
          }) => void;
          renderButton: (target: HTMLElement, options: GoogleButtonOptions) => void;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID = import.meta.env["VITE_GOOGLE_CLIENT_ID"] as string | undefined;
const GOOGLE_SCRIPT_URL = "https://accounts.google.com/gsi/client";

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
  const {
    googleLogin,
    isLoading: isGoogleLoggingIn,
    error: googleLoginError,
  } = useGoogleLogin();
  const { register, isLoading: isRegistering, error: registerError } = useRegister();
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [googleSdkError, setGoogleSdkError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const pending = isLoggingIn || isGoogleLoggingIn || isRegistering;
  const apiError = mode === "login" ? loginError : registerError;

  const errorMessage = (() => {
    if (localError) return localError;
    if (apiError instanceof ApiError) return apiError.message;
    if (apiError instanceof Error) return apiError.message;
    return null;
  })() ?? (googleLoginError instanceof Error ? googleLoginError.message : null);

  const onGoogleCredential = useCallback(
    async (response: GoogleCredentialResponse) => {
      setLocalError(null);
      try {
        await googleLogin(response.credential);
        await navigate({ to: "/dashboard" });
      } catch (error) {
        setLocalError(
          error instanceof Error ? error.message : "Unable to sign in with Google.",
        );
      }
    },
    [googleLogin, navigate],
  );

  useEffect(() => {
    if (mode !== "login" || !GOOGLE_CLIENT_ID || !googleButtonRef.current) return;

    let mounted = true;
    const renderGoogleButton = () => {
      if (!mounted || !window.google || !googleButtonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => void onGoogleCredential(response),
      });
      googleButtonRef.current.replaceChildren();
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        width: Math.min(368, googleButtonRef.current.clientWidth || 368),
      });
    };
    const handleScriptError = () => {
      if (mounted) setGoogleSdkError("Google sign-in could not be loaded.");
    };

    let script = document.querySelector<HTMLScriptElement>(`script[src="${GOOGLE_SCRIPT_URL}"]`);
    if (window.google) {
      renderGoogleButton();
    } else {
      if (!script) {
        script = document.createElement("script");
        script.src = GOOGLE_SCRIPT_URL;
        script.async = true;
        script.defer = true;
      }
      script.addEventListener("load", renderGoogleButton);
      script.addEventListener("error", handleScriptError);
      if (!script.isConnected) document.head.appendChild(script);
    }

    return () => {
      mounted = false;
      script?.removeEventListener("load", renderGoogleButton);
      script?.removeEventListener("error", handleScriptError);
    };
  }, [mode, onGoogleCredential]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLocalError(null);
    setSuccessMessage(null);

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
        await navigate({ to: "/dashboard" });
      } else {
        await register({
          email: email.trim(),
          password,
          name: name.trim(),
        });
        await navigate({ to: "/login", replace: true });
        setMode("login");
        setPassword("");
        setName("");
        setSuccessMessage("Account created successfully. Sign in to continue.");
      }
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : "Unable to complete the request.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">Lendsqr SDR Tracker</CardTitle>
          <CardDescription>
            {mode === "login"
              ? GOOGLE_CLIENT_ID
                ? "Sign in with Google or your work email and password."
                : "Sign in with your work email and password."
              : "Create an SDR account to start tracking leads."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
            {mode === "login" && GOOGLE_CLIENT_ID ? (
              <>
                <div ref={googleButtonRef} className="flex justify-center" />
                {googleSdkError ? (
                  <p className="text-sm text-destructive" role="alert">
                    {googleSdkError}
                  </p>
                ) : null}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="h-px flex-1 bg-border" />
                  or continue with email
                  <span className="h-px flex-1 bg-border" />
                </div>
              </>
            ) : null}
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
            {successMessage ? (
              <p className="text-sm text-emerald-600" role="status">
                {successMessage}
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
                    setSuccessMessage(null);
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
                    setSuccessMessage(null);
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
