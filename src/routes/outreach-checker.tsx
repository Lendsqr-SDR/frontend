import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, Search } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { AppShell } from "@/components/app-shell";
import { ProtectedRoute } from "@/components/protected-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useOutreachSearch } from "@/services/outreach/outreach.queries";
import type { OutreachSourceStatus } from "@/services/outreach/outreach.service";
import { ApiError } from "@/types/api";

type GoogleTokenResponse = {
  access_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

type GoogleTokenClient = {
  requestAccessToken: (options?: { prompt?: string }) => void;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (options: {
            client_id: string;
            scope: string;
            callback: (response: GoogleTokenResponse) => void;
          }) => GoogleTokenClient;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID = import.meta.env["VITE_GOOGLE_CLIENT_ID"] as string | undefined;
const GOOGLE_SCRIPT_URL = "https://accounts.google.com/gsi/client";
const GOOGLE_DRIVE_SCOPES = [
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
].join(" ");

export const Route = createFileRoute("/outreach-checker")({
  head: () => ({
    meta: [
      { title: "Outreach Checker — Lendsqr SDR Tracker" },
      {
        name: "description",
        content: "Search Google Drive for prior company outreach.",
      },
    ],
  }),
  component: OutreachCheckerRoute,
});

function OutreachCheckerRoute() {
  return (
    <ProtectedRoute>
      <OutreachChecker />
    </ProtectedRoute>
  );
}

function formatConversationDate(value: string | null) {
  if (!value) return "Date not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date not available";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

function statusLabel(status: OutreachSourceStatus) {
  if (status === "connected") return "Connected";
  if (status === "error") return "Search error";
  return "Unavailable";
}

function OutreachChecker() {
  const [company, setCompany] = useState("");
  const [googleReady, setGoogleReady] = useState(
    typeof window !== "undefined" && Boolean(window.google?.accounts.oauth2),
  );
  const [isConnecting, setIsConnecting] = useState(false);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const tokenClientRef = useRef<GoogleTokenClient | null>(null);
  const googleAccessTokenRef = useRef<string | null>(null);
  const googleTokenExpiresAtRef = useRef(0);
  const tokenResolverRef = useRef<((token: string) => void) | null>(null);
  const tokenRejecterRef = useRef<((error: Error) => void) | null>(null);
  const tokenTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const search = useOutreachSearch();
  const data = search.data;

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      setGoogleError("Google OAuth is not configured for this frontend.");
      return;
    }

    const initialize = () => {
      if (!window.google?.accounts.oauth2) return;
      tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: GOOGLE_DRIVE_SCOPES,
        callback: (response) => {
          if (tokenTimeoutRef.current) clearTimeout(tokenTimeoutRef.current);
          tokenTimeoutRef.current = null;
          if (response.error || !response.access_token) {
            tokenRejecterRef.current?.(
              new Error(
                response.error_description ||
                  "Google authorization was not granted. Search requires Google Drive access.",
              ),
            );
            tokenResolverRef.current = null;
            tokenRejecterRef.current = null;
            return;
          }
          tokenResolverRef.current?.(response.access_token);
          googleAccessTokenRef.current = response.access_token;
          setGoogleAccessToken(response.access_token);
          googleTokenExpiresAtRef.current =
            Date.now() + Math.max(0, (response.expires_in ?? 3600) - 60) * 1000;
          tokenResolverRef.current = null;
          tokenRejecterRef.current = null;
        },
      });
      setGoogleReady(true);
      setGoogleError(null);
    };
    const onLoadError = () => setGoogleError("Google authorization could not be loaded.");

    let script = document.querySelector<HTMLScriptElement>(`script[src="${GOOGLE_SCRIPT_URL}"]`);
    if (window.google?.accounts.oauth2) {
      initialize();
    } else {
      if (!script) {
        script = document.createElement("script");
        script.src = GOOGLE_SCRIPT_URL;
        script.async = true;
        script.defer = true;
      }
      script.addEventListener("load", initialize);
      script.addEventListener("error", onLoadError);
      if (!script.isConnected) document.head.appendChild(script);
    }

    return () => {
      script?.removeEventListener("load", initialize);
      script?.removeEventListener("error", onLoadError);
    };
  }, []);

  function requestGoogleAccessToken() {
    if (googleAccessTokenRef.current && Date.now() < googleTokenExpiresAtRef.current) {
      return Promise.resolve(googleAccessTokenRef.current);
    }
    if (!tokenClientRef.current) {
      throw new Error(googleError || "Google authorization is not ready.");
    }
    return new Promise<string>((resolve, reject) => {
      tokenResolverRef.current = resolve;
      tokenRejecterRef.current = reject;
      tokenTimeoutRef.current = setTimeout(() => {
        tokenRejecterRef.current?.(
          new Error("Google authorization timed out. Try connecting again."),
        );
        tokenResolverRef.current = null;
        tokenRejecterRef.current = null;
        tokenTimeoutRef.current = null;
      }, 90_000);
      tokenClientRef.current?.requestAccessToken({ prompt: "" });
    });
  }

  async function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = company.trim();
    if (!query) return;
    setGoogleError(null);
    setIsConnecting(true);
    try {
      const accessToken = await requestGoogleAccessToken();
      search.mutate(
        { query, accessToken },
        {
          onError: (error) => {
            if (error instanceof ApiError && error.status === 401) {
              googleAccessTokenRef.current = null;
              setGoogleAccessToken(null);
              googleTokenExpiresAtRef.current = 0;
              setGoogleError("Google access expired. Search again to reconnect your account.");
            }
          },
        },
      );
    } catch (error) {
      setGoogleError(
        error instanceof Error ? error.message : "Google authorization could not be completed.",
      );
    } finally {
      setIsConnecting(false);
    }
  }

  return (
    <AppShell
      title="Outreach Checker"
      description="Search accessible Google Drive records before starting a new outreach."
    >
      <div className="mx-auto max-w-5xl space-y-5">
        <Card>
          <CardContent className="p-5 sm:p-6">
            <form onSubmit={submitSearch} className="flex flex-col gap-3 sm:flex-row">
              <label className="sr-only" htmlFor="outreach-company">
                Company name
              </label>
              <Input
                id="outreach-company"
                value={company}
                onChange={(event) => setCompany(event.target.value)}
                placeholder="Search by company name"
                autoComplete="organization"
                maxLength={200}
              />
              <Button
                type="submit"
                disabled={!company.trim() || search.isPending || isConnecting || !googleReady}
              >
                <Search className="mr-2 size-4" />
                {isConnecting
                  ? "Connecting…"
                  : search.isPending
                    ? "Searching…"
                    : googleAccessToken
                      ? "Search"
                      : "Connect Google & search"}
              </Button>
            </form>
            <p className="mt-3 text-xs text-muted-foreground">
              Searches accessible Google Drive files. Google access is reused until the short-lived
              token expires.
            </p>
            {googleError ? (
              <p className="mt-3 text-sm text-destructive" role="alert">
                {googleError}
              </p>
            ) : null}
          </CardContent>
        </Card>

        {search.isPending ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground" role="status">
              Searching Google Drive…
            </CardContent>
          </Card>
        ) : null}

        {search.isError ? (
          <Card>
            <CardContent className="p-5 text-sm text-destructive" role="alert">
              {search.error instanceof Error
                ? search.error.message
                : "The outreach search could not be completed. Please try again."}
            </CardContent>
          </Card>
        ) : null}

        {data ? (
          <>
            <section aria-label="Google Drive search status">
              {data.sources.map((source) => (
                <Card key={source.key}>
                  <CardContent className="flex items-start justify-between gap-3 p-4">
                    <div>
                      <p className="text-sm font-medium">{source.label}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{source.message}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                        source.status === "connected"
                          ? "bg-emerald-50 text-emerald-700"
                          : source.status === "error"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {statusLabel(source.status)}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </section>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Records matching “{data.query}”</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.results.length > 0 ? (
                  data.results.map((result, index) => (
                    <article
                      key={`${result.source}-${result.id}-${index}`}
                      className="rounded-lg border border-border p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-muted-foreground">
                            {result.companyName}
                          </p>
                          <h2 className="mt-1 text-sm font-semibold text-foreground">
                            {result.subject}
                          </h2>
                        </div>
                        <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                          {result.source}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>Contact / sender: {result.contact}</span>
                        <span>{formatConversationDate(result.date)}</span>
                      </div>
                      {result.snippet ? (
                        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                          {result.snippet}
                        </p>
                      ) : null}
                      {result.url ? (
                        <a
                          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                          href={result.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open original file
                          <ExternalLink className="size-3.5" />
                        </a>
                      ) : (
                        <p className="mt-3 text-xs text-muted-foreground">
                          Original record link not available.
                        </p>
                      )}
                    </article>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No matching Drive records were returned. This is not proof that no previous
                    outreach exists; content may be inaccessible or outside this Google account.
                  </p>
                )}
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
