// App.tsx
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
  Link,
} from "react-router-dom";
import React, { ReactNode, lazy, Suspense } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { DataCloudProvider } from "./components/DataCloudProvider";
import LoginCard, { useAuth } from "./components/LoginCard";

// Lazy load pages for code splitting
const Home = lazy(() => import("./pages/Home"));
const Promotions = lazy(() => import("./pages/Promotions"));
const Recommendations = lazy(() => import("./pages/Recommendations"));
const MemberPage = lazy(() => import("./pages/Member"));
const CreditCards = lazy(() => import("./pages/CreditCardNew"));
const SearchResults = lazy(() => import("./pages/SearchResults"));
const ReturnFlights = lazy(() => import("./pages/ReturnFlights"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Confirmation = lazy(() => import("./pages/Confirmation"));
const StayDetail = lazy(() => import("./pages/StayDetail"));
const DestinationType = lazy(() => import("./pages/DestinationType"));
const AgentAssist = lazy(() => import("./pages/AgentAssist"));
const Wallet = lazy(() => import("./pages/Wallet"));

// Loading fallback component
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

// --- Protect routes ---
// --- Protect routes ---
function RequireAuth({ children }: { children: ReactNode }) {
  const { state } = useAuth();
  const location = useLocation() as any;

  if (state.status !== "authenticated") {
    const payload = {
      from: { pathname: location.pathname, search: location.search || "" },
      ctx: location.state?.ctx ?? null,
    };
    sessionStorage.setItem("postLogin", JSON.stringify(payload));
    return <Navigate to="/login" replace state={payload} />;
  }
  return <>{children}</>;
}

// --- Login page (redirects after success) ---
function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation() as any;

  const stored =
    (location.state as any) ||
    JSON.parse(sessionStorage.getItem("postLogin") || "null");

  const targetPath = stored?.from?.pathname ?? "/member";
  const targetSearch = stored?.from?.search ?? "";
  const ctx = stored?.ctx ?? null;

  return (
    <div style={{ padding: 24 }}>
      <LoginCard
        onSuccess={() => {
          sessionStorage.removeItem("postLogin");
          navigate(`${targetPath}${targetSearch}`, {
            replace: true,
            state: ctx ? { ctx } : undefined,
          });
        }}
      />
      <p style={{ marginTop: 12 }}>
        <Link to="/">← Back to home</Link>
      </p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <DataCloudProvider tenantId="6b13de41-2e5c-4e5d-bd23-fa67b0bf66a4">
        <Header />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Home />} />
            <Route path="/destination-type" element={<DestinationType />} />
            <Route path="/promotions" element={<Promotions />} />
            <Route path="/recommendations" element={<Recommendations />} />
            <Route path="/credit-cards" element={<CreditCards />} />
            <Route path="/agent" element={<AgentAssist />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/return-flights" element={<ReturnFlights />} />
            <Route path="/stay/:id" element={<StayDetail />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Protected */}
            <Route
              path="/member"
              element={
                <RequireAuth>
                  <MemberPage />
                </RequireAuth>
              }
            />
            <Route
              path="/wallet"
              element={
                <RequireAuth>
                  <Wallet />
                </RequireAuth>
              }
            />
            <Route
              path="/checkout"
              element={
                <RequireAuth>
                  <Checkout />
                </RequireAuth>
              }
            />
            <Route
              path="/confirmation"
              element={
                <RequireAuth>
                  <Confirmation />
                </RequireAuth>
              }
            />

            {/* keep this LAST */}
            <Route
              path="*"
              element={<div style={{ padding: 24 }}>Route not found: {window.location.pathname}</div>}
            />
          </Routes>
        </Suspense>
        <Footer />
      </DataCloudProvider>
    </BrowserRouter>
  );
}
