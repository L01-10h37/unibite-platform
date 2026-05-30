import * as SecureStore from "expo-secure-store";
import { trackException, trackPerformanceMetric } from "@/services/sentry";

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8080";

const AUTH_STORAGE_KEYS = ["tokens", "sellerTokens"] as const;

type AuthStorageKey = (typeof AUTH_STORAGE_KEYS)[number];

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

const refreshRequests = new Map<AuthStorageKey, Promise<AuthTokens | null>>();

function parseAuthTokens(value: string | null): AuthTokens | null {
  if (!value) {
    return null;
  }

  try {
    const tokens = JSON.parse(value) as Partial<AuthTokens>;

    if (!tokens?.accessToken || !tokens?.refreshToken) {
      return null;
    }

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  } catch {
    return null;
  }
}

export async function readAuthTokens(
  storageKey: AuthStorageKey,
): Promise<AuthTokens | null> {
  return parseAuthTokens(await SecureStore.getItemAsync(storageKey));
}

export async function writeAuthTokens(
  storageKey: AuthStorageKey,
  tokens: AuthTokens,
): Promise<void> {
  await SecureStore.setItemAsync(storageKey, JSON.stringify(tokens));
}

export async function clearAuthTokens(
  storageKey: AuthStorageKey,
): Promise<void> {
  await SecureStore.deleteItemAsync(storageKey);
}

export async function findAuthStorageKeyByAccessToken(
  accessToken: string,
): Promise<AuthStorageKey | null> {
  for (const storageKey of AUTH_STORAGE_KEYS) {
    const tokens = await readAuthTokens(storageKey);

    if (tokens?.accessToken === accessToken) {
      return storageKey;
    }
  }

  return null;
}

export async function refreshStoredAccessToken(
  storageKey: AuthStorageKey,
): Promise<AuthTokens | null> {
  const startedAt = Date.now();
  const pending = refreshRequests.get(storageKey);

  if (pending) {
    return pending;
  }

  const request = (async () => {
    const currentTokens = await readAuthTokens(storageKey);

    if (!currentTokens?.refreshToken) {
      return null;
    }

    try {
      const response = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken: currentTokens.refreshToken }),
      });

      if (!response.ok) {
        trackPerformanceMetric("auth_refresh_duration_ms", Date.now() - startedAt, {
          result: "failed",
          statusCode: response.status,
        });
        return null;
      }

      const payload = await response.json().catch(() => null);
      const data = payload?.data ?? payload;

      if (!data?.accessToken) {
        return null;
      }

      const nextTokens: AuthTokens = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken ?? currentTokens.refreshToken,
      };

      await writeAuthTokens(storageKey, nextTokens);

      trackPerformanceMetric("auth_refresh_duration_ms", Date.now() - startedAt, {
        result: "success",
      });

      return nextTokens;
    } catch {
      trackPerformanceMetric("auth_refresh_duration_ms", Date.now() - startedAt, {
        result: "failed",
      });
      return null;
    } finally {
      refreshRequests.delete(storageKey);
    }
  })();

  refreshRequests.set(storageKey, request);

  return request;
}

function isAuthEndpoint(url: string) {
  return (
    url.includes("/api/auth/login") ||
    url.includes("/api/auth/register") ||
    url.includes("/api/auth/logout") ||
    url.includes("/api/auth/refresh")
  );
}

function getRequestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") {
    return input;
  }

  if (input instanceof URL) {
    return input.toString();
  }

  return input.url;
}

function getRequestHeaders(input: RequestInfo | URL, init?: RequestInit) {
  const headers = new Headers();

  if (input instanceof Request) {
    for (const [key, value] of input.headers.entries()) {
      headers.set(key, value);
    }
  }

  if (init?.headers) {
    const overrideHeaders = new Headers(init.headers);

    for (const [key, value] of overrideHeaders.entries()) {
      headers.set(key, value);
    }
  }

  return headers;
}

function getRetryFlag(headers: Headers) {
  return headers.get("x-auth-refresh-attempt") === "1";
}

function createRetryRequest(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  headers: Headers,
) {
  const retryHeaders = new Headers(headers);
  retryHeaders.set("x-auth-refresh-attempt", "1");

  if (input instanceof Request) {
    return new Request(input, {
      ...init,
      headers: retryHeaders,
    });
  }

  return {
    input,
    init: {
      ...init,
      headers: retryHeaders,
    },
  };
}

function installFetchInterceptor() {
  const globalTarget = globalThis as typeof globalThis & {
    __authFetchInterceptorInstalled?: boolean;
  };

  if (globalTarget.__authFetchInterceptorInstalled) {
    return;
  }

  const originalFetch = globalThis.fetch.bind(globalThis);

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const requestUrl = getRequestUrl(input);
    const startedAt = Date.now();
    const requestForFetch = input instanceof Request ? new Request(input, init) : input;
    const requestForRetry = input instanceof Request ? new Request(input, init) : input;

    if (isAuthEndpoint(requestUrl)) {
      return originalFetch(requestForFetch as RequestInfo, input instanceof Request ? undefined : init);
    }

    const requestHeaders = getRequestHeaders(input, init);

    if (getRetryFlag(requestHeaders)) {
      return originalFetch(requestForFetch as RequestInfo, input instanceof Request ? undefined : init);
    }

    const response = await originalFetch(requestForFetch as RequestInfo, input instanceof Request ? undefined : init);
    trackPerformanceMetric("api_request_duration_ms", Date.now() - startedAt, {
      url: requestUrl,
      method: init?.method ?? (input instanceof Request ? input.method : "GET"),
      statusCode: response.status,
      retried: false,
    });

    if (response.status !== 401) {
      return response;
    }

    const authorization =
      requestHeaders.get("Authorization") ?? requestHeaders.get("authorization");

    if (!authorization?.toLowerCase().startsWith("bearer ")) {
      return response;
    }

    const accessToken = authorization.slice(7).trim();

    if (!accessToken) {
      return response;
    }

    const storageKey = await findAuthStorageKeyByAccessToken(accessToken);

    if (!storageKey) {
      return response;
    }

    const refreshedTokens = await refreshStoredAccessToken(storageKey);

    if (!refreshedTokens?.accessToken) {
      trackException(new Error("Access token refresh failed after 401"), "fetch_interceptor_refresh_failed", {
        url: requestUrl,
      });
      return response;
    }

    const retryHeaders = new Headers(requestHeaders);
    retryHeaders.set("Authorization", `Bearer ${refreshedTokens.accessToken}`);

    const retryRequest = createRetryRequest(requestForRetry, init, retryHeaders);

    if (retryRequest instanceof Request) {
      const retriedResponse = await originalFetch(retryRequest);
      trackPerformanceMetric("api_request_retry_duration_ms", Date.now() - startedAt, {
        url: requestUrl,
        statusCode: retriedResponse.status,
      });
      return retriedResponse;
    }

    const retriedResponse = await originalFetch(retryRequest.input, retryRequest.init);
    trackPerformanceMetric("api_request_retry_duration_ms", Date.now() - startedAt, {
      url: requestUrl,
      statusCode: retriedResponse.status,
    });
    return retriedResponse;
  }) as typeof fetch;

  globalTarget.__authFetchInterceptorInstalled = true;
}

installFetchInterceptor();
