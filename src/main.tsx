import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/app/App';
import '@/styles/tokens.css';

const rootElement = document.getElementById('root');

if (rootElement === null) {
  throw new Error('Root element with id "root" was not found in index.html');
}

// Optional visit counter. `VITE_CF_ANALYTICS_TOKEN` is replaced at build time, so
// without a token this condition is statically false and the whole module (and
// the beacon URL inside it) is removed from the bundle.
if (import.meta.env.PROD && import.meta.env.VITE_CF_ANALYTICS_TOKEN) {
  void import('@/shared/lib/analytics').then(({ startAnalytics }) => {
    startAnalytics(import.meta.env.VITE_CF_ANALYTICS_TOKEN);
  });
}

// Statically false outside Vite's dedicated E2E mode, so Rollup removes both
// this route marker and the dynamically imported browser-test harness from
// normal web/native production bundles.
if (import.meta.env.MODE === 'e2e' && window.location.pathname === '/__e2e_manual_guide_raster__') {
  void import('@/features/scanner/components/ManualGuideBatchRasterHarness').then(({ ManualGuideBatchRasterHarness }) => {
    createRoot(rootElement).render(<ManualGuideBatchRasterHarness />);
  });
} else {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
