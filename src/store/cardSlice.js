import { createSlice } from "@reduxjs/toolkit";

const cardSlice = createSlice({
  name: "card",
  initialState: {
    isExpanded: false,
    isDetailView: false,
  },
  reducers: {
    setExpanded: (state, action) => {
      state.isExpanded = action.payload;
    },
    setDetailView: (state, action) => {
      state.isDetailView = action.payload;
      if (action.payload) {
        state.isExpanded = true;
      }
    },
  },
});

export const { setExpanded, setDetailView } = cardSlice.actions;
export default cardSlice.reducer;
