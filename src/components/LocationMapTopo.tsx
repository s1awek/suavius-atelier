export function LocationMapTopo() {
  return (
    <figure className="w-full">
      <div className="relative aspect-[5/4] bg-warm-mid/30 border border-warm-mid overflow-hidden">
        <svg
          viewBox="0 0 500 400"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute inset-0 w-full h-full"
          role="img"
          aria-label="Topographic map showing Bielawa in Lower Silesia, Poland, at the foot of the Owl Mountains"
        >
          <defs>
            <radialGradient id="pinGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#b87333" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#b87333" stopOpacity="0" />
            </radialGradient>
            <pattern id="forestPattern" width="14" height="14" patternUnits="userSpaceOnUse">
              <circle cx="3" cy="3" r="1.2" fill="#8a9479" opacity="0.55" />
              <circle cx="10" cy="8" r="1.2" fill="#8a9479" opacity="0.55" />
              <circle cx="5" cy="11" r="1" fill="#8a9479" opacity="0.45" />
            </pattern>
          </defs>

          <rect width="500" height="400" fill="#f5f0e8" />

          <g stroke="#c9bca3" fill="none" strokeWidth="0.9" opacity="0.55">
            <path d="M -20 260 Q 100 230 250 250 T 520 245" />
            <path d="M -20 285 Q 110 250 250 275 T 520 265" />
            <path d="M -20 310 Q 120 270 250 300 T 520 285" />
            <path d="M -20 335 Q 130 290 250 325 T 520 310" />
            <path d="M -20 360 Q 140 320 250 350 T 520 335" />
            <path d="M -20 390 Q 150 350 250 380 T 520 365" />
          </g>

          <g stroke="#b8a98e" fill="none" strokeWidth="0.7" opacity="0.5">
            <path d="M 60 240 Q 130 215 250 230 T 460 225" />
            <path d="M 80 215 Q 160 195 260 205 T 450 200" />
            <path d="M 110 190 Q 190 175 270 180 T 440 175" />
          </g>

          <g opacity="0.7">
            <ellipse cx="80" cy="320" rx="46" ry="22" fill="url(#forestPattern)" />
            <ellipse cx="180" cy="355" rx="55" ry="20" fill="url(#forestPattern)" />
            <ellipse cx="380" cy="315" rx="50" ry="24" fill="url(#forestPattern)" />
            <ellipse cx="430" cy="365" rx="44" ry="18" fill="url(#forestPattern)" />
            <ellipse cx="290" cy="370" rx="38" ry="16" fill="url(#forestPattern)" />
          </g>

          <path
            d="M 145 0 Q 175 80 200 150 Q 220 195 260 230 Q 295 260 320 320 Q 340 370 360 410"
            stroke="#7d9aa8"
            strokeWidth="1.8"
            fill="none"
            opacity="0.7"
          />
          <path
            d="M 145 0 Q 175 80 200 150 Q 220 195 260 230 Q 295 260 320 320 Q 340 370 360 410"
            stroke="#a8c0cc"
            strokeWidth="0.8"
            fill="none"
            opacity="0.9"
          />

          <g stroke="#1a1714" fill="none" strokeWidth="1.3" opacity="0.55">
            <path d="M 240 -10 L 248 80 L 252 140 L 250 195 L 248 230" />
            <path d="M 248 230 L 290 280 L 340 330 L 400 380 L 460 410" />
            <path d="M 250 195 L 180 170 L 100 145 L 30 110" />
            <path d="M 252 140 L 340 130 L 420 115 L 490 95" />
          </g>
          <g stroke="#1a1714" fill="none" strokeWidth="1.3" strokeDasharray="2 3" opacity="0.5">
            <path d="M 248 230 L 220 270 L 180 305 L 130 340" />
            <path d="M 252 140 L 200 100 L 160 70" />
          </g>

          <g fontFamily="Inter, system-ui, sans-serif" fontSize="10" fill="#5a4f43" letterSpacing="1.2">
            <text x="252" y="120" textAnchor="start" opacity="0.85">DZIERŻONIÓW</text>
            <circle cx="248" cy="125" r="2.5" fill="#1a1714" />

            <text x="30" y="100" textAnchor="start" opacity="0.85">WAŁBRZYCH</text>
            <circle cx="32" cy="108" r="2" fill="#1a1714" />

            <text x="425" y="85" textAnchor="start" opacity="0.85">WROCŁAW</text>
            <text x="425" y="97" textAnchor="start" fontSize="8" opacity="0.6">→ 60 km</text>

            <text x="455" y="405" textAnchor="end" opacity="0.7" fontSize="9">→ KŁODZKO</text>
          </g>

          <g
            fontFamily="Cormorant Garamond, Georgia, serif"
            fontStyle="italic"
            fill="#5a4f43"
            opacity="0.7"
            letterSpacing="3"
          >
            <text x="250" y="350" textAnchor="middle" fontSize="16">
              GÓRY SOWIE
            </text>
            <text x="250" y="367" textAnchor="middle" fontSize="9" letterSpacing="2">
              Owl Mountains
            </text>
          </g>

          <text
            x="20"
            y="30"
            fontFamily="Inter, system-ui, sans-serif"
            fontSize="9"
            fill="#8c7b6b"
            letterSpacing="2.5"
          >
            LOWER SILESIA
          </text>

          <g transform="translate(460 40)" fill="#5a4f43" opacity="0.75">
            <circle r="14" fill="none" stroke="#5a4f43" strokeWidth="0.8" />
            <path d="M 0 -11 L 3 0 L 0 11 L -3 0 Z" fill="#5a4f43" />
            <path d="M 0 -11 L 3 0 L 0 0 Z" fill="#1a1714" />
            <text
              x="0"
              y="-18"
              textAnchor="middle"
              fontFamily="Inter, system-ui, sans-serif"
              fontSize="9"
              fontWeight="600"
              fill="#1a1714"
            >
              N
            </text>
          </g>

          <g transform="translate(248 230)">
            <circle r="58" fill="url(#pinGlow)" />
            <ellipse cx="0" cy="3" rx="9" ry="2.5" fill="#000" opacity="0.18" />
            <path
              d="M 0 0 Q -16 -10 -14 -26 A 14 14 0 1 1 14 -26 Q 16 -10 0 0 Z"
              fill="#b87333"
              stroke="#7a4a1f"
              strokeWidth="1"
            />
            <circle cx="0" cy="-26" r="5.5" fill="#f5f0e8" />
          </g>
          <g transform="translate(248 230)">
            <text
              x="22"
              y="-22"
              fontFamily="Cormorant Garamond, Georgia, serif"
              fontSize="22"
              fontWeight="500"
              fill="#1a1714"
              letterSpacing="0.5"
            >
              Bielawa
            </text>
            <text
              x="22"
              y="-9"
              fontFamily="Inter, system-ui, sans-serif"
              fontSize="9"
              fill="#8c7b6b"
              letterSpacing="2"
            >
              SUAVIUS ATELIER
            </text>
          </g>

          <g
            transform="translate(20 370)"
            fontFamily="Inter, system-ui, sans-serif"
            fontSize="9"
            fill="#8c7b6b"
          >
            <line x1="0" y1="0" x2="60" y2="0" stroke="#8c7b6b" strokeWidth="1" />
            <line x1="0" y1="-3" x2="0" y2="3" stroke="#8c7b6b" strokeWidth="1" />
            <line x1="30" y1="-3" x2="30" y2="3" stroke="#8c7b6b" strokeWidth="1" />
            <line x1="60" y1="-3" x2="60" y2="3" stroke="#8c7b6b" strokeWidth="1" />
            <text x="0" y="15" textAnchor="start">0</text>
            <text x="30" y="15" textAnchor="middle">5</text>
            <text x="62" y="15" textAnchor="start">10 km</text>
          </g>
        </svg>
      </div>
      <figcaption className="mt-3 text-sm text-ink-muted">
        Our atelier is in Bielawa, at the foot of the Owl Mountains. Visits by appointment.
      </figcaption>
    </figure>
  )
}
