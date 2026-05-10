import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";


export const fetchItems = createAsyncThunk(
  "items/fetchItems",
  async ({ type, category }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (type && type !== "all") params.append("type", type);
      if (category && category !== "all") params.append("category", category);

      const res = await fetch(`/api/items?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch items");

      return await res.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);


export const addItem = createAsyncThunk(
  "items/addItem",
  async (itemData, { rejectWithValue }) => {
    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(itemData),
      });

      if (!res.ok) throw new Error("Failed to add item");
      return await res.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);


export const fetchAdminItems = createAsyncThunk(
  "items/fetchAdminItems",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch("/api/admin");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Admin fetch failed");
      }
      return await res.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);


export const deleteItemAdmin = createAsyncThunk(
  "items/deleteItemAdmin",
  async (id, { rejectWithValue }) => {
    try {
      const res = await fetch(`/api/admin/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      return id;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);


export const resolveItemAdmin = createAsyncThunk(
  "items/resolveItemAdmin",
  async (id, { rejectWithValue }) => {
    try {
      const res = await fetch(`/api/admin/${id}`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Resolve failed");
      return id;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);


const itemsSlice = createSlice({
  name: "items",
  initialState: {
    list: [],
    status: "idle",
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder


      .addCase(fetchItems.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchItems.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.list = action.payload;
      })
      .addCase(fetchItems.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })


      .addCase(addItem.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
      })


      .addCase(fetchAdminItems.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchAdminItems.fulfilled, (state, action) => {
        console.log("Admin items fetched:", action.payload);
        state.status = "succeeded";
        state.list = action.payload;
      })

      .addCase(deleteItemAdmin.fulfilled, (state, action) => {
        state.list = state.list.filter(item => item._id !== action.payload);
      })
      .addCase(resolveItemAdmin.fulfilled, (state, action) => {
        const item = state.list.find(i => i._id === action.payload);
        if (item) item.type = "resolved";
      });
  },
});

export default itemsSlice.reducer;
