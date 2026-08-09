import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import api from '../services/api';

const PHRASE_CONFIRMATION = 'SUPPRIMER TOUT';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('fr-FR');
}

// Déclenche le téléchargement d'un fichier reçu en blob depuis l'API,
// sans jamais afficher son contenu dans le navigateur.
function telechargerBlob(blob, nomParDefaut) {
  const url = window.URL.createObjectURL(blob);
  const lien = document.createElement('a');
  lien.href = url;
  lien.download = nomParDefaut;
  document.body.appendChild(lien);
  lien.click();
  lien.remove();
  window.URL.revokeObjectURL(url);
}

function Admin() {
  const { user, updateUser, logout } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();

  const [secret, setSecret] = useState('');
  const [promotionErreur, setPromotionErreur] = useState(null);
  const [promotionEnvoi, setPromotionEnvoi] = useState(false);

  const [utilisateurs, setUtilisateurs] = useState([]);
  const [pageUtilisateurs, setPageUtilisateurs] = useState(1);
  const [dernierePageUtilisateurs, setDernierePageUtilisateurs] = useState(1);
  const [totalUtilisateurs, setTotalUtilisateurs] = useState(0);

  const [avis, setAvis] = useState([]);
  const [pageAvis, setPageAvis] = useState(1);
  const [dernierePageAvis, setDernierePageAvis] = useState(1);
  const [totalAvis, setTotalAvis] = useState(0);

  const [chargement, setChargement] = useState(false);
  const [erreurChargement, setErreurChargement] = useState(null);

  const [exportEnCours, setExportEnCours] = useState(null);

  const [zoneReinitOuverte, setZoneReinitOuverte] = useState(false);
  const [confirmationSaisie, setConfirmationSaisie] = useState('');
  const [reinitEnvoi, setReinitEnvoi] = useState(false);
  const [reinitErreur, setReinitErreur] = useState(null);

  const chargerUtilisateurs = (page) => {
    api.get(`/admin/utilisateurs?page=${page}`)
      .then((response) => {
        setUtilisateurs(response.data.data);
        setPageUtilisateurs(response.data.current_page);
        setDernierePageUtilisateurs(response.data.last_page);
        setTotalUtilisateurs(response.data.total);
      })
      .catch((error) => {
        if (error.response?.status === 403) {
          setErreurChargement('Accès réservé aux administrateurs.');
        } else {
          console.error('Erreur admin :', error);
        }
      });
  };

  const chargerAvis = (page) => {
    api.get(`/admin/avis?page=${page}`)
      .then((response) => {
        setAvis(response.data.data);
        setPageAvis(response.data.current_page);
        setDernierePageAvis(response.data.last_page);
        setTotalAvis(response.data.total);
      })
      .catch((error) => {
        if (error.response?.status === 403) {
          setErreurChargement('Accès réservé aux administrateurs.');
        } else {
          console.error('Erreur admin :', error);
        }
      });
  };

  const chargerTout = () => {
    setChargement(true);
    setErreurChargement(null);
    Promise.all([
      api.get('/admin/utilisateurs?page=1'),
      api.get('/admin/avis?page=1'),
    ])
      .then(([reponseUsers, reponseAvis]) => {
        setUtilisateurs(reponseUsers.data.data);
        setPageUtilisateurs(reponseUsers.data.current_page);
        setDernierePageUtilisateurs(reponseUsers.data.last_page);
        setTotalUtilisateurs(reponseUsers.data.total);

        setAvis(reponseAvis.data.data);
        setPageAvis(reponseAvis.data.current_page);
        setDernierePageAvis(reponseAvis.data.last_page);
        setTotalAvis(reponseAvis.data.total);

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
      chargerTout();
    }
  }, [user]);

  const handlePromouvoir = (e) => {
    e.preventDefault();
    setPromotionErreur(null);
    setPromotionEnvoi(true);

    api.post('/admin/promouvoir', { secret })
      .then((response) => {
        updateUser(response.data.user);
        setPromotionEnvoi(false);
      })
      .catch((error) => {
        setPromotionEnvoi(false);
        setPromotionErreur(
          error.response?.data?.message || 'Secret invalide.'
        );
      });
  };

  const exporterCsv = (type) => {
    setExportEnCours(type);
    const chemin = type === 'utilisateurs' ? '/admin/utilisateurs/export' : '/admin/avis/export';

    api.get(chemin, { responseType: 'blob' })
      .then((response) => {
        const nom = type === 'utilisateurs' ? 'utilisateurs.csv' : 'avis.csv';
        telechargerBlob(response.data, nom);
        setExportEnCours(null);
      })
      .catch((error) => {
        console.error('Erreur export CSV :', error);
        setExportEnCours(null);
      });
  };

  const handleReinitialiser = () => {
    setReinitErreur(null);
    setReinitEnvoi(true);

    api.delete('/admin/reinitialiser', { data: { confirmation: confirmationSaisie } })
      .then(() => {
        logout();
        navigate('/');
      })
      .catch((error) => {
        setReinitEnvoi(false);
        setReinitErreur(
          error.response?.data?.message || 'Erreur lors de la réinitialisation.'
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

      {/* Utilisateurs */}
      <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
        <h5 className="mb-0">Utilisateurs ({totalUtilisateurs})</h5>
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={() => exporterCsv('utilisateurs')}
          disabled={exportEnCours === 'utilisateurs' || totalUtilisateurs === 0}
        >
          {exportEnCours === 'utilisateurs' ? 'Export en cours...' : '⬇ Exporter en CSV (Excel)'}
        </button>
      </div>

      <div className="table-responsive-wrapper mb-2">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nom</th>
              <th>Email</th>
              <th>Sols créés</th>
              <th>Inscrit le</th>
            </tr>
          </thead>
          <tbody>
            {utilisateurs.map((u) => (
              <tr key={u.id}>
                <td className="chiffre">{u.id}</td>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td className="chiffre">{u.sols_count}</td>
                <td>{formatDate(u.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {dernierePageUtilisateurs > 1 && (
        <nav className="d-flex justify-content-center gap-2 mb-4">
          <button
            className="btn btn-sm btn-outline-secondary"
            disabled={pageUtilisateurs === 1}
            onClick={() => chargerUtilisateurs(pageUtilisateurs - 1)}
          >
            Précédent
          </button>
          <span className="align-self-center small">
            Page {pageUtilisateurs} sur {dernierePageUtilisateurs}
          </span>
          <button
            className="btn btn-sm btn-outline-secondary"
            disabled={pageUtilisateurs === dernierePageUtilisateurs}
            onClick={() => chargerUtilisateurs(pageUtilisateurs + 1)}
          >
            Suivant
          </button>
        </nav>
      )}

      {/* Avis */}
      <div className="d-flex justify-content-between align-items-center mb-2 mt-4 flex-wrap gap-2">
        <h5 className="mb-0">Avis reçus ({totalAvis})</h5>
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={() => exporterCsv('avis')}
          disabled={exportEnCours === 'avis' || totalAvis === 0}
        >
          {exportEnCours === 'avis' ? 'Export en cours...' : '⬇ Exporter en CSV (Excel)'}
        </button>
      </div>

      <div className="table-responsive-wrapper mb-2">
        <table className="table">
          <thead>
            <tr>
              <th>Aimé</th>
              <th>Recommande</th>
              <th>Meilleures pages</th>
              <th>À améliorer</th>
              <th>Utilisateur</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {avis.map((a) => (
              <tr key={a.id}>
                <td>{a.aime === null ? '—' : a.aime ? 'Oui' : 'Non'}</td>
                <td>{a.recommande === null ? '—' : a.recommande ? 'Oui' : 'Non'}</td>
                <td className="small">{(a.meilleures_pages || []).join(', ') || '—'}</td>
                <td className="small">{(a.pages_a_ameliorer || []).join(', ') || '—'}</td>
                <td className="small">{a.user ? `${a.user.name}` : 'Anonyme'}</td>
                <td className="small">{formatDate(a.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {dernierePageAvis > 1 && (
        <nav className="d-flex justify-content-center gap-2 mb-5">
          <button
            className="btn btn-sm btn-outline-secondary"
            disabled={pageAvis === 1}
            onClick={() => chargerAvis(pageAvis - 1)}
          >
            Précédent
          </button>
          <span className="align-self-center small">
            Page {pageAvis} sur {dernierePageAvis}
          </span>
          <button
            className="btn btn-sm btn-outline-secondary"
            disabled={pageAvis === dernierePageAvis}
            onClick={() => chargerAvis(pageAvis + 1)}
          >
            Suivant
          </button>
        </nav>
      )}

      {/* Zone très sensible */}
      <div className="card border-danger">
        <div className="card-body">
          <h5 className="card-title text-danger mb-2">Zone très sensible</h5>
          <p className="text-muted small mb-3">
            Supprime définitivement TOUTES les données (utilisateurs, sols, membres, cotisations, avis).
            Cette action est irréversible et vous déconnectera aussi, puisque votre propre compte sera supprimé.
          </p>

          {!zoneReinitOuverte ? (
            <button
              type="button"
              className="btn btn-outline-danger"
              onClick={() => setZoneReinitOuverte(true)}
            >
              Réinitialiser toute la base de données
            </button>
          ) : (
            <div>
              <label className="form-label small">
                Tapez exactement <strong>{PHRASE_CONFIRMATION}</strong> pour confirmer
              </label>
              <input
                type="text"
                className="form-control mb-2"
                value={confirmationSaisie}
                onChange={(e) => setConfirmationSaisie(e.target.value)}
                placeholder={PHRASE_CONFIRMATION}
              />
              {reinitErreur && <div className="text-danger small mb-2">{reinitErreur}</div>}
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-outline-danger"
                  onClick={handleReinitialiser}
                  disabled={reinitEnvoi || confirmationSaisie !== PHRASE_CONFIRMATION}
                >
                  {reinitEnvoi ? t('common.chargement') : 'Confirmer la suppression totale'}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => { setZoneReinitOuverte(false); setConfirmationSaisie(''); setReinitErreur(null); }}
                >
                  {t('common.annuler')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Admin;