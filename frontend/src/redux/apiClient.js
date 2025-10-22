import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Response Interceptor amélioré
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status } = error.response;

      // ✅ فقط إذا السيرفر فعلاً جاوب بـ 401 و المستخدم مسجل
      if (status === 401 && localStorage.getItem("token")) {
        console.warn("⚠️ Session expirée. Veuillez vous reconnecter.");

        // ممكن تضيف toast بدل redirect مباشر
        setTimeout(() => {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "/login";
        }, 1000); // يمهلو ثانية قبل ما يحيد token
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
