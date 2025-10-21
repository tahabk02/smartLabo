import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import usersReducer from "../features/users/usersPage";
import patientsReducer from "../features/patients/patientsSlice";
import doctorsReducer from "../features/doctors/doctorsSlice";
import tasksReducer from "../features/tasks/tasksSlice";
import facturesReducer from "../features/factures/facturesSlice";
import dashboardReducer from "../features/dashboard/dashboardSlice";

const rootReducer = combineReducers({
  auth: authReducer,
  users: usersReducer,
  patients: patientsReducer,
  doctors: doctorsReducer,
  tasks: tasksReducer,
  factures: facturesReducer,
  dashboard: dashboardReducer,
});

export default rootReducer;
