import { configureStore, createSlice } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';

// App slice for global app state
const appSlice = createSlice({
  name: 'app',
  initialState: {
    isLoading: false,
    theme: 'light'
  },
  reducers: {
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
    }
  }
});

export const { setLoading, setTheme } = appSlice.actions;

export const store = configureStore({
  reducer: {
    app: appSlice.reducer,
    // Future API reducers will go here
  },
  middleware: getDefaultMiddleware => getDefaultMiddleware(),
});
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

setupListeners(store.dispatch);
