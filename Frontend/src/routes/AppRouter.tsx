import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import App from '../App';
import AdminRouter from '../admin/routes/AdminRouter';

const AppRouter: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Admin routes */}
        <Route path="/admin/*" element={<AdminRouter />} />
        
        {/* Main app routes */}
        <Route path="/*" element={<App />} />
        
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/landing" replace />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;
