import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isExpanded: false,
  isDetailView: false,
  previousPath: "/",
  navigationSource: null,
  modalActive: false,
};

const cardSlice = createSlice({
  name: "card",
  initialState,
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
    setPreviousPath: (state, action) => {
      state.previousPath = action.payload;
    },
    setNavigationSource: (state, action) => {
      state.navigationSource = action.payload;
    },
    setModalActive: (state, action) => {
      state.modalActive = action.payload;
    },
  },
});

export const { setExpanded, setDetailView, setPreviousPath, setNavigationSource, setModalActive } = cardSlice.actions;
export default cardSlice.reducer;
