import { BrowserRouter, Route, Routes } from "react-router";

import { HealthProvider } from "../features/health/use-health";
import { HistoryProvider } from "../features/history/history-context";
import { ThemeProvider } from "../features/theme/theme";
import { DashboardPage } from "../pages/dashboard-page";
import { EmailScannerPage } from "../pages/email-scanner-page";
import { HistoryPage } from "../pages/history-page";
import { NotFoundPage } from "../pages/not-found-page";
import { ResultsPage } from "../pages/results-page";
import { UrlScannerPage } from "../pages/url-scanner-page";
import { AppLayout } from "./layout";

export function App() {
  return (
    <ThemeProvider>
      <HealthProvider>
        <HistoryProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<AppLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="scan/url" element={<UrlScannerPage />} />
                <Route path="scan/email" element={<EmailScannerPage />} />
                <Route path="results" element={<ResultsPage />} />
                <Route path="results/:id" element={<ResultsPage />} />
                <Route path="history" element={<HistoryPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </HistoryProvider>
      </HealthProvider>
    </ThemeProvider>
  );
}
