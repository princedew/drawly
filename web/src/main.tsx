import { createRoot } from "react-dom/client";
import App from "./App";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: "#14211d",
          color: "#f3f6ef",
          border: "1px solid #344640",
          borderRadius: "8px",
        },
        success: {
          iconTheme: { primary: "#62c9a9", secondary: "#082018" },
        },
        error: {
          iconTheme: { primary: "#e9795b", secondary: "#321d19" },
        },
      }}
    />
  </QueryClientProvider>,
);
