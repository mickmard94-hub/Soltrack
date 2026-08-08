import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../contexts/LangContext';
import api from '../services/api';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString('fr-FR');
}

function Notifications() {
  const { t } = useLang();
  const [notifications, setNotifications] = useState([]);
  const [chargement, setChargement] = useState(true);

  const charger = () => {
    api.get('/notifications')
      .then((response) => {
        setNotifications(response.data);
        setChargement(false);
      })
      .catch((error) => {
        console.error('Erreur lors du chargement des notifications :', error);
        setChargement(false);
      });
  };

  useEffect(() => {
    charger();
  }, []);

  const marquerLue = (notif) => {
    if (notif.lue) return;
    api.put(`/notifications/${notif.id}/lue`)
      .then(() => {
        setNotifications((liste) =>
          liste.map((n) => (n.id === notif.id ? { ...n, lue: true } : n))
        );
      })
      .catch((error) => console.error(error));
  };

  const toutMarquerLu = () => {
    api.put('/notifications/tout-marquer-lu')
      .then(() => {
        setNotifications((liste) => liste.map((n) => ({ ...n, lue: true })));
      })
      .catch((error) => console.error(error));
  };

  const yADesNonLues = notifications.some((n) => !n.lue);

  return (
    <div className="row justify-content-center py-2">
      <div className="col-md-8 col-lg-6">
        <Link to="/sols" className="btn btn-sm btn-outline-secondary mb-3">
          ← {t('common.retour')}
        </Link>

        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="mb-0">{t('notifications.titre')}</h1>
          {yADesNonLues && (
            <button className="btn btn-sm btn-outline-secondary" onClick={toutMarquerLu}>
              {t('notifications.tout_marquer_lu')}
            </button>
          )}
        </div>

        {chargement && <p>{t('common.chargement')}</p>}

        {!chargement && notifications.length === 0 && (
          <div className="card">
            <div className="card-body text-center py-5 text-muted">
              {t('notifications.aucune')}
            </div>
          </div>
        )}

        <div className="d-flex flex-column gap-2">
          {notifications.map((n) => (
            <div
              className="card"
              key={n.id}
              style={{
                cursor: n.lue ? 'default' : 'pointer',
                borderLeft: n.lue ? undefined : '3px solid var(--dore)',
              }}
              onClick={() => marquerLue(n)}
            >
              <div className="card-body py-3">
                <div className="d-flex justify-content-between align-items-start gap-2">
                  <h6 className="mb-1">{n.titre}</h6>
                  {!n.lue && <span className="sceau sceau-attente">•</span>}
                </div>
                <p className="mb-1 small">{n.message}</p>
                <span className="text-muted small">{formatDate(n.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Notifications;