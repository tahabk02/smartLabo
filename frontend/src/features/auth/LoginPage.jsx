import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { login, clearError } from "./authSlice";
import { toast } from "react-toastify";

import styles from "./Auth.module.css";

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useSelector(
    (state) => state.auth
  );

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [error, isAuthenticated, navigate, dispatch]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(login(formData));
  };

  return (
    <div className={styles["auth-page"]}>
      <div className={styles["auth-card"]}>
        <div className={styles["auth-logo"]}>
          <img src="/logo.png" alt="SmartLab" />
          <h2>SmartLab</h2>
        </div>

        <h3>Welcome Back</h3>
        <p className={styles["auth-subtitle"]}>Sign in to your account</p>

        <form onSubmit={handleSubmit}>
          <div className={styles["form-group"]}>
            <label htmlFor="email">Email Address</label>
            <div className={styles["input-wrapper"]}>
              <span className={styles["input-icon"]}>✉️</span>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="your.email@example.com"
                className={styles["form-control"]}
                autoComplete="email"
              />
            </div>
          </div>

          <div className={styles["form-group"]}>
            <label htmlFor="password">Password</label>
            <div
              className={`${styles["input-wrapper"]} ${styles["password-wrapper"]}`}
            >
              <span className={styles["input-icon"]}>🔒</span>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
                className={styles["form-control"]}
                minLength={6}
                autoComplete="current-password"
              />
              <button
                type="button"
                className={styles["password-toggle"]}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          <div className={styles["remember-forgot"]}>
            <div className={styles["checkbox-wrapper"]}>
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label htmlFor="remember">Remember me</label>
            </div>
            <Link to="/forgot-password" className={styles["forgot-link"]}>
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            className={`${styles["btn-block"]} ${styles["btn-primary"]} ${
              loading ? styles["loading"] : ""
            }`}
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className={styles["divider"]}>
          <span>Or continue with</span>
        </div>

        <div className={styles["social-login"]}>
          <button
            type="button"
            className={styles["btn-social"]}
            aria-label="Sign in with Google"
          >
            <img src="https://www.google.com/favicon.ico" alt="" />
            <span>Google</span>
          </button>
          <button
            type="button"
            className={styles["btn-social"]}
            aria-label="Sign in with GitHub"
          >
            <img src="https://github.com/favicon.ico" alt="" />
            <span>GitHub</span>
          </button>
        </div>

        <div className={styles["auth-links"]}>
          <p>
            Don't have an account? <Link to="/register">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
