
"use client";

import { Provider } from "react-redux";
import { store } from "../store/store";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useEffect } from "react";
import BottomNav from "./BottomNav/BottomNav";

export default function ClientProvider({ children }) {
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === "logout") {
        // another tab logged out — reload to update UI / clear client state
        window.location.href = "/";
      }
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return (
    <Provider store={store}>
      <div className="main-content">
        {children}
      </div>
      
      {/* Mobile Bottom Navigation */}
      <BottomNav />

      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        style={{ marginTop: '60px' }}
      />
    </Provider>
  );
}
