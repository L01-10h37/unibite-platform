import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as SecureStore from "expo-secure-store";

import { API_BASE_URL } from "@/constants/api";

// Định nghĩa cấu trúc Item chuẩn theo API của bạn
export interface CartItem {
  id: string;
  food: string; 
  name: string;
  seller: string;
  price: number;
  quantity: number;
  image: string;
}

interface CartState {
  id: string;
  items: CartItem[];
  totalQuantity: number;
  totalPrice: number;
  loading: boolean;
  error: string | null;
}

const initialState: CartState = {
  id: "",
  items: [],
  totalQuantity: 0,
  totalPrice: 0,
  loading: false,
  error: null,
};

async function getAccessToken() {
  const tokensRaw = await SecureStore.getItemAsync("tokens");
  const tokens = tokensRaw ? JSON.parse(tokensRaw) : null;
  return tokens?.accessToken as string | undefined;
}

// THUNK: Hàm gọi API Async để lấy dữ liệu giỏ hàng từ Backend
export const fetchCart = createAsyncThunk('cart/fetchCart', async () => {
    const accessToken = await getAccessToken();

    const response = await fetch(
        `${API_BASE_URL}/api/cart/`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
    const json = await response.json();
    
    if (json.success && json.data && json.data.items) {
        // Map dữ liệu từ API sang cấu trúc của Redux State
        return {
          id: json.data.id,
          items: json.data.items.map((item: any) => ({
            id: item.id,
            food: item.food,
            name: item.name,
            seller: item.shop?.name || "Quán ăn",
            price: item.price, 
            quantity: item.quantity,
            image: item.image,
          })),
          totalQuantity: json.data.totalQuantity,
          totalPrice: json.data.totalPrice,
        }
    }
    return {
      id: "",
      items: [],
      totalQuantity: 0,
      totalPrice: 0,
    };
});

export const deleteCartItem = createAsyncThunk(
  'cart/deleteCartItem',
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
        // Trả về id vừa xóa thành công để extraReducers cập nhật UI
        return {
          itemId: itemId,
          totalPrice: json.data.totalPrice, 
          totalQuantity: json.data.totalQuantity,
        };
      } else {
        return rejectWithValue(json.message || 'Không thể xóa món ăn');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Lỗi kết nối server');
    }
  }
);

export const updateCart = createAsyncThunk(
  'cart/updateCart',
  async ({ items, id }: { items: CartItem[]; id: string }, { rejectWithValue }) => {
    try {
      const accessToken = await getAccessToken();

      const response = await fetch(
        `${API_BASE_URL}/api/cart/${id}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ items }),
        }
      );
      const json = await response.json();

      if (json.success) {
        return {
          items: json.data.items,
          totalQuantity: json.data.totalQuantity,
          totalPrice: json.data.totalPrice,
          id: json.data.id,
        };
      } else {
        return rejectWithValue(json.message || 'Không thể cập nhật giỏ hàng');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Lỗi kết nối server');
    }
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    // Tăng số lượng Local (mượt giao diện trước khi đồng bộ API)
    incrementQuantity: (state, action: PayloadAction<{ id: string; price: number }>) => {
      const item = state.items.find(i => i.id === action.payload.id);
      if (item) item.quantity += 1;
      state.totalPrice += action.payload.price;
      state.totalQuantity += 1;
    },
    // Giảm số lượng Local
    decrementQuantity: (state, action: PayloadAction<{ id: string; price: number }>) => {
      const item = state.items.find(i => i.id === action.payload.id);
      if (item && item.quantity > 1) item.quantity -= 1;
      state.totalPrice -= action.payload.price;
      state.totalQuantity -= 1;
    },
    // Xóa item Local
    removeItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(i => i.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.id = action.payload.id;
        state.items = action.payload.items;
        state.totalQuantity = action.payload.totalQuantity;
        state.totalPrice = action.payload.totalPrice;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Lỗi tải giỏ hàng';
      })
      .addCase(deleteCartItem.fulfilled, (state, action) => {
        // Khi API trả về success, tiến hành lọc bỏ item khỏi mảng state cục bộ
        state.items = state.items.filter(item => item.id !== action.payload.itemId);
        state.totalQuantity = action.payload.totalQuantity;
        state.totalPrice = action.payload.totalPrice;
      })
      .addCase(deleteCartItem.rejected, (state, action) => {
        // Xử lý lỗi nếu xóa thất bại trên server (Ví dụ: thông báo lỗi)
        state.error = action.payload as string;
      })
      .addCase(updateCart.fulfilled, (state, action) => {
        state.totalQuantity = action.payload.totalQuantity;
        state.totalPrice = action.payload.totalPrice;
      })
      .addCase(updateCart.rejected, (state, action) => {
        state.error = action.payload as string;  
        // Có thể giữ nguyên state cũ nếu cập nhật thất bại, hoặc tùy chỉnh theo nhu cầu
        // state.items = action.payload.items;
      });
  },
});

export const { incrementQuantity, decrementQuantity, removeItem } = cartSlice.actions;
export default cartSlice.reducer;