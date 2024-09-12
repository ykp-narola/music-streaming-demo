import { configureStore, createSlice } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; 
import { combineReducers } from "redux";

// Initial state for the auth slice
const initialState = {
    status: false,
    userData: null
}

// Creating the auth slice
const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers:{
        login: (state, action) => {
            state.status = true;
            state.userData = action.payload;
        },
        logout: (state) => {
            state.status = false;
            state.userData = null;
        },
        setUserData: (state, action) => {
            state.status = false;
            state.userData = action.payload;
        }
    }
})

// Extract actions and reducer from auth slice
export const { login, logout, setUserData } = authSlice.actions;
const authReducer = authSlice.reducer;

// Configuration for redux-persist
const persistConfig = {
    key: 'root', // Key to store in localStorage
    storage, // Default storage (localStorage)
}

// Combine reducers if you have multiple, here we just have auth
const rootReducer = combineReducers({
    auth: authReducer
});

// Persisting the rootReducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure the store with persisted reducer
export const store = configureStore({
    reducer: persistedReducer,
    middleware: getDefaultMiddleware =>
        getDefaultMiddleware({
          serializableCheck: false,
        }),
});

// Persistor for triggering persistence
export const persistor = persistStore(store);
