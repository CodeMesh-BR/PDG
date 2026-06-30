import "@/css/satoshi.css";
import "@/css/style.css";
import "flatpickr/dist/flatpickr.min.css";
import "jsvectormap/dist/jsvectormap.css";

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Providers } from "@/app/providers";
import ClientLayout from "@/app/ClientLayout";
import ProtectedLayout from "@/app/(protected)/layout";
import DashboardPage from "@/app/(protected)/(home)/page";
import CompaniesPage from "@/app/(protected)/companies/page";
import EditCompanyPage from "@/app/(protected)/companies/[id]/edit/page";
import DepartmentsPage from "@/app/(protected)/departments/page";
import EmployeesPage from "@/app/(protected)/employees/page";
import EditEmployeePage from "@/app/(protected)/employees/[id]/edit/page";
import ProfilePage from "@/app/(protected)/profile/page";
import ServicesCatalogPage from "@/app/(protected)/services-catalog/page";
import EditServicesCatalogPage from "@/app/(protected)/services-catalog/[id]/edit/page";
import ServicesReportPage from "@/app/(protected)/services-report/page";
import StartServicePage from "@/app/(protected)/start-service/page";
import EditStartServicePage from "@/app/(protected)/start-service/[id]/edit/page";
import ForgotPasswordPage from "@/app/auth/forgot-password/page";
import SignInPage from "@/app/auth/sign-in/page";
import UnauthorizedPage from "@/app/unauthorized/page";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter basename="/PDG-DOM">
      <Providers>
        <ClientLayout>
          <Routes>
            <Route path="/auth/sign-in" element={<SignInPage />} />
            <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route element={<ProtectedLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="/companies" element={<CompaniesPage />} />
              <Route path="/companies/:id/edit" element={<EditCompanyPage />} />
              <Route path="/departments" element={<DepartmentsPage />} />
              <Route path="/employees" element={<EmployeesPage />} />
              <Route path="/employees/:id/edit" element={<EditEmployeePage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/services-catalog" element={<ServicesCatalogPage />} />
              <Route
                path="/services-catalog/:id/edit"
                element={<EditServicesCatalogPage />}
              />
              <Route path="/services-report" element={<ServicesReportPage />} />
              <Route path="/start-service" element={<StartServicePage />} />
              <Route path="/start-service/:id/edit" element={<EditStartServicePage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ClientLayout>
      </Providers>
    </BrowserRouter>
  </React.StrictMode>,
);
