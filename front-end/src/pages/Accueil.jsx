import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Accueil() {
  const { user } = useAuth();

  if (user) {
    return (
      <div className="py-4">
        <span className="hero-eyebrow">Bon retour</span>
        <h1 className="mt-2">{user.name}</h1>
        <p className="text-muted mb-4" style={{ maxWidth: '32rem' }}>
          Retrouvez vos sols et continuez à suivre vos cotisations en toute simplicité.
        </p>
        <Link to="/sols" className="btn-sol d-inline-block">
          Voir mes sols
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center py-5">
        <span className="hero-eyebrow">Gestion de sols &middot; tontines communautaires</span>
        <h1 className="display-5 mt-2">SolTrack</h1>
        <p className="lead text-muted mb-4 mx-auto" style={{ maxWidth: '34rem' }}>
          La gestion numérique des sols, simple, claire et sans conflit entre membres.
        </p>
        <div className="d-flex justify-content-center gap-3 flex-wrap">
          <Link to="/inscription" className="btn-sol d-inline-block">
            Créer mon compte
          </Link>
          <Link to="/connexion" className="btn btn-outline-secondary">
            J'ai déjà un compte
          </Link>
        </div>
      </div>

      <div className="row my-5">
        <div className="col-12 mb-4">
          <h2 className="text-center">Pourquoi SolTrack ?</h2>
        </div>
        <div className="col-md-4 mb-3">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">Un problème bien réel</h5>
              <p className="card-text">
                Cahier papier, groupes WhatsApp, mémoire du responsable : le suivi
                manuel des sols entraîne des erreurs de calcul, des oublis de
                cotisation et parfois des conflits entre membres.
              </p>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-3">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">Une vision claire</h5>
              <p className="card-text">
                SolTrack vous montre immédiatement qui a cotisé, qui doit
                recevoir la prochaine cagnotte, et à quelle date précise.
              </p>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-3">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">Fait pour le mobile</h5>
              <p className="card-text">
                Interface simple et rapide, pensée pour un usage quotidien
                depuis un téléphone, là où l'accès à internet se fait
                majoritairement via mobile.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Étapes réellement séquentielles : c'est le parcours dans l'ordre où
          on utilise l'application, la numérotation encode donc une vraie info. */}
      <div className="row my-5">
        <div className="col-12 mb-4">
          <h2 className="text-center">Ce que vous pouvez faire</h2>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card h-100">
            <div className="card-body">
              <span className="etape-numero">01</span>
              <h6 className="card-title mt-2">Créer un sol</h6>
              <p className="card-text small">
                Nom, montant, fréquence et nombre de tours en quelques secondes.
              </p>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card h-100">
            <div className="card-body">
              <span className="etape-numero">02</span>
              <h6 className="card-title mt-2">Ajouter des membres</h6>
              <p className="card-text small">
                Gérez qui participe et dans quel ordre chacun reçoit la cagnotte.
              </p>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card h-100">
            <div className="card-body">
              <span className="etape-numero">03</span>
              <h6 className="card-title mt-2">Suivre les cotisations</h6>
              <p className="card-text small">
                Enregistrez chaque paiement et repérez les retards en un coup d'œil.
              </p>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card h-100">
            <div className="card-body">
              <span className="etape-numero">04</span>
              <h6 className="card-title mt-2">Consulter le tableau de bord</h6>
              <p className="card-text small">
                Total collecté, prochain bénéficiaire, cotisations en attente.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center py-4">
        <h4>Prêt à simplifier la gestion de vos sols ?</h4>
        <Link to="/inscription" className="btn-dore d-inline-block mt-2">
          Créer mon compte gratuitement
        </Link>
      </div>
    </div>
  );
}

export default Accueil;
