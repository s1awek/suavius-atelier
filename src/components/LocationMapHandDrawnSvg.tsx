export function LocationMap() {
  return (
    <figure className="w-full">
      <div className="relative aspect-[5/4] bg-[#ede2cf] border border-warm-mid overflow-hidden">
        <svg
          viewBox="0 0 500 400"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute inset-0 w-full h-full"
          role="img"
          aria-label="Hand-drawn map showing Bielawa in Lower Silesia, Poland, at the foot of the Owl Mountains"
        >
          <defs>
            <filter id="rough" x="-10%" y="-10%" width="120%" height="120%">
              <feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves="2" seed="4" />
              <feDisplacementMap in="SourceGraphic" scale="1.4" />
            </filter>
            <filter id="paper" x="0%" y="0%" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="2" />
              <feColorMatrix values="0 0 0 0 0.55  0 0 0 0 0.45  0 0 0 0 0.32  0 0 0 0.08 0" />
            </filter>
            <pattern id="treesPat" width="22" height="22" patternUnits="userSpaceOnUse">
              <g stroke="#5a4f43" strokeWidth="0.6" fill="none" strokeLinecap="round">
                <path d="M 5 14 L 5 10 M 3 11 L 5 7 L 7 11 M 4 9 L 5 6 L 6 9" />
                <path d="M 15 18 L 15 14 M 13 15 L 15 11 M 14 13 L 15 10 L 16 13" />
                <path d="M 9 20 L 9 17 M 8 18 L 9 15 L 10 18" />
              </g>
            </pattern>
            <radialGradient id="pinGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#b87333" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#b87333" stopOpacity="0" />
            </radialGradient>
          </defs>

          <rect width="500" height="400" fill="#ede2cf" />
          <rect width="500" height="400" fill="#ede2cf" filter="url(#paper)" opacity="0.35" />

          <g fill="none" stroke="#5a4f43" strokeLinecap="round" strokeLinejoin="round">
            <rect x="12" y="12" width="476" height="376" strokeWidth="1.2" />
            <rect x="20" y="20" width="460" height="360" strokeWidth="0.5" opacity="0.7" />
            <g opacity="0.7">
              <path d="M 20 20 L 26 26 M 20 32 L 32 20 M 20 26 L 26 20" strokeWidth="0.4" />
              <path d="M 480 20 L 474 26 M 480 32 L 468 20 M 480 26 L 474 20" strokeWidth="0.4" />
              <path d="M 20 380 L 26 374 M 20 368 L 32 380 M 20 374 L 26 380" strokeWidth="0.4" />
              <path d="M 480 380 L 474 374 M 480 368 L 468 380 M 480 374 L 474 380" strokeWidth="0.4" />
            </g>
          </g>

          <g
            fontFamily="Cormorant Garamond, Georgia, serif"
            fill="#3a2f25"
            textAnchor="middle"
            opacity="0.92"
          >
            <text x="250" y="56" fontSize="22" fontStyle="italic" letterSpacing="3">
              Bielawa
            </text>
            <text x="250" y="72" fontSize="11" letterSpacing="3" fontStyle="italic">
              &amp; Surrounding Region
            </text>
            <line
              x1="195"
              y1="80"
              x2="305"
              y2="80"
              stroke="#5a4f43"
              strokeWidth="0.5"
              opacity="0.7"
            />
            <text
              x="250"
              y="92"
              fontSize="8"
              letterSpacing="4"
              fill="#8c7b6b"
              fontFamily="Inter, system-ui, sans-serif"
            >
              LOWER SILESIA
            </text>
          </g>

          <g filter="url(#rough)" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path
              d="M 30 335 L 60 305 L 78 320 L 95 295 L 118 318 L 140 285 L 165 312 L 188 290 L 215 318 L 240 280 L 270 315 L 295 285 L 318 314 L 345 282 L 372 318 L 395 295 L 420 320 L 448 300 L 475 322"
              stroke="#5a4f43"
              strokeWidth="0.5"
              opacity="0.45"
            />

            <path
              d="M 30 345 L 55 315 L 72 332 Q 80 318 88 330 L 105 305 L 128 325 Q 138 308 148 322 L 168 295 L 192 322 L 215 300 L 238 325 Q 252 305 268 318 L 290 290 L 315 322 L 340 295 L 365 322 L 388 305 L 415 325 Q 430 308 445 322 L 470 305"
              stroke="#3a2f25"
              strokeWidth="0.95"
              opacity="0.92"
            />

            <g stroke="#3a2f25" strokeWidth="0.5" opacity="0.7">
              <path d="M 55 315 L 64 325 M 60 320 L 68 328 M 65 324 L 72 332" />
              <path d="M 105 305 L 114 318 M 110 311 L 119 321 M 115 314 L 124 323" />
              <path d="M 168 295 L 178 310 M 174 301 L 184 314 M 180 305 L 190 318" />
              <path d="M 215 300 L 224 315 M 220 305 L 230 318 M 226 309 L 235 321" />
              <path d="M 290 290 L 300 306 M 296 296 L 306 310 M 302 300 L 312 314" />
              <path d="M 340 295 L 350 311 M 346 300 L 356 314 M 352 305 L 362 318" />
              <path d="M 388 305 L 397 318 M 393 309 L 402 321 M 398 312 L 407 324" />
            </g>

            <g stroke="#3a2f25" strokeWidth="0.35" opacity="0.45">
              <path d="M 75 322 L 70 318 M 80 326 L 75 322 M 84 329 L 80 325" />
              <path d="M 138 322 L 134 318 M 143 326 L 138 321 M 148 328 L 143 324" />
              <path d="M 200 320 L 196 316 M 205 324 L 200 319 M 210 327 L 205 322" />
              <path d="M 320 322 L 316 318 M 325 326 L 320 321 M 330 328 L 325 324" />
              <path d="M 370 320 L 366 316 M 375 324 L 370 319 M 380 327 L 375 322" />
            </g>

            <g stroke="#3a2f25" strokeWidth="0.3" opacity="0.5">
              <path d="M 60 305 L 64 308 M 95 295 L 99 298 M 140 285 L 144 288 M 215 290 L 219 293 M 270 287 L 274 290 M 345 282 L 349 285 M 420 296 L 424 299" />
            </g>
          </g>

          <g opacity="0.55">
            <ellipse cx="75" cy="195" rx="40" ry="15" fill="url(#treesPat)" />
            <ellipse cx="380" cy="180" rx="45" ry="14" fill="url(#treesPat)" />
            <ellipse cx="440" cy="250" rx="35" ry="14" fill="url(#treesPat)" />
            <ellipse cx="120" cy="355" rx="50" ry="14" fill="url(#treesPat)" />
            <ellipse cx="380" cy="355" rx="55" ry="14" fill="url(#treesPat)" />
          </g>

          <path
            d="M 130 5 Q 160 60 195 110 Q 220 145 250 195 Q 275 235 300 285 Q 320 330 340 395"
            filter="url(#rough)"
            stroke="#5a4f43"
            strokeWidth="1.4"
            fill="none"
            opacity="0.55"
            strokeLinecap="round"
          />

          <g
            filter="url(#rough)"
            stroke="#3a2f25"
            fill="none"
            strokeLinecap="round"
            strokeWidth="1.1"
            strokeDasharray="4 3"
            opacity="0.7"
          >
            <path d="M 248 -10 Q 252 80 250 140 Q 248 190 248 230" />
            <path d="M 248 230 Q 290 270 340 310 Q 390 350 450 395" />
            <path d="M 250 145 Q 200 130 130 115 Q 70 105 10 95" />
            <path d="M 252 150 Q 320 145 400 140 Q 460 135 510 130" />
            <path d="M 248 230 Q 220 260 175 290 Q 130 320 90 350" />
          </g>

          <g
            fontFamily="Cormorant Garamond, Georgia, serif"
            fill="#3a2f25"
            fontStyle="italic"
            opacity="0.9"
          >
            <circle cx="248" cy="138" r="2.8" fill="#3a2f25" />
            <text x="258" y="135" fontSize="13">
              Dzierżoniów
            </text>

            <circle cx="42" cy="100" r="2.5" fill="#3a2f25" />
            <text x="50" y="96" fontSize="13">
              Wałbrzych
            </text>

            <circle cx="430" cy="135" r="2.5" fill="#3a2f25" />
            <text x="368" y="125" fontSize="13">
              Wrocław
            </text>
            <text
              x="368"
              y="138"
              fontSize="8"
              fontFamily="Inter, system-ui, sans-serif"
              fontStyle="normal"
              fill="#8c7b6b"
              letterSpacing="1"
            >
              60 km →
            </text>

            <text
              x="450"
              y="395"
              fontSize="10"
              fontFamily="Inter, system-ui, sans-serif"
              fill="#8c7b6b"
              letterSpacing="1"
              textAnchor="end"
            >
              → KŁODZKO
            </text>
          </g>

          <g
            fontFamily="Cormorant Garamond, Georgia, serif"
            fill="#3a2f25"
            opacity="0.55"
            textAnchor="middle"
          >
            <text x="250" y="375" fontSize="14" fontStyle="italic" letterSpacing="6">
              GÓRY SOWIE
            </text>
          </g>

          <g transform="translate(248 230)">
            <circle r="50" fill="url(#pinGlow)" />
            <ellipse cx="0" cy="3" rx="9" ry="2.5" fill="#000" opacity="0.22" />
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
              fontStyle="italic"
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

          <g transform="translate(440 60)" opacity="0.85">
            <circle r="22" fill="none" stroke="#3a2f25" strokeWidth="0.7" />
            <circle r="17" fill="none" stroke="#3a2f25" strokeWidth="0.4" opacity="0.6" />
            <path d="M 0 -22 L 3 0 L 0 22 L -3 0 Z" fill="#ede2cf" stroke="#3a2f25" strokeWidth="0.6" />
            <path d="M -22 0 L 0 3 L 22 0 L 0 -3 Z" fill="#ede2cf" stroke="#3a2f25" strokeWidth="0.6" />
            <path d="M 0 -22 L 3 0 L 0 0 Z" fill="#3a2f25" />
            <path d="M 22 0 L 0 -3 L 0 0 Z" fill="#3a2f25" opacity="0.55" />
            <g transform="rotate(45)">
              <path d="M 0 -18 L 2 0 L 0 18 L -2 0 Z" fill="#3a2f25" opacity="0.35" />
              <path d="M -18 0 L 0 2 L 18 0 L 0 -2 Z" fill="#3a2f25" opacity="0.35" />
            </g>
            <text
              x="0"
              y="-28"
              textAnchor="middle"
              fontFamily="Cormorant Garamond, Georgia, serif"
              fontSize="13"
              fontStyle="italic"
              fill="#3a2f25"
            >
              N
            </text>
          </g>

          <g
            transform="translate(30 360)"
            fontFamily="Cormorant Garamond, Georgia, serif"
            fontStyle="italic"
            fontSize="10"
            fill="#5a4f43"
          >
            <line x1="0" y1="0" x2="80" y2="0" stroke="#5a4f43" strokeWidth="0.8" />
            <line x1="0" y1="-4" x2="0" y2="4" stroke="#5a4f43" strokeWidth="0.8" />
            <line x1="40" y1="-3" x2="40" y2="3" stroke="#5a4f43" strokeWidth="0.6" />
            <line x1="80" y1="-4" x2="80" y2="4" stroke="#5a4f43" strokeWidth="0.8" />
            <text x="0" y="14">0</text>
            <text x="40" y="14" textAnchor="middle">5</text>
            <text x="82" y="14">10 km</text>
          </g>
        </svg>
      </div>
      <figcaption className="mt-3 text-sm text-ink-muted">
        Our atelier is in Bielawa, at the foot of the Owl Mountains. Visits by appointment.
      </figcaption>
    </figure>
  )
}
