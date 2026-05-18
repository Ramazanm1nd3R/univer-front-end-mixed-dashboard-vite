import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import ToastViewport from '../ui/ToastViewport';
import styles from '../../styles/mixedDashboard.module.css';

function AppShell() {
  return (
    <div className={styles.appShell}>
      <div className={styles.appBackdrop} />
      <Header />
      <main className={styles.main}>
        <Outlet />
      </main>
      <ToastViewport />
    </div>
  );
}

export default AppShell;

