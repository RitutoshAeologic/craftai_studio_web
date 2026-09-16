'use client'

import React, { createContext, useContext, useState, useEffect } from "react";

interface DrawerContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  toggleDrawer: () => void;
}

const DrawerContext = createContext<DrawerContextType>({
  isOpen: true,
  setIsOpen: () => {},
  toggleDrawer: () => {},
});

export function DrawerProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);

  // Restore drawer state preference from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("craftai_drawer_open");
      if (saved !== null) {
        setIsOpen(saved === "true");
      } else if (window.innerWidth < 1024) {
        setIsOpen(false);
      }
    } catch {
      // Ignore
    }
  }, []);

  const handleToggle = () => {
    setIsOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("craftai_drawer_open", String(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  return (
    <DrawerContext.Provider value={{ isOpen, setIsOpen, toggleDrawer: handleToggle }}>
      {children}
    </DrawerContext.Provider>
  );
}

export function useDrawer() {
  return useContext(DrawerContext);
}
