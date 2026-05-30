import * as Sentry from "@sentry/react-native";

const appEnvironment = process.env.EXPO_PUBLIC_APP_ENV ?? (__DEV__ ? "development" : "production");
const tracesSampleRate = Number(process.env.EXPO_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? "0.2");
const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
const sendStartupTestEvent = process.env.EXPO_PUBLIC_SENTRY_SEND_TEST_EVENT === "1";

type JwtPayload = {
  id?: string;
  username?: string;
  role?: string;
};

function decodeBase64Url(value: string): string | null {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);

  if (typeof globalThis.atob !== "function") {
    return null;
  }

  return globalThis.atob(padded);
}

function parseJwtPayload(token: string): JwtPayload | null {
  const parts = token.split(".");

  if (parts.length < 2) {
    return null;
  }

  try {
    const decoded = decodeBase64Url(parts[1]);

    if (!decoded) {
      return null;
    }

    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
}

export function initSentry() {
  const globalTarget = globalThis as typeof globalThis & {
    __unibiteSentryInitialized?: boolean;
  };

  if (globalTarget.__unibiteSentryInitialized) {
    return;
  }

  Sentry.init({
    dsn,
    enabled: Boolean(dsn),
    environment: appEnvironment,
    tracesSampleRate,
    enableAutoSessionTracking: true,
    sendDefaultPii: false,
  });

  Sentry.setTag("app", "unibite-fe");
  Sentry.setTag("platform", "expo");
  Sentry.setTag("env", appEnvironment);
  globalTarget.__unibiteSentryInitialized = true;

  if (sendStartupTestEvent) {
    Sentry.captureMessage("frontend_sentry_startup_test_event", "info");
  }
}

export function setSentryScreen(screenName: string) {
  Sentry.setTag("screen", screenName);
  Sentry.addBreadcrumb({
    category: "navigation",
    message: "screen_view",
    level: "info",
    data: { screenName },
  });
}

export function setSentryUserFromAccessToken(accessToken: string) {
  const payload = parseJwtPayload(accessToken);

  if (!payload) {
    return;
  }

  Sentry.setUser({
    id: payload.id,
    username: payload.username,
    segment: payload.role,
  });

  if (payload.role) {
    Sentry.setTag("user_role", payload.role);
  }
}

export function clearSentryUser() {
  Sentry.setUser(null);
}

export function trackUserEngagement(eventName: string, extra?: Record<string, unknown>) {
  if (!dsn) {
    return;
  }

  Sentry.captureEvent({
    message: eventName,
    level: "info",
    tags: {
      category: "engagement",
      env: appEnvironment,
    },
    extra,
  });
}

export function trackPerformanceMetric(metricName: string, durationMs: number, extra?: Record<string, unknown>) {
  if (!dsn) {
    return;
  }

  Sentry.captureEvent({
    message: metricName,
    level: "info",
    tags: {
      category: "performance",
      env: appEnvironment,
    },
    extra: {
      durationMs,
      ...extra,
    },
  });
}

export function trackException(error: unknown, context: string, extra?: Record<string, unknown>) {
  if (!dsn) {
    return;
  }

  const normalizedError = error instanceof Error ? error : new Error(String(error));

  Sentry.withScope((scope) => {
    scope.setTag("context", context);

    if (extra) {
      scope.setExtras(extra);
    }

    Sentry.captureException(normalizedError);
  });
}

export function sendManualSentryTestEvent(source: string) {
  if (!dsn) {
    return;
  }

  Sentry.captureMessage("frontend_manual_sentry_test_event", {
    level: "info",
    extra: { source, appEnvironment },
  });
}