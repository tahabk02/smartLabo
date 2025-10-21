// src/store.js
import { configureStore } from "@reduxjs/toolkit";

// ✅ Import correct des slices
import authReducer from "./features/auth/authSlice";
import patientsReducer from "./features/patients/patientsSlice";
import tasksReducer from "./features/tasks/tasksSlice";
import doctorsReducer from "./features/doctors/doctorsSlice";
import usersReducer from "./features/users/usersSlice";
import facturesReducer from "./features/factures/facturesSlice";
import dashboardReducer from "./features/dashboard/dashboardSlice";
import analysesReducer from "./features/analyses/analysesSlice";
// import notificationsReducer from "./features/notifications/notificationsSlice";
import appointmentsReducer from "./features/appointments/appointmentsSlice"; // ✅ زيدنا هادي

const store = configureStore({
  reducer: {
    auth: authReducer,
    patients: patientsReducer,
    tasks: tasksReducer,
    doctors: doctorsReducer,
    users: usersReducer,
    factures: facturesReducer,
    dashboard: dashboardReducer,
    analyses: analysesReducer,
    appointments: appointmentsReducer, // ✅ زيدنا هادي
    // notifications: notificationsReducer,
  },
});

export default store;
