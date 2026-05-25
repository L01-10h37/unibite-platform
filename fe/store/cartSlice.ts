import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as SecureStore from "expo-secure-store";


// Định nghĩa cấu trúc Item chuẩn theo API của bạn
export interface CartItem {
  id: string;
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

// THUNK: Hàm gọi API Async để lấy dữ liệu giỏ hàng từ Backend
export const fetchCart = createAsyncThunk('cart/fetchCart', async () => {
    const tokensRaw = await SecureStore.getItemAsync("tokens");
    const tokens = tokensRaw ? JSON.parse(tokensRaw) : null;
    const accessToken = tokens?.accessToken;

    const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/cart/`,
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
        return json.data.items.map((item: any) => ({
        id: item.id,
        name: item.name,
        restaurant: item.food?.shop?.name || "Quán ăn",
        price: item.price, 
        quantity: item.quantity,
        image: item.image,
        }));
    }
    return [];
});

export const deleteCartItem = createAsyncThunk(
  'cart/deleteCartItem',
  async (itemId: string, { rejectWithValue }) => {
    try {
      const tokensRaw = await SecureStore.getItemAsync("tokens");
      const tokens = tokensRaw ? JSON.parse(tokensRaw) : null;
      const accessToken = tokens?.accessToken;

      // Gọi đến API route đúng cấu trúc: /api/cart/items/:id
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/cart/items/${itemId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const json = await response.json();

      if (json.success) {
        // Trả về id vừa xóa thành công để extraReducers cập nhật UI
        return itemId;
      } else {
        return rejectWithValue(json.message || 'Không thể xóa món ăn');
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
    incrementQuantity: (state, action: PayloadAction<string>) => {
      const item = state.items.find(i => i.id === action.payload);
      if (item) item.quantity += 1;
    },
    // Giảm số lượng Local
    decrementQuantity: (state, action: PayloadAction<string>) => {
      const item = state.items.find(i => i.id === action.payload);
      if (item && item.quantity > 1) item.quantity -= 1;
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
        state.items = action.payload;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Lỗi tải giỏ hàng';
      })
      .addCase(deleteCartItem.fulfilled, (state, action: PayloadAction<string>) => {
        // Khi API trả về success, tiến hành lọc bỏ item khỏi mảng state cục bộ
        state.items = state.items.filter(item => item.id !== action.payload);
      })
      .addCase(deleteCartItem.rejected, (state, action) => {
        // Xử lý lỗi nếu xóa thất bại trên server (Ví dụ: thông báo lỗi)
        state.error = action.payload as string;
      });
  },
});

export const { incrementQuantity, decrementQuantity, removeItem } = cartSlice.actions;
export default cartSlice.reducer;