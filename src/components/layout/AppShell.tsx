'use client'

import { usePathname } from "next/navigation";
import { DrawerProvider } from "@/context/DrawerContext";
import { UserProvider } from "@/context/UserContext";
import { LLMConfigProvider } from "@/context/LLMConfigContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { GenerationProvider } from "@/context/GenerationContext";
import AppDrawer from "./AppDrawer";
import TopBar from "./TopBar";
import GlobalGenerationToast from "./GlobalGenerationToast";
import BottomNavDock from "./BottomNavDock";

import { useTheme } from "@/context/ThemeContext";

function AppShellContent({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        background: colors.background,
        color: colors.textPrimary,
        transition: "background-color 0.2s ease, color 0.2s ease",
      }}
    >
      {/* Leftmost Slim Icon Rail Sidebar */}
      <AppDrawer />

      {/* Right Main Content Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100vh", overflow: "hidden" }}>
        <TopBar />
        <div style={{ flex: 1, overflowY: "auto", position: "relative", display: "flex", flexDirection: "column", background: colors.background }}>
          {children}
        </div>
      </div>

      {/* Floating Bottom Navigation Dock (MeiGen Style) */}
      <BottomNavDock />

      {/* Global Safeguard Generation Toast */}
      <GlobalGenerationToast />
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith("/auth");

  if (isAuthPage) {
    return <ThemeProvider>{children}</ThemeProvider>;
  }

  return (
    <ThemeProvider>
      <UserProvider>
        {/* LLMConfigProvider fetches GET /api/v1/prompt-engineering/config on mount
            and polls every 60s so the UI always reflects Supabase app_settings changes
            without requiring a redeploy. Must be inside UserProvider so it can inject
            the bearer JWT when calling the config endpoint. */}
        <LLMConfigProvider>
          <DrawerProvider>
            <GenerationProvider>
              <AppShellContent>{children}</AppShellContent>
            </GenerationProvider>
          </DrawerProvider>
        </LLMConfigProvider>
      </UserProvider>
    </ThemeProvider>
  );
}
