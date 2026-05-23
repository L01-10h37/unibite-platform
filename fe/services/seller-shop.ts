export type SellerShop = {
  id: string;
  name: string;
  avatar?: string | null;
  address?: string;
  openingHours?: string;
  about?: string;
};

export type SellerFood = {
  id: string;
  name: string;
  description?: string;
  categoryId?: string | null;
  categoryName?: string | null;
  listUrlImg?: string[];
  isAvailble?: boolean;
  isDraft?: boolean;
  price: number;
  specialPrice?: number | null;
  startTime?: string | null;
  endTime?: string | null;
  average_rating?: number;
  rating_count?: number;
  sold_count?: number;
  createdAt?: string;
};

export type SellerCategory = {
  id: string;
  name: string;
  parentId?: string | null;
  child?: SellerCategory[];
  children?: SellerCategory[];
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
    openingHours?: string;
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

export async function updateSellerShop(
  accessToken: string,
  shopId: string,
  shopData: {
    name?: string;
    address?: string;
    openingHours?: string;
    about?: string;
  },
) {
  const res = await fetch(`${API_BASE}/api/shops/${shopId}`, {
    method: "PUT",
    headers: {
      ...getAuthHeaders(accessToken),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(shopData),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Update seller shop failed: ${res.status} ${text}`);
  }

  return parseJsonResponse(res) as Promise<SellerShop>;
}

export async function getSellerMenu(accessToken: string, limit = 10) {
  const res = await fetch(`${API_BASE}/api/foods/my-menu?limit=${limit}`, {
    method: "GET",
    headers: getAuthHeaders(accessToken),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Get seller menu failed: ${res.status} ${text}`);
  }

  return parseJsonResponse(res) as Promise<SellerFood[]>;
}

export async function getFoodCategories() {
  const res = await fetch(`${API_BASE}/api/categories/hierarchy`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Get categories failed: ${res.status} ${text}`);
  }

  return parseJsonResponse(res) as Promise<SellerCategory[]>;
}

export async function getChildFoodCategories(parentId: string) {
  const res = await fetch(`${API_BASE}/api/categories/${parentId}/children`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Get child categories failed: ${res.status} ${text}`);
  }

  return parseJsonResponse(res) as Promise<SellerCategory[]>;
}

export async function createSellerFood(
  accessToken: string,
  foodData: {
    name: string;
    description?: string;
    category: string;
    price: number;
    specialPrice?: number | null;
    isAvailble?: boolean;
    isDraft?: boolean;
    startTime?: string | null;
    endTime?: string | null;
  },
) {
  const res = await fetch(`${API_BASE}/api/foods`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(accessToken),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(foodData),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Create food failed: ${res.status} ${text}`);
  }

  return parseJsonResponse(res) as Promise<SellerFood>;
}

export async function updateSellerFood(
  accessToken: string,
  foodId: string,
  foodData: {
    name?: string;
    description?: string;
    category?: string;
    price?: number;
    specialPrice?: number | null;
    isAvailble?: boolean;
    isDraft?: boolean;
    startTime?: string | null;
    endTime?: string | null;
  },
) {
  const res = await fetch(`${API_BASE}/api/foods/${foodId}`, {
    method: "PUT",
    headers: {
      ...getAuthHeaders(accessToken),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(foodData),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Update food failed: ${res.status} ${text}`);
  }

  return parseJsonResponse(res) as Promise<SellerFood>;
}

export async function deleteSellerFood(accessToken: string, foodId: string) {
  const res = await fetch(`${API_BASE}/api/foods/${foodId}`, {
    method: "DELETE",
    headers: getAuthHeaders(accessToken),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Delete food failed: ${res.status} ${text}`);
  }

  return parseJsonResponse(res) as Promise<{ id?: string }>;
}

export async function uploadSellerFoodImages(
  accessToken: string,
  foodId: string,
  images: Array<{
    uri: string;
    fileName?: string | null;
    mimeType?: string | null;
  }>,
) {
  const formData = new FormData();

  images.forEach((image, index) => {
    formData.append("images", {
      uri: image.uri,
      name: image.fileName || `food-${foodId}-${index + 1}.jpg`,
      type: image.mimeType || "image/jpeg",
    } as unknown as Blob);
  });

  const res = await fetch(`${API_BASE}/api/foods/${foodId}/images`, {
    method: "PATCH",
    headers: getAuthHeaders(accessToken),
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Upload food images failed: ${res.status} ${text}`);
  }

  return parseJsonResponse(res) as Promise<{ imageUrls?: string[] }>;
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
