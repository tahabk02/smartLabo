import styles from "./Loader.module.css";

const Loader = ({ fullscreen = false, message = "Loading..." }) => {
  return (
    <div className={`loader-container ${fullscreen ? "fullscreen" : ""}`}>
      <div className={styles["spinner"]}></div>
      {message && <p className={styles["loader-message"]}>{message}</p>}
    </div>
  );
};

export default Loader;
