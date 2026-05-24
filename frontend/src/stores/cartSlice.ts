import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import cartApi, { type CartItem } from "@/services/cartApi";
import type { Product } from "@/services/productApi";

// ─── Types ────────────────────────────────────────────────────────────────────
interface CartState {
  items: CartItem[];
  totalPrice: number;
  totalItems: number;
  loading: boolean;
  error: string | null;
}

// ─── Initial State ─────────────────────────────────────────────────────────────
const storedCart = localStorage.getItem("guestCart");
const parsedCart = storedCart ? JSON.parse(storedCart) : { items: [], total_price: 0, total_items: 0 };

const initialState: CartState = {
  items: parsedCart.items || [],
  totalPrice: parsedCart.total_price || 0,
  totalItems: parsedCart.total_items || 0,
  loading: false,
  error: null,
};

// Helper to recalculate guest cart
const recalculateGuestCart = (state: CartState) => {
  state.totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
  state.totalPrice = state.items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  
  // Save to localStorage
  localStorage.setItem(
    "guestCart",
    JSON.stringify({
      items: state.items,
      total_price: state.totalPrice,
      total_items: state.totalItems,
    })
  );
};

// ─── Async Thunks (User Mode) ──────────────────────────────────────────────────

export const fetchCartThunk = createAsyncThunk(
  "cart/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const response = await cartApi.getCart();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Lỗi lấy giỏ hàng");
    }
  }
);

