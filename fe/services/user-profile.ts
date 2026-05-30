import AsyncStorage from "@react-native-async-storage/async-storage";

import { readAuthTokens } from "@/services/auth-session";

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://20.255.57.186:8080";

export const PROFILE_CACHE_KEY = "profile-cache-v1";

export type UserAddress = {
  id: string;
  title?: string;
  type?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
};

export type UserProfile = {
  id: string;
  name: string;
  username: string;
  phone?: string | null;
  avatar?: string | null;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
  completedOrders?: number;
  addresses?: UserAddress[];
  defaultDeliveryAddressId?: string | null;
};

type CachedProfile = {
  profile: UserProfile;
  cachedAt: string;
};

type ApiResponse = {
  success?: boolean;
  message?: string;
  data?: UserProfile;
};

function isProfile(value: unknown): value is UserProfile {
  return Boolean(value && typeof value === "object" && "id" in value && "username" in value);
}

function normalizeProfilePayload(payload: unknown): UserProfile | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const typedPayload = payload as Partial<CachedProfile> & Partial<ApiResponse> & { data?: unknown };

  if (isProfile(typedPayload.profile)) {
    return typedPayload.profile;
  }

  if (isProfile(typedPayload.data)) {
    return typedPayload.data;
  }

  if (isProfile(payload)) {
    return payload;
  }

  return null;
}

export async function getCachedUserProfile(): Promise<UserProfile | null> {
  try {
    const cached = await AsyncStorage.getItem(PROFILE_CACHE_KEY);

    if (!cached) {
      return null;
    }

    return normalizeProfilePayload(JSON.parse(cached));
  } catch {
    return null;
  }
}

export async function cacheUserProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(
    PROFILE_CACHE_KEY,
    JSON.stringify({
      profile,
      cachedAt: new Date().toISOString(),
    }),
  );
}

export async function clearCachedUserProfile(): Promise<void> {
  await AsyncStorage.removeItem(PROFILE_CACHE_KEY);
}

export async function fetchUserProfile(accessToken: string): Promise<UserProfile> {
  const response = await fetch(`${API_BASE}/api/users/me`, {
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const payload = (await response.json().catch(() => null)) as ApiResponse | UserProfile | null;
  const profile = normalizeProfilePayload(payload);

  if (!response.ok || !profile) {
    throw new Error((payload as ApiResponse | null)?.message || "Không lấy được thông tin tài khoản");
  }

  return profile;
}

export async function fetchAndCacheCurrentUserProfile(): Promise<UserProfile | null> {
  const tokens = await readAuthTokens("tokens");

  if (!tokens?.accessToken) {
    return null;
  }

  const profile = await fetchUserProfile(tokens.accessToken);
  await cacheUserProfile(profile);

  return profile;
}
