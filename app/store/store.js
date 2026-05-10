import { configureStore } from "@reduxjs/toolkit";
import itemsReducer from "./slices/itemsSlice";
import myItemsReducer from "./slices/myItemsSlice";


export const store = configureStore({
  reducer: {
    items: itemsReducer,
    myItems: myItemsReducer,
   
  },
});
