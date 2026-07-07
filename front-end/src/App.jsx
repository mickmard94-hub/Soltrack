import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import RouteProtegee from './components/RouteProtegee';
import Header from './components/Header';
import Footer from './components/Footer';
import Accueil from './pages/Accueil';
import Inscription from './pages/Inscription';
import Connexion from './pages/Connexion';
import ListeSols from './pages/ListeSols';
import CreerSol from './pages/CreerSol';
import ModifierSol from './pages/ModifierSol';
import DetailSol from './pages/DetailSol';
import AjouterMembre from './pages/AjouterMembre';
import ListeMembres from './pages/ListeMembres';
import ModifierMembre from './pages/ModifierMembre';
import EnregistrerCotisation from './pages/EnregistrerCotisation';
import CotisationsManquantes from './pages/CotisationsManquantes';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Header />
        <div className="container my-4">
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
          </Routes>
        </div>
        <Footer />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;