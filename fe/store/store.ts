import { configureStore } from '@reduxjs/toolkit';
import cartReducer from './cartSlice';

export const store = configureStore({
  reducer: {
    cart: cartReducer,
  },
});

// Xuất các Type cấu hình để dùng cho TypeScript chuẩn xác
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;