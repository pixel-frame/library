import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  center: [-74.006, 40.7128],
  zoom: 12,
  selectedFeature: null,
};

export const mapSlice = createSlice({
  name: "map",
  initialState,
  reducers: {
    setCenter: (state, action) => {
      state.center = action.payload;
    },
    setZoom: (state, action) => {
      state.zoom = action.payload;
    },
    setSelectedFeature: (state, action) => {
      state.selectedFeature = action.payload;
    },
  },
});

export const { setCenter, setZoom, setSelectedFeature } = mapSlice.actions;
export default mapSlice.reducer;
