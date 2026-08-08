import { createContext, useContext, useEffect, useState } from 'react';
import { translations, LANGUES_DISPONIBLES } from '../i18n/translations';

const LangContext = createContext(null);

function langueInitiale() {
  try {
    const enregistree = localStorage.getItem('soltrack_langue');
    if (enregistree && LANGUES_DISPONIBLES.some((l) => l.code === enregistree)) {
      return enregistree;
    }
  } catch (e) {
    // stockage indisponible, on utilise le défaut
  }
  return 'fr';
}

export function LangProvider({ children }) {
  const [langue, setLangue] = useState(langueInitiale);

  useEffect(() => {
    try {
      localStorage.setItem('soltrack_langue', langue);
    } catch (e) {
      // ignore
    }
    document.documentElement.setAttribute('lang', langue);
  }, [langue]);

  // Traduit une clé du type "nav.accueil". Si la clé n'existe pas dans la
  // langue choisie, on retombe sur le français plutôt que d'afficher un
  // texte cassé à l'utilisateur.
  const t = (cle) => {
    const parties = cle.split('.');

    let valeur = translations[langue];
    for (const partie of parties) {
      valeur = valeur?.[partie];
    }
    if (valeur !== undefined) return valeur;

    let repli = translations.fr;
    for (const partie of parties) {
      repli = repli?.[partie];
    }
    return repli ?? cle;
  };

  return (
    <LangContext.Provider value={{ langue, setLangue, t, langues: LANGUES_DISPONIBLES }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}