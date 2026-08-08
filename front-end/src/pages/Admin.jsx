import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import api from '../services/api';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('fr-FR');
}

function Admin() {
  const { user, updateUser } = useAuth();
  const { t } = useLang();

  const [secret, setSecret] = useState('');
  const [promotionErreur, setPromotionErreur] = useState(null);
  const [promotionEnvoi, setPromotionEnvoi] = useState(false);

  const [utilisateurs, setUtilisateurs] = useState([]);
  const [avis, setAvis] = useState([]);
  const [chargement, setChargement] = useState(false);
  const [erreurChargement, setErreurChargement] = useState(null);

  const chargerDonnees = () => {
    setChargement(true);
    setErreurChargement(null);
    Promise.all([
      api.get('/admin/utilisateurs'),
      api.get('/admin/avis'),
    ])
      .then(([reponseUsers, reponseAvis]) => {
        setUtilisateurs(reponseUsers.data);
        setAvis(reponseAvis.data);
        setChargement(false);
      })
      .catch((error) => {
        setChargement(false);
        if (error.response?.status === 403) {
          setErreurChargement('Accès réservé aux administrateurs.');
        } else {
          console.error('Erreur admin :', error);
        }
      });
  };

  useEffect(() => {
    if (user?.is_admin) {
      chargerDonnees();
    }
  }, [user]);

  const handlePromouvoir = (e) => {
    e.preventDefault();
    setPromotionErreur(null);
    setPromotionEnvoi(true);

    api.post('/admin/promouvoir', { secret })
      .then(() => {
        updateUser({ ...user, is_admin: true });
        setPromotionEnvoi(false);
      })
      .catch((error) => {
        setPromotionEnvoi(false);
        setPromotionErreur(
          error.response?.data?.message || 'Secret invalide.'
        );
      });
  };

  if (!user?.is_admin) {
    return (
      <div className="row justify-content-center py-2">
        <div className="col-md-6">
          <Link to="/sols" className="btn btn-sm btn-outline-secondary mb-3">
            ← {t('common.retour')}
          </Link>
          <h1 className="mb-4">Administration</h1>
          <div className="card">
            <div className="card-body">
              <p className="text-muted mb-3">
                Ce compte n'est pas encore administrateur. Entrez le code secret pour l'activer.
              </p>
              <form onSubmit={handlePromouvoir}>
                <input
                  type="password"
                  className="form-control mb-2"
                  placeholder="Code secret"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                />
                {promotionErreur && <div className="text-danger small mb-2">{promotionErreur}</div>}
                <button type="submit" className="btn-sol border-0" disabled={promotionEnvoi || !secret}>
                  {promotionEnvoi ? t('common.chargement') : 'Activer'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link to="/sols" className="btn btn-sm btn-outline-secondary mb-3">
        ← {t('common.retour')}
      </Link>
      <h1 className="mb-4">Administration</h1>

      {erreurChargement && <div className="alert alert-danger">{erreurChargement}</div>}
      {chargement && <p>{t('common.chargement')}</p>}

      <h5 className="mb-2">Utilisateurs ({utilisateurs.length})</h5>
      <div className="table-responsive-wrapper mb-4">
        <table className="table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Email</th>
              <th>Sols créés</th>
              <th>Inscrit le</th>
            </tr>
          </thead>
          <tbody>
            {utilisateurs.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td className="chiffre">{u.sols_count}</td>
                <td>{formatDate(u.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h5 className="mb-2">Avis reçus ({avis.length})</h5>
      <div className="d-flex flex-column gap-2">
        {avis.map((a) => (
          <div className="card" key={a.id}>
            <div className="card-body py-3">
              <div className="d-flex flex-wrap gap-3 small">
                <span>Aimé : <strong>{a.aime === null ? '—' : a.aime ? 'Oui' : 'Non'}</strong></span>
                <span>Recommande : <strong>{a.recommande === null ? '—' : a.recommande ? 'Oui' : 'Non'}</strong></span>
                <span>Meilleures pages : <strong>{(a.meilleures_pages || []).join(', ') || '—'}</strong></span>
                <span>À améliorer : <strong>{(a.pages_a_ameliorer || []).join(', ') || '—'}</strong></span>
              </div>
              <div className="text-muted small mt-1">
                {a.user ? `${a.user.name} (${a.user.email})` : 'Anonyme'} &middot; {formatDate(a.created_at)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Admin;