import { useEffect, useRef, useState } from 'react';

// Quatre scènes originales, chacune liée à un vrai symbole du sol :
// la roue des tours (mécanique du produit), le cercle de mains qui se
// passent la cagnotte, les couleurs vives façon tap-tap, et le soleil
// ("soley" en créole — jeu de mots avec "sol"). Aucune photo externe :
// pas de risque de lien cassé, pas de poids réseau pour un public
// mobile-first, et un lien direct avec le sujet plutôt qu'un décor
// générique.
const DUREE_SCENE_MS = 3 * 60 * 1000; // 3 minutes

function SceneRoue() {
  return (
    <svg viewBox="0 0 800 800" className="scene-svg scene-roue" aria-hidden="true">
      <defs>
        <radialGradient id="glowRoue" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--dore)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--dore)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="400" cy="400" r="340" fill="url(#glowRoue)" />
      <g className="scene-roue-rotation" style={{ transformOrigin: '400px 400px' }}>
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i / 12) * 360;
          const couleurs = ['var(--corail)', 'var(--dore)', 'var(--vert-paye)', 'var(--bleu-moyen)'];
          return (
            <circle
              key={i}
              cx={400 + 300 * Math.cos((angle * Math.PI) / 180)}
              cy={400 + 300 * Math.sin((angle * Math.PI) / 180)}
              r={i % 3 === 0 ? 22 : 12}
              fill={couleurs[i % couleurs.length]}
              opacity="0.55"
            />
          );
        })}
        <circle cx="400" cy="400" r="300" fill="none" stroke="var(--trait)" strokeWidth="1.5" />
        <circle cx="400" cy="400" r="180" fill="none" stroke="var(--trait)" strokeWidth="1.5" />
      </g>
    </svg>
  );
}

function SceneCercleMains() {
  const points = Array.from({ length: 8 });
  return (
    <svg viewBox="0 0 800 800" className="scene-svg scene-mains" aria-hidden="true">
      <defs>
        <radialGradient id="glowMains" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--vert-paye)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--vert-paye)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="400" cy="400" r="320" fill="url(#glowMains)" />
      <g className="scene-mains-pulse" style={{ transformOrigin: '400px 400px' }}>
        {points.map((_, i) => {
          const angle = (i / points.length) * 360;
          const cx = 400 + 260 * Math.cos((angle * Math.PI) / 180);
          const cy = 400 + 260 * Math.sin((angle * Math.PI) / 180);
          const couleurs = ['var(--corail)', 'var(--dore)', 'var(--vert-paye)'];
          return (
            <g key={i}>
              <line x1="400" y1="400" x2={cx} y2={cy} stroke="var(--trait)" strokeWidth="2" />
              <circle cx={cx} cy={cy} r="28" fill={couleurs[i % couleurs.length]} opacity="0.5" />
            </g>
          );
        })}
        <circle cx="400" cy="400" r="46" fill="var(--dore)" opacity="0.85" />
      </g>
    </svg>
  );
}

function SceneTapTap() {
  const bandes = Array.from({ length: 9 });
  const couleurs = ['var(--corail)', 'var(--dore)', 'var(--vert-paye)', 'var(--bleu-moyen)'];
  return (
    <svg viewBox="0 0 800 800" className="scene-svg scene-taptap" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <g className="scene-taptap-glisse">
        {bandes.map((_, i) => (
          <rect
            key={i}
            x={-200 + i * 140}
            y="-200"
            width="70"
            height="1200"
            transform="rotate(18 400 400)"
            fill={couleurs[i % couleurs.length]}
            opacity="0.22"
          />
        ))}
      </g>
    </svg>
  );
}

function SceneSoley() {
  const rayons = Array.from({ length: 16 });
  return (
    <svg viewBox="0 0 800 800" className="scene-svg scene-soley" aria-hidden="true">
      <defs>
        <radialGradient id="glowSoley" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor="var(--dore)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="var(--dore)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="400" cy="400" r="360" fill="url(#glowSoley)" />
      <g className="scene-soley-rotation" style={{ transformOrigin: '400px 400px' }}>
        {rayons.map((_, i) => {
          const angle = (i / rayons.length) * 360;
          return (
            <rect
              key={i}
              x="398"
              y="90"
              width="4"
              height="90"
              rx="2"
              fill="var(--dore)"
              opacity="0.5"
              transform={`rotate(${angle} 400 400)`}
            />
          );
        })}
      </g>
      <circle cx="400" cy="400" r="90" fill="var(--corail)" opacity="0.5" />
    </svg>
  );
}

const SCENES = [SceneRoue, SceneCercleMains, SceneTapTap, SceneSoley];

function ScenesDeFond() {
  const [indexActuel, setIndexActuel] = useState(0);
  const reduireMouvement = useRef(false);

  useEffect(() => {
    reduireMouvement.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduireMouvement.current) {
      // Respecte la préférence d'accessibilité : une seule scène fixe,
      // aucune rotation automatique.
      return;
    }

    const intervalle = setInterval(() => {
      setIndexActuel((i) => (i + 1) % SCENES.length);
    }, DUREE_SCENE_MS);

    return () => clearInterval(intervalle);
  }, []);

  return (
    <div className="scenes-de-fond" aria-hidden="true">
      {SCENES.map((Scene, i) => (
        <div
          key={i}
          className={`scene-couche ${i === indexActuel ? 'scene-visible' : ''}`}
        >
          <Scene />
        </div>
      ))}
    </div>
  );
}

export default ScenesDeFond;