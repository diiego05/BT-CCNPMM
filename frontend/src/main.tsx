import { createRoot } from "react-dom/client";
import "@/styles/style.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { Provider as ReduxProvider } from "react-redux";
import { store } from "@/stores/store";
import { GoogleOAuthProvider } from "@react-oauth/google";

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <ReduxProvider store={store}>
      <GoogleOAuthProvider clientId={clientId}>
        <App />
      </GoogleOAuthProvider>
    </ReduxProvider>
  </BrowserRouter>,
);
