// src/store.js
import { configureStore } from "@reduxjs/toolkit";

// Import slices
import authReducer from "./features/auth/authSlice";
import patientsReducer from "./features/patients/patientsSlice";
import facturesReducer from "./features/factures/facturesSlice";
import rdvReducer from "./features/rdv/appointmentsSlice";

// Combine reducers
import { combineReducers } from "@reduxjs/toolkit";
const rootReducer = combineReducers({
  auth: authReducer,
  patients: patientsReducer,
  factures: facturesReducer,
  rdv: rdvReducer,
});

// Configure store
const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