export const addToCartThunk = createAsyncThunk(
  "cart/add",
  async (
    payload: {
      productId: number;
      quantity: number;
      size?: string | null;
      color?: string | null;
      type?: string | null;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await cartApi.addToCart(
        payload.productId,
        payload.quantity,
        payload.size,
        payload.color,
        payload.type
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Không thể thêm sản phẩm");
    }
  }
);

export const updateCartThunk = createAsyncThunk(
  "cart/update",
  async (
    payload: { productId: number; quantity: number; fieldKey?: string | null },
    { rejectWithValue }
  ) => {
    try {
      const response = await cartApi.updateCart(payload.productId, payload.quantity, payload.fieldKey);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Không thể cập nhật số lượng");
    }
  }
);

export const removeFromCartThunk = createAsyncThunk(
  "cart/remove",
  async (fieldKey: string | number, { rejectWithValue }) => {
    try {
      const response = await cartApi.removeFromCart(fieldKey);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Không thể xóa sản phẩm");
    }
  }
);

export const removeMultipleFromCartThunk = createAsyncThunk(
  "cart/removeMultiple",
  async (fieldKeys: string[], { rejectWithValue }) => {
    try {
      const response = await cartApi.removeMultipleFromCart(fieldKeys);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Không thể xóa các sản phẩm đã chọn");
    }
  }
);

export const clearCartThunk = createAsyncThunk(
  "cart/clear",
  async (_, { rejectWithValue }) => {
    try {
      const response = await cartApi.clearCart();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Không thể làm trống giỏ hàng");
    }
  }
);

export const syncCartThunk = createAsyncThunk(
  "cart/sync",
  async (
    items: {
      product_id: number;
      quantity: number;
      size?: string | null;
      color?: string | null;
      type?: string | null;
    }[],
    { rejectWithValue }
  ) => {
    try {
      const response = await cartApi.syncCart(items);
      localStorage.removeItem("guestCart");
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Lỗi đồng bộ giỏ hàng");
    }
  }
);

// ─── Slice ─────────────────────────────────────────────────────────────────────
const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    // ── Guest Mode Reducers ──
    addToCartLocal(
      state,
      action: PayloadAction<{
        product: Product;
        quantity: number;
        size?: string | null;
        color?: string | null;
        type?: string | null;
      }>
    ) {
      const { product, quantity, size = null, color = null, type = null } = action.payload;
      const fieldKey = [product.id, size || "", color || "", type || ""].join("_");
      
      const existing = state.items.find(
        (item) =>
          item.field_key === fieldKey ||
          (!item.field_key &&
            item.product_id === product.id &&
            item.size === size &&
            item.color === color &&
            item.type === type)
      );
      
      // Tồn kho tối đa của biến thể
      let maxStock = product.stock;
      if (product.variants && (size || color || type)) {
        const variant = product.variants.find(
          (v) =>
            (!size || v.size === size) &&
            (!color || v.color === color) &&
            (!type || v.type === type)
        );
        if (variant) {
          maxStock = variant.stock;
        }
      }

      if (existing) {
        const newQty = existing.quantity + quantity;
        if (newQty > maxStock) {
          existing.quantity = maxStock;
        } else {
          existing.quantity = newQty;
        }
        existing.subtotal = Number(existing.price) * existing.quantity;
      } else {
        const primaryImage = product.images?.find((img) => img.is_primary)?.image_url || product.images?.[0]?.image_url || null;
        
        state.items.push({
          product_id: product.id,
          field_key: fieldKey,
          name: product.name,
          slug: product.slug,
          price: product.price,
          original_price: product.original_price || null,
          image: primaryImage,
          category: product.category?.name || null,
          stock: maxStock,
          quantity: quantity > maxStock ? maxStock : quantity,
          subtotal: Number(product.price) * (quantity > maxStock ? maxStock : quantity),
          size,
          color,
          type
        });
      }
      recalculateGuestCart(state);
    },

    updateCartLocal(state, action: PayloadAction<{ productId: number; quantity: number; fieldKey?: string | null }>) {
      const { productId, quantity, fieldKey } = action.payload;
      const existing = state.items.find(
        (item) =>
          item.field_key === fieldKey ||
          (!item.field_key && item.product_id === productId)
      );
      
      if (existing) {
        if (quantity <= 0) {
          state.items = state.items.filter(
            (item) =>
              item.field_key !== fieldKey &&
              item.product_id !== productId
          );
        } else {
          existing.quantity = quantity > existing.stock ? existing.stock : quantity;
          existing.subtotal = Number(existing.price) * existing.quantity;
        }
        recalculateGuestCart(state);
      }
    },

    removeFromCartLocal(state, action: PayloadAction<{ productId: number; fieldKey?: string | null }>) {
      const { productId, fieldKey } = action.payload;
      state.items = state.items.filter((item) => {
        if (fieldKey) return item.field_key !== fieldKey;
        return item.product_id !== productId;
      });
      recalculateGuestCart(state);
    },

    clearCartLocal(state) {
      state.items = [];
      state.totalPrice = 0;
      state.totalItems = 0;
      localStorage.removeItem("guestCart");
    },
    removeCheckedOutItemsLocal(state, action: PayloadAction<string[]>) {
      const selectedKeys = action.payload;
      state.items = state.items.filter((item) => {
        const itemKey = item.field_key || [item.product_id, item.size || "", item.color || "", item.type || ""].join("_");
        return !selectedKeys.includes(itemKey);
      });
      recalculateGuestCart(state);
    },
    removeMultipleFromCartLocal(state, action: PayloadAction<string[]>) {
      const selectedKeys = action.payload;
      state.items = state.items.filter((item) => {
        const itemKey = item.field_key || [item.product_id, item.size || "", item.color || "", item.type || ""].join("_");
        return !selectedKeys.includes(itemKey);
      });
      recalculateGuestCart(state);
    },
  },
  
  extraReducers: (builder) => {
    // ── fetchCart ──
    builder
      .addCase(fetchCartThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCartThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.totalPrice = action.payload.total_price;
        state.totalItems = action.payload.total_items;
      })
      .addCase(fetchCartThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // ── addToCart ──
    builder
      .addCase(addToCartThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addToCartThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.totalPrice = action.payload.total_price;
        state.totalItems = action.payload.total_items;
      })
      .addCase(addToCartThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // ── updateCart ──
    builder
      .addCase(updateCartThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCartThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.totalPrice = action.payload.total_price;
        state.totalItems = action.payload.total_items;
      })
      .addCase(updateCartThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // ── removeFromCart ──
    builder
      .addCase(removeFromCartThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeFromCartThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.totalPrice = action.payload.total_price;
        state.totalItems = action.payload.total_items;
      })
      .addCase(removeFromCartThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // ── removeMultipleFromCart ──
    builder
      .addCase(removeMultipleFromCartThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeMultipleFromCartThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.totalPrice = action.payload.total_price;
        state.totalItems = action.payload.total_items;
      })
      .addCase(removeMultipleFromCartThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // ── clearCart ──
    builder
      .addCase(clearCartThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(clearCartThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.totalPrice = action.payload.total_price;
        state.totalItems = action.payload.total_items;
      })
      .addCase(clearCartThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // ── syncCart ──
    builder
      .addCase(syncCartThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(syncCartThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.totalPrice = action.payload.total_price;
        state.totalItems = action.payload.total_items;
      })
      .addCase(syncCartThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  addToCartLocal,
  updateCartLocal,
  removeFromCartLocal,
  clearCartLocal,
  removeCheckedOutItemsLocal,
  removeMultipleFromCartLocal,
} = cartSlice.actions;

export default cartSlice.reducer;
