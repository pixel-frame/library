import { createSlice } from "@reduxjs/toolkit";

const loadingSlice = createSlice({
  name: "loading",
  initialState: {
    hasShownIntro: false,
  },
  reducers: {
    setIntroShown: (state) => {
      state.hasShownIntro = true;
    },
  },
});

export const { setIntroShown } = loadingSlice.actions;
export default loadingSlice.reducer;
