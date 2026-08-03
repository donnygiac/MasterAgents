/**
 * Routing (esempio react-router): UNA rotta pubblica (/login), tutto il resto
 * avvolto nel guard. Integra nel router esistente del progetto: non creare un
 * secondo BrowserRouter se ce n'è già uno.
 */
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthGuard from './auth-guard';
import LoginPage from './login-page';
// import Layout from '...';        // layout autenticato del progetto
// import HomePage from '...';

const App: React.FC = () => (
    <BrowserRouter>
        <Routes>
            <Route path="/login" element={<LoginPage />} />

            {/* Tutto il resto è protetto: il guard reindirizza a /login */}
            <Route
                path="/"
                element={
                    <AuthGuard>
                        {/* <Layout /> con <Outlet /> per le pagine figlie */}
                        <div>App autenticata</div>
                    </AuthGuard>
                }
            >
                {/* <Route index element={<HomePage />} /> */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
        </Routes>
    </BrowserRouter>
);

export default App;
