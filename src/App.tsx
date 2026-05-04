import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './lib/firebase';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import IncidentDetailsPage from './pages/IncidentDetailsPage';
import IntegrationsPage from './pages/IntegrationsPage';
import SettingsPage from './pages/SettingsPage';
import SimulatorPage from './pages/SimulatorPage';
import DocsPage from './pages/DocsPage';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-soc-bg flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-t-indigo-500 border-slate-800 rounded-full animate-spin"></div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold">SentraAI - Calibrating SOC Matrix...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-soc-bg text-slate-200">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/app/dashboard" />} />
          
          <Route path="/app/*" element={user ? (
            <div className="flex h-screen overflow-hidden">
              <Sidebar />
              <div className="flex-1 flex flex-col min-w-0 bg-soc-bg">
                <TopBar />
                <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                  <Routes>
                    <Route path="dashboard" element={<DashboardPage />} />
                    <Route path="incidents/:id" element={<IncidentDetailsPage />} />
                    <Route path="integrations" element={<IntegrationsPage />} />
                    <Route path="simulator" element={<SimulatorPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                  </Routes>
                </main>
              </div>
            </div>
          ) : <Navigate to="/login" />} />
          
          <Route path="/docs" element={<DocsPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
