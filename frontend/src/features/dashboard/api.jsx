import axios from "axios";

const BASE_URL = "/api/dashboard";

const dashboardApi = {
  fetchStats: () => axios.get(`${BASE_URL}/stats`),
};

export default dashboardApi;
