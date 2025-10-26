// src/redux/store.js
import { configureStore } from "@reduxjs/toolkit";
import { combineReducers } from "@reduxjs/toolkit";

// Import slices unifiés
import authReducer from "./features/auth/authSlice";
import patientsReducer from "./features/patients/patientsSlice";
import facturesReducer from "./features/factures/facturesSlice";
import appointmentsReducer from "./features/appointments/appointmentsSlice"; // Slice unifié

const rootReducer = combineReducers({
  auth: authReducer,
  patients: patientsReducer,
  factures: facturesReducer,
  appointments: appointmentsReducer, // Remplace rdvReducer
});

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
