import { useLang } from '../contexts/LangContext';

function RoueDesTours({ tours }) {
  const { t } = useLang();
  const size = 200;
  const center = size / 2;
  const radius = 78;
  const n = tours.length;

  if (n === 0) {
    return null;
  }

  const tourActuelIndex = tours.findIndex((t) => t.statut !== 'verse');
  const indexActuel = tourActuelIndex === -1 ? n - 1 : tourActuelIndex;

  return (
    <div className="d-flex flex-column align-items-center">
      <div className="position-relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="position-absolute top-0 start-0">
          <circle cx={center} cy={center} r={radius} fill="none" stroke="var(--trait)" strokeWidth="2" />
          {tours.map((tour, i) => {
            const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
            const x = center + radius * Math.cos(angle);
            const y = center + radius * Math.sin(angle);
            const estVerse = tour.statut === 'verse';
            const estActuel = i === indexActuel;

            let fill = 'var(--surface)';
            let stroke = 'var(--bleu-nuit)';
            if (estVerse) {
              fill = 'var(--vert-paye)';
              stroke = 'var(--vert-paye)';
            } else if (estActuel) {
              fill = 'var(--dore)';
              stroke = 'var(--dore)';
            }

            return (
              <g key={tour.id}>
                <line
                  x1={center} y1={center} x2={x} y2={y}
                  stroke={estVerse ? 'var(--vert-paye)' : 'var(--trait)'}
                  strokeWidth={estActuel ? 2 : 1}
                  opacity={0.55}
                />
                <circle
                  cx={x} cy={y} r={estActuel ? 14 : 11}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={estActuel ? 3 : 1.2}
                />
                <text
                  x={x} y={y + 4} textAnchor="middle"
                  fontSize="10" fontFamily="'IBM Plex Mono', monospace" fontWeight="600"
                  fill={estVerse || estActuel ? '#FFFFFF' : 'var(--bleu-nuit)'}
                >
                  {tour.numero_tour}
                </text>
              </g>
            );
          })}
        </svg>
        <div className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center text-center px-4">
          <span className="hero-eyebrow" style={{ fontSize: '0.65rem' }}>{t('roue.prochain_tour')}</span>
          <span className="fw-semibold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: 'var(--bleu-nuit)' }}>
            {tours[indexActuel]?.membre_beneficiaire?.nom || '—'}
          </span>
        </div>
      </div>
      <div className="d-flex gap-3 mt-2 small" style={{ color: 'var(--texte-muted)' }}>
        <span><span className="membre-puce" style={{ width: 14, height: 14, background: 'var(--vert-paye)', border: 'none' }}></span> {t('roue.verse')}</span>
        <span><span className="membre-puce" style={{ width: 14, height: 14, background: 'var(--dore)', border: 'none' }}></span> {t('roue.en_cours')}</span>
      </div>
    </div>
  );
}

export default RoueDesTours;