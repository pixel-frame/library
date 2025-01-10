import { configureStore } from "@reduxjs/toolkit";
import mapReducer from "./slices/mapSlice";
import viewerReducer from "./slices/viewerSlice";
import logger from "../middleware/logger";

export const store = configureStore({
  reducer: {
    map: mapReducer,
    viewer: viewerReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(logger),
});
