import React from "react";
import styles from "./EmptyState.module.css";

const EmptyState = ({ icon, message, action }) => {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>{icon}</div>
      <p className={styles.emptyMessage}>{message}</p>
      {action && (
        <button className={styles.emptyAction} onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
