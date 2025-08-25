import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout/Layout';
import { HomePage } from './pages/HomePage';
import { AddTextPage } from './pages/AddTextPage';
import { PracticePage } from './pages/PracticePage';
import { ResultsPage } from './pages/ResultsPage';
import { storageService } from './services/storageService';

function App() {
  useEffect(() => {
    // Initialize storage service
    storageService.initialize().catch(console.error);
  }, []);

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/add-text" element={<AddTextPage />} />
          <Route path="/practice/:textId" element={<PracticePage />} />
          <Route path="/results/:sessionId" element={<ResultsPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;