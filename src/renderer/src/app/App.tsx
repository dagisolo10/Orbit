import { AppShell } from "@/components/layout/app-shell";
import { OrbitProvider } from "@/providers/orbit-provider";
import { ToastProvider } from "@/providers/toast-provider";

export default function App() {
    return (
        <ToastProvider>
            <OrbitProvider>
                <AppShell />
            </OrbitProvider>
        </ToastProvider>
    );
}
