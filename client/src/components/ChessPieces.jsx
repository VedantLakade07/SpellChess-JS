import React from 'react';

// Highly optimized and beautifully styled inline SVGs for Chess Pieces.
// Incorporates subtle glows and shadows to fit the retro-futuristic magical aesthetic.

const PieceSVG = ({ type, color, ...props }) => {
  const fill = color === 'w' ? '#e2fcfb' : '#1a1f29';
  const stroke = color === 'w' ? '#66fcf1' : '#45a29e';
  const glowId = color === 'w' ? 'glow-white' : 'glow-black';

  switch (type) {
    case 'p': // Pawn
      return (
        <svg viewBox="0 0 45 45" {...props}>
          <defs>
            <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" filter={`url(#${glowId})`}>
            <path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-.83.62-1.41 1.61-1.41 2.72 0 1.93 1.57 3.5 3.5 3.5h4c1.93 0 3.5-1.57 3.5-3.5 0-1.11-.58-2.1-1.41-2.72C28.06 24.84 29 23.03 29 21c0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" />
          </g>
        </svg>
      );

    case 'r': // Rook
      return (
        <svg viewBox="0 0 45 45" {...props}>
          <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 39h27v-3H9v3zm3-3h21v-4H12v4zm2.5-4l1.5-12h18l1.5 12h-21z" />
            <path d="M12 12v4h4v-4h-4zm7 0v4h5v-4h-5zm8 0v4h4v-4h-4z" />
            <path d="M9 16h27v-4H9v4zm2-6h22V7H11v3z" />
          </g>
        </svg>
      );

    case 'n': // Knight
      return (
        <svg viewBox="0 0 45 45" {...props}>
          <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 22,10 C 22,10 19,11 16,15 C 13,19 13,23 13,23 C 13,23 14,20 18,20 C 18,20 17,21 15,24 C 13,27 13,31 16,35 C 19,39 25,39 28,35 C 31,31 31,23 28,18 C 25,13 22,10 22,10 z" />
            <circle cx="20.5" cy="16.5" r="1.5" fill={color === 'w' ? '#000' : '#fff'} />
            <path d="M 16,28 C 16,28 19,25 24,28 C 29,31 29,33 29,33" fill="none" />
          </g>
        </svg>
      );

    case 'b': // Bishop
      return (
        <svg viewBox="0 0 45 45" {...props}>
          <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 36h27v-3H9v3zm3-3h21v-3H12v3zm9.5-3c-1.93 0-3.5-1.57-3.5-3.5 0-1.66 1.16-3.05 2.72-3.41C17.33 21.78 16 19.04 16 16c0-3.59 2.91-6.5 6.5-6.5s6.5 2.91 6.5 6.5c0 3.04-1.33 5.78-3.22 7.09 1.56.36 2.72 1.75 2.72 3.41 0 1.93-1.57 3.5-3.5 3.5h-4z" />
            <circle cx="22.5" cy="5" r="2" />
            <path d="M17.5 18h10M22.5 13v10" stroke={stroke} strokeWidth="1.5" />
          </g>
        </svg>
      );

    case 'q': // Queen
      return (
        <svg viewBox="0 0 45 45" {...props}>
          <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 39h27v-3H9v3zm3-3h21v-4H12v4zm2.5-4l3-20h12l3 20h-18z" />
            <path d="M6 12l6 14 10.5-22L33 26l6-14" fill="none" stroke={stroke} strokeWidth="1.5" />
            <circle cx="6" cy="12" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="22.5" cy="4" r="2" />
            <circle cx="33" cy="12" r="2" />
            <circle cx="39" cy="12" r="2" />
          </g>
        </svg>
      );

    case 'k': // King
      return (
        <svg viewBox="0 0 45 45" {...props}>
          <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 39h27v-3H9v3zm3-3h21v-4H12v4zm10.5-4V15h-3v17h3z" />
            <path d="M11.5 30C11.5 22 16 16 22.5 16S33.5 22 33.5 30h-22z" />
            <path d="M16.5 11.5h12M22.5 5.5v12" stroke={stroke} strokeWidth="1.5" />
          </g>
        </svg>
      );

    default:
      return null;
  }
};

export default PieceSVG;
