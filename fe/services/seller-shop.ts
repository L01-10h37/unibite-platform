export type SellerShop = {
  id: string;
  name: string;
  avatar?: string | null;
  address?: string;
  about?: string;
};

type SellerTokens = {
  accessToken: string;
  refreshToken: string;
};

const API_BASE = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8080";

function getAuthHeaders(accessToken: string) {
  return {
    Accept: "application/json",
    Authorization: `Bearer ${accessToken}`,
  };
}

async function parseJsonResponse(res: Response) {
  const data = await res.json().catch(() => null);
  return data?.data ?? data;
}

export function parseSellerTokens(value: string | null): SellerTokens | null {
  if (!value) {
    return null;
  }

  try {
    const tokens = JSON.parse(value);

    if (!tokens?.accessToken || !tokens?.refreshToken) {
      return null;
    }

    return tokens;
  } catch {
    return null;
  }
}

export async function getMySellerShop(accessToken: string) {
  const res = await fetch(`${API_BASE}/api/shops/my-shop`, {
    method: "GET",
    headers: getAuthHeaders(accessToken),
  });

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Get seller shop failed: ${res.status} ${text}`);
  }

  return parseJsonResponse(res) as Promise<SellerShop>;
}

export async function createSellerShop(
  accessToken: string,
  shopData: {
    name: string;
    address?: string;
    about?: string;
  },
) {
  const res = await fetch(`${API_BASE}/api/shops`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(accessToken),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(shopData),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Create seller shop failed: ${res.status} ${text}`);
  }

  return parseJsonResponse(res) as Promise<SellerShop>;
}

export async function uploadSellerShopAvatar(
  accessToken: string,
  shopId: string,
  avatar: {
    uri: string;
    fileName?: string | null;
    mimeType?: string | null;
  },
) {
  const formData = new FormData();
  const fallbackName = `shop-avatar-${Date.now()}.jpg`;

  formData.append("avatar", {
    uri: avatar.uri,
    name: avatar.fileName || fallbackName,
    type: avatar.mimeType || "image/jpeg",
  } as unknown as Blob);

  const res = await fetch(`${API_BASE}/api/shops/${shopId}/avatar`, {
    method: "PATCH",
    headers: getAuthHeaders(accessToken),
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Upload shop avatar failed: ${res.status} ${text}`);
  }

  const data = await parseJsonResponse(res);
  return data?.avatar as string | undefined;
}
