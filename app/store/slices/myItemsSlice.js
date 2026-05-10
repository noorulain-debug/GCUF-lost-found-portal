import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
export const fetchMyItems = createAsyncThunk(
  "myItems/fetchMyItems",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch("/api/items?myItems=true");
      const data = await res.json();

      if (!res.ok) {
        return rejectWithValue(data.error || "Failed to fetch items");
      }

      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const myItemsSlice = createSlice({
  name: "myItems",
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyItems.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchMyItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default myItemsSlice.reducer;
