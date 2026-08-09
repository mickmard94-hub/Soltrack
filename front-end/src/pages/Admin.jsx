import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import api from '../services/api';

const PHRASE_CONFIRMATION = 'SUPPRIMER TOUT';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function formatDateHeure(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('fr-FR');
}

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

function BarreProgression({ label, valeur }) {
  return (
    <div className="barre-progression-ligne">
      <div className="barre-progression-entete">
        <span className="small">{label}</span>
        <span className="chiffre small">{valeur}%</span>
      </div>
      <div className="barre-progression-piste">
        <div className="barre-progression-remplissage" style={{ width: `${valeur}%` }}></div>
      </div>
    </div>
  );
}

function Admin() {
  const { user, updateUser, logout } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();

  const [secret, setSecret] = useState('');
  const [promotionErreur, setPromotionErreur] = useState(null);
  const [promotionEnvoi, setPromotionEnvoi] = useState(false);

  const [stats, setStats] = useState(null);
  const [recentsUtilisateurs, setRecentsUtilisateurs] = useState([]);
  const [recentsAvis, setRecentsAvis] = useState([]);
  const [chargement, setChargement] = useState(false);
  const [erreurChargement, setErreurChargement] = useState(null);
  const [exportEnCours, setExportEnCours] = useState(null);

  const [zoneReinitOuverte, setZoneReinitOuverte] = useState(false);
  const [confirmationSaisie, setConfirmationSaisie] = useState('');
  const [reinitEnvoi, setReinitEnvoi] = useState(false);
  const [reinitErreur, setReinitErreur] = useState(null);

  const chargerTout = () => {
    setChargement(true);
    setErreurChargement(null);
    Promise.all([
      api.get('/admin/statistiques'),
      api.get('/admin/utilisateurs/recents'),
      api.get('/admin/avis/recents'),
    ])
      .then(([reponseStats, reponseUsers, reponseAvis]) => {
        setStats(reponseStats.data);
        setRecentsUtilisateurs(reponseUsers.data);
        setRecentsAvis(reponseAvis.data);
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
          <br />
          <span className="hero-eyebrow">Administration</span>
          <h1 className="mt-1 mb-4">Accès administrateur</h1>
          <div className="card">
            <div className="card-body p-4">
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

  if (chargement || !stats) {
    return (
      <div>
        <Link to="/sols" className="btn btn-sm btn-outline-secondary mb-3">
          ← {t('common.retour')}
        </Link>
        <p>{t('common.chargement')}</p>
      </div>
    );
  }

  return (
    <div>
      <Link to="/sols" className="btn btn-sm btn-outline-secondary mb-3">
        ← {t('common.retour')}
      </Link>

      <span className="hero-eyebrow">Administration</span>
      <h1 className="mt-1 mb-4">Vue d'ensemble</h1>

      {erreurChargement && <div className="alert alert-danger">{erreurChargement}</div>}

      <div className="admin-stat-grille mb-4">
        <div className="admin-stat-cellule">
          <div className="admin-stat-label">Utilisateurs</div>
          <div className="admin-stat-valeur">{stats.nombre_utilisateurs}</div>
        </div>
        <div className="admin-stat-cellule">
          <div className="admin-stat-label">Sols créés</div>
          <div className="admin-stat-valeur">{stats.nombre_sols}</div>
        </div>
        <div className="admin-stat-cellule">
          <div className="admin-stat-label">Avis reçus</div>
          <div className="admin-stat-valeur">{stats.nombre_avis}</div>
        </div>
        <div className="admin-stat-cellule">
          <div className="admin-stat-label">Premier inscrit</div>
          <div className="admin-stat-valeur" style={{ fontSize: '1.1rem' }}>{formatDate(stats.premiere_inscription)}</div>
        </div>
        <div className="admin-stat-cellule">
          <div className="admin-stat-label">Dernier inscrit</div>
          <div className="admin-stat-valeur" style={{ fontSize: '1.1rem' }}>{formatDate(stats.derniere_inscription)}</div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-body p-4">
          <h6 className="card-title mb-3">Taux de réponse par question</h6>
          <BarreProgression label="A aimé son expérience" valeur={stats.taux_reponse.aime} />
          <BarreProgression label="Meilleures pages désignées" valeur={stats.taux_reponse.meilleures_pages} />
          <BarreProgression label="Pages à améliorer désignées" valeur={stats.taux_reponse.pages_a_ameliorer} />
          <BarreProgression label="Recommanderait Sòl Ansanm" valeur={stats.taux_reponse.recommande} />
        </div>
      </div>

      <div className="admin-section-entete">
        <h6 className="mb-0">Derniers utilisateurs inscrits</h6>
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={() => exporterCsv('utilisateurs')}
          disabled={exportEnCours === 'utilisateurs' || stats.nombre_utilisateurs === 0}
        >
          {exportEnCours === 'utilisateurs' ? 'Export...' : '⬇ Export CSV complet'}
        </button>
      </div>
      <div className="card mb-4">
        <div className="card-body px-4 py-2">
          {recentsUtilisateurs.length === 0 ? (
            <p className="text-muted small py-2 mb-0">Aucun utilisateur pour l'instant.</p>
          ) : (
            recentsUtilisateurs.map((u) => (
              <div className="admin-recent-item" key={u.id}>
                <div>
                  <div className="fw-semibold">{u.name}</div>
                  <div className="text-muted small">{u.email}</div>
                </div>
                <div className="text-end">
                  <div className="chiffre small">{u.sols_count} sol{u.sols_count > 1 ? 's' : ''}</div>
                  <div className="text-muted small">{formatDateHeure(u.created_at)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="admin-section-entete">
        <h6 className="mb-0">Derniers avis reçus</h6>
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={() => exporterCsv('avis')}
          disabled={exportEnCours === 'avis' || stats.nombre_avis === 0}
        >
          {exportEnCours === 'avis' ? 'Export...' : '⬇ Export CSV complet'}
        </button>
      </div>
      <div className="card mb-5">
        <div className="card-body px-4 py-2">
          {recentsAvis.length === 0 ? (
            <p className="text-muted small py-2 mb-0">Aucun avis pour l'instant.</p>
          ) : (
            recentsAvis.map((a) => (
              <div className="admin-recent-item" key={a.id} style={{ alignItems: 'flex-start' }}>
                <div>
                  <div className="d-flex gap-2 flex-wrap small mb-1">
                    <span>Aimé : <strong>{a.aime === null ? '—' : a.aime ? 'Oui' : 'Non'}</strong></span>
                    <span>&middot;</span>
                    <span>Recommande : <strong>{a.recommande === null ? '—' : a.recommande ? 'Oui' : 'Non'}</strong></span>
                  </div>
                  <div className="text-muted small">
                    {a.user ? a.user.name : 'Anonyme'}
                  </div>
                </div>
                <div className="text-muted small text-end">{formatDateHeure(a.created_at)}</div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card border-danger">
        <div className="card-body p-4">
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
