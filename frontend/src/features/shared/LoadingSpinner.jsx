import React from "react";
import styles from "./LoadingSpinner.module.css";

const LoadingSpinner = ({ message = "Chargement..." }) => {
  return (
    <div className={styles.loadingContainer}>
      <div className={styles.spinner}></div>
      <p>{message}</p>
    </div>
  );
};

export default LoadingSpinner;
