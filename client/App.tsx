import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  useLocation,
} from "react-router-dom";
import { FileText, Send } from "lucide-react";
import DocumentList from "./pages/DocumentList";
import Expedition from "./pages/Expedition";
import NotFound from "./pages/NotFound";
import { cn } from "./lib/utils";
import { ToastProvider } from "./lib/toastContext";

interface NavigationGuardContextType {
  shouldBlockNavigation: boolean;
  setShouldBlockNavigation: (value: boolean) => void;
  onNavigationAttempt: (path: string) => void;
  setOnNavigationAttempt: (fn: (path: string) => void) => void;
}

const NavigationGuardContext = createContext<NavigationGuardContextType>({
  shouldBlockNavigation: false,
  setShouldBlockNavigation: () => {},
  onNavigationAttempt: () => {},
  setOnNavigationAttempt: () => {},
});

export const useNavigationGuard = () => useContext(NavigationGuardContext);

function Navigation() {
  const location = useLocation();
  const { shouldBlockNavigation, onNavigationAttempt } = useNavigationGuard();

  const handleNavClick = (e: React.MouseEvent, path: string) => {
    if (shouldBlockNavigation && location.pathname !== path) {
      e.preventDefault();
      onNavigationAttempt(path);
    }
  };

  return (
    <nav className="bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-50">
      <div className="flex">
        <NavLink
          to="/"
          onClick={(e) => handleNavClick(e, "/")}
          className={({ isActive }) =>
            cn(
              "flex-1 flex flex-col items-center justify-center py-2 px-1 text-xs transition-colors",
              isActive || location.pathname === "/"
                ? "text-orange-600 bg-orange-50"
                : "text-gray-600",
            )
          }
        >
          <FileText className="h-5 w-5 mb-1" />
          <span>Documents</span>
        </NavLink>
        <NavLink
          to="/expedition"
          onClick={(e) => handleNavClick(e, "/expedition")}
          className={({ isActive }) =>
            cn(
              "flex-1 flex flex-col items-center justify-center py-2 px-1 text-xs transition-colors",
              isActive ? "text-orange-600 bg-orange-50" : "text-gray-600",
            )
          }
        >
          <Send className="h-5 w-5 mb-1" />
          <span>Expedition</span>
        </NavLink>
      </div>
    </nav>
  );
}

function AppHeader() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="px-4 py-3">
        <h1 className="text-lg font-semibold text-gray-900">Doc Expedition</h1>
      </div>
    </header>
  );
}

function NavigationGuardProvider({ children }: { children: React.ReactNode }) {
  const [shouldBlockNavigation, setShouldBlockNavigation] = useState(false);
  const [onNavigationAttempt, setOnNavigationAttempt] = useState<
    (path: string) => void
  >(() => {});

  return (
    <NavigationGuardContext.Provider
      value={{
        shouldBlockNavigation,
        setShouldBlockNavigation,
        onNavigationAttempt,
        setOnNavigationAttempt: (fn) => setOnNavigationAttempt(() => fn),
      }}
    >
      {children}
    </NavigationGuardContext.Provider>
  );
}

function App() {
  return (
    <ToastProvider>
      <NavigationGuardProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-gray-50 pb-16">
            <AppHeader />
            <main className="min-h-screen">
              <Routes>
                <Route path="/" element={<DocumentList />} />
                <Route path="/expedition" element={<Expedition />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Navigation />
          </div>
        </BrowserRouter>
      </NavigationGuardProvider>
    </ToastProvider>
  );
}

export default App;
