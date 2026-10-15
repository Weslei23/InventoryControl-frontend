import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Categories from "./pages/Categories";
import Suppliers from "./pages/Suppliers";
import Movements from "./pages/Movements";
import Users from "./pages/Users";
import RequirePermission from "./components/RequirePermission";

// swagger-ui-react is a large dependency (~1.6MB) only needed on this one page, so it's split
// into its own chunk and fetched on demand instead of bloating every route's initial bundle.
const ApiDocs = lazy(() => import("./pages/ApiDocs"));

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Dashboard />} />
              <Route
                path="/products"
                element={
                  <RequirePermission any={["PRODUCT_READ"]}>
                    <Products />
                  </RequirePermission>
                }
              />
              <Route
                path="/categories"
                element={
                  <RequirePermission any={["CATEGORY_READ"]}>
                    <Categories />
                  </RequirePermission>
                }
              />
              <Route
                path="/suppliers"
                element={
                  <RequirePermission any={["SUPPLIER_READ"]}>
                    <Suppliers />
                  </RequirePermission>
                }
              />
              <Route
                path="/movements"
                element={
                  <RequirePermission any={["MOVEMENT_READ"]}>
                    <Movements />
                  </RequirePermission>
                }
              />
              <Route
                path="/users"
                element={
                  <RequirePermission any={["USER_READ"]}>
                    <Users />
                  </RequirePermission>
                }
              />
              <Route
                path="/api-docs"
                element={
                  <Suspense fallback={<div className="empty-state">Carregando documentação...</div>}>
                    <ApiDocs />
                  </Suspense>
                }
              />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
