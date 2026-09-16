'use client'

import { usePathname } from "next/navigation";
import { DrawerProvider } from "@/context/DrawerContext";
import { UserProvider } from "@/context/UserContext";
import AppDrawer from "./AppDrawer";
import TopBar from "./TopBar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith("/auth");

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <UserProvider>
      <DrawerProvider>
        <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden", background: "#0a0e18" }}>
          {/* Leftmost Collapsible Sidebar Drawer */}
          <AppDrawer />

          {/* Right Main Content Area */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100vh", overflow: "hidden" }}>
            <TopBar />
            <div style={{ flex: 1, overflowY: "auto", position: "relative", display: "flex", flexDirection: "column" }}>
              {children}
            </div>
          </div>
        </div>
      </DrawerProvider>
    </UserProvider>
  );
}
