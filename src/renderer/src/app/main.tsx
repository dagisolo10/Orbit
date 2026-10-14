import "@/app/index.css";

import { App } from "@/components/layout/app";
import { OrbitProvider } from "@/providers/orbit-provider";
import { ServersProvider } from "@/providers/servers-provider";
import { ToastProvider } from "@/providers/toast-provider";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <ToastProvider>
            <OrbitProvider>
                <ServersProvider>
                    <App />
                </ServersProvider>
            </OrbitProvider>
        </ToastProvider>
    </StrictMode>,
);
