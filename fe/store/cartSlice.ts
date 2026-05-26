import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import * as SecureStore from "expo-secure-store";

import { API_BASE_URL } from "@/constants/api";

export interface CartItem {
  id: string;
  foodId: string;
  name: string;
  restaurant: string;
  price: number;
  quantity: number;
  image: string;
}

interface CartState {
  items: CartItem[];
  loading: boolean;
  error: string | null;
}

const initialState: CartState = {
  items: [],
  loading: false,
  error: null,
};

async function getAccessToken() {
  const tokensRaw = await SecureStore.getItemAsync("tokens");
  const tokens = tokensRaw ? JSON.parse(tokensRaw) : null;
  return tokens?.accessToken as string | undefined;
}

export const fetchCart = createAsyncThunk("cart/fetchCart", async () => {
  const accessToken = await getAccessToken();

  const response = await fetch(`${API_BASE_URL}/api/cart/`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  const json = await response.json();

  if (json.success && json.data && json.data.items) {
    return json.data.items.map((item: any) => ({
      id: item.id || item._id,
      foodId: item.food?._id || item.food,
      name: item.name,
      restaurant: item.food?.shop?.name || "Quán ăn",
      price: item.finalPrice ?? item.specialPrice ?? item.price,
      quantity: item.quantity,
      image: item.image,
    })) as CartItem[];
  }

  return [];
});

export const deleteCartItem = createAsyncThunk(
  "cart/deleteCartItem",
  async (itemId: string, { rejectWithValue }) => {
    try {
      const accessToken = await getAccessToken();

      const response = await fetch(`${API_BASE_URL}/api/cart/items/${itemId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      const json = await response.json();

      if (json.success) {
        return itemId;
      }

      return rejectWithValue(json.message || "Không thể xóa món ăn");
    } catch (error: any) {
      return rejectWithValue(error.message || "Lỗi kết nối server");
    }
  },
);

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    incrementQuantity: (state, action: PayloadAction<string>) => {
      const item = state.items.find((entry) => entry.id === action.payload);
      if (item) {
        item.quantity += 1;
      }
    },
    decrementQuantity: (state, action: PayloadAction<string>) => {
      const item = state.items.find((entry) => entry.id === action.payload);
      if (item && item.quantity > 1) {
        item.quantity -= 1;
      }
    },
    removeItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Lỗi tải giỏ hàng";
      })
      .addCase(deleteCartItem.fulfilled, (state, action: PayloadAction<string>) => {
        state.items = state.items.filter((item) => item.id !== action.payload);
      })
      .addCase(deleteCartItem.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { incrementQuantity, decrementQuantity, removeItem } = cartSlice.actions;
export default cartSlice.reducer;
