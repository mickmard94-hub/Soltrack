import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import RouteProtegee from './components/RouteProtegee';
import Header from './components/Header';
import Footer from './components/Footer';

const Accueil = lazy(() => import('./pages/Accueil'));
const Inscription = lazy(() => import('./pages/Inscription'));
const Connexion = lazy(() => import('./pages/Connexion'));
const ListeSols = lazy(() => import('./pages/ListeSols'));
const CreerSol = lazy(() => import('./pages/CreerSol'));
const ModifierSol = lazy(() => import('./pages/ModifierSol'));
const DetailSol = lazy(() => import('./pages/DetailSol'));
const AjouterMembre = lazy(() => import('./pages/AjouterMembre'));
const ListeMembres = lazy(() => import('./pages/ListeMembres'));
const ModifierMembre = lazy(() => import('./pages/ModifierMembre'));
const EnregistrerCotisation = lazy(() => import('./pages/EnregistrerCotisation'));
const CotisationsManquantes = lazy(() => import('./pages/CotisationsManquantes'));
const CotisationsParTour = lazy(() => import('./pages/CotisationsParTour'));

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Header />
        <div className="container my-4">
          <Suspense fallback={<p>Chargement...</p>}>
            <Routes>
              <Route path="/" element={<Accueil />} />
              <Route path="/inscription" element={<Inscription />} />
              <Route path="/connexion" element={<Connexion />} />

              <Route path="/sols" element={<RouteProtegee><ListeSols /></RouteProtegee>} />
              <Route path="/sols/creer" element={<RouteProtegee><CreerSol /></RouteProtegee>} />
              <Route path="/sols/:id" element={<RouteProtegee><DetailSol /></RouteProtegee>} />
              <Route path="/sols/:id/modifier" element={<RouteProtegee><ModifierSol /></RouteProtegee>} />
              <Route path="/sols/:id/membres" element={<RouteProtegee><ListeMembres /></RouteProtegee>} />
              <Route path="/sols/:id/membres/ajouter" element={<RouteProtegee><AjouterMembre /></RouteProtegee>} />
              <Route path="/sols/:id/membres/:membreId/modifier" element={<RouteProtegee><ModifierMembre /></RouteProtegee>} />
              <Route path="/sols/:id/cotisations/ajouter" element={<RouteProtegee><EnregistrerCotisation /></RouteProtegee>} />
              <Route path="/sols/:id/cotisations" element={<RouteProtegee><CotisationsManquantes /></RouteProtegee>} />
              <Route path="/sols/:id/cotisations/par-tour" element={<RouteProtegee><CotisationsParTour /></RouteProtegee>} />
            </Routes>
          </Suspense>
        </div>
        <Footer />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
