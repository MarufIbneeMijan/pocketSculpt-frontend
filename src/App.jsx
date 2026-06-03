import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthGate } from './components/AuthGate';
import { HomeHub } from './pages/HomeHub';
import { CreateProject } from './pages/CreateProject';
import { TourEditor } from './components/TourEditor';
import { TourPreview } from './components/TourPreview';

export default function App() {
    // 🚀 INITIAL STATE RESOLUTION: Check local storage on compile before defaulting to false
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        const cachedToken = localStorage.getItem('pocketsculpt_session_token');
        return cachedToken === 'active_authenticated_operator';
    });

    // Handle initial authentication commit pipelines
    const handleLoginSuccess = () => {
        localStorage.setItem('pocketsculpt_session_token', 'active_authenticated_operator');
        setIsAuthenticated(true);
    };

    // Standard platform signout control routine (You can pass this to your sidebar hub down the road!)
    const handleLogoutAction = () => {
        localStorage.removeItem('pocketsculpt_session_token');
        setIsAuthenticated(false);
    };

    return (
        <Router>
            <Routes>
                {/* Secure Login Landing Gate */}
                <Route path="/login" element={
                    !isAuthenticated ? <AuthGate onLogin={handleLoginSuccess} /> : <Navigate to="/" />
                } />

                {/* Authenticated Dashboard Pipeline Layout Core Maps */}
                <Route path="/" element={isAuthenticated ? <HomeHub onLogout={handleLogoutAction} /> : <Navigate to="/login" />} />
                <Route path="/create-project" element={isAuthenticated ? <CreateProject /> : <Navigate to="/login" />} />
                <Route path="/editor/:id" element={isAuthenticated ? <TourEditor /> : <Navigate to="/login" />} />
                <Route path="/tour/:id" element={<TourPreview />} />
                
                {/* Fallback Core Catch Redirect */}
                <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} />} />
            </Routes>
        </Router>
    );
}