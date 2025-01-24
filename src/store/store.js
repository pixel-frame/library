import { configureStore } from "@reduxjs/toolkit";
import cardReducer from "./cardSlice";
import loadingReducer from "./loadingSlice";

export const store = configureStore({
  reducer: {
    card: cardReducer,
    loading: loadingReducer,
  },
});
