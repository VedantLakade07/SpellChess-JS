import React from 'react';

// Re-designed Chess Pieces (Vector shapes with high recognizability and premium neon glows)
// Each piece combines a traditional chess profile with modern vector lines.

const PieceSVG = ({ type, color, ...props }) => {
  const fill = color === 'w' ? '#e2fcfb' : '#141822';
  const stroke = color === 'w' ? '#66fcf1' : '#45a29e';
  const glowId = color === 'w' ? 'glow-white' : 'glow-black';

  // SVGs use a 45x45 grid for standard chess piece sizing alignment.
  switch (type) {
    case 'p': // Pawn
      return (
        <svg viewBox="0 0 45 45" {...props}>
          <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            {/* Base */}
            <path d="M 12,36 L 33,36 C 33,36 34,38 32,39 L 13,39 C 11,38 12,36 12,36 Z" />
            <path d="M 14,36 C 14,33 17,32 17,29 C 17,26 15,25 15,22 C 15,19 18,17 22.5,17 C 27,17 30,19 30,22 C 30,25 28,26 28,29 C 28,32 31,33 31,36 Z" />
            {/* Collar */}
            <path d="M 16,32 L 29,32" stroke={stroke} strokeWidth="1.5" />
            {/* Head */}
            <circle cx="22.5" cy="13.5" r="5" />
          </g>
        </svg>
      );

    case 'r': // Rook
      return (
        <svg viewBox="0 0 45 45" {...props}>
          <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            {/* Base */}
            <path d="M 12,36 L 33,36 C 33,36 34,38 32,39 L 13,39 C 11,38 12,36 12,36 Z" />
            <path d="M 14,36 L 14,32 L 31,32 L 31,36 Z" />
            {/* Body */}
            <path d="M 15,32 L 17,17 L 28,17 L 30,32 Z" />
            {/* Battlement Cap */}
            <path d="M 14,17 L 31,17 L 31,11 L 27.5,11 L 27.5,14 L 23.5,14 L 23.5,11 L 21.5,11 L 21.5,14 L 17.5,14 L 17.5,11 L 14,11 Z" />
          </g>
        </svg>
      );

    case 'n': // Knight (Horse)
      return (
        <svg viewBox="0 0 45 45" {...props}>
          <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            {/* Base */}
            <path d="M 12,36 L 33,36 C 33,36 34,38 32,39 L 13,39 C 11,38 12,36 12,36 Z" />
            {/* Horse Profile Outline */}
            <path d="M 31,36 C 31,31 29,28 27,26 C 29,24 30.5,21 30.5,18 C 30.5,12 25.5,11 23,11 C 21.5,11 20,11.5 19,12.5 C 17,11 14,13 14,16 C 14,17.5 15,19 16.5,20 C 14.5,21.5 13,24 13,27.5 C 13,31 16.5,33 16.5,33 L 15,36 Z" />
            {/* Eye */}
            <circle cx="25.5" cy="15.5" r="1" fill={color === 'w' ? stroke : 'none'} stroke={stroke} strokeWidth="1" />
            {/* Mane Detail */}
            <path d="M 21.5,19 C 20,19 18,21 18,23 C 18,25 20,26 21.5,26" fill="none" stroke={stroke} strokeWidth="1.2" />
            {/* Snout Detail */}
            <path d="M 15.5,17.5 L 17.5,19.5" fill="none" stroke={stroke} strokeWidth="1.2" />
          </g>
        </svg>
      );

    case 'b': // Bishop
      return (
        <svg viewBox="0 0 45 45" {...props}>
          <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            {/* Base */}
            <path d="M 12,36 L 33,36 C 33,36 34,38 32,39 L 13,39 C 11,38 12,36 12,36 Z" />
            <path d="M 14,36 L 14,32 L 31,32 L 31,36 Z" />
            {/* Body */}
            <path d="M 17.5,32 C 15.5,28 15.5,23 18.5,19 C 17,18.5 16,17.5 16,16 C 16,13.5 19,11 22.5,11 C 26,11 29,13.5 29,16 C 29,17.5 28,18.5 26.5,19 C 29.5,23 29.5,28 27.5,32 Z" />
            {/* Diagonal Cut (Slit) */}
            <path d="M 21.5,14 L 25.5,19" fill="none" stroke={stroke} strokeWidth="1.5" />
            {/* Top Cross */}
            <path d="M 22.5,11 L 22.5,8 M 21,9.5 L 24,9.5" fill="none" stroke={stroke} strokeWidth="1.5" />
          </g>
        </svg>
      );

    case 'q': // Queen
      return (
        <svg viewBox="0 0 45 45" {...props}>
          <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            {/* Base */}
            <path d="M 12,38 L 33,38 C 33,38 34,40 32,41 L 13,41 C 11,40 12,38 12,38 Z" />
            <path d="M 13.5,38 C 13.5,34 16,33 16,30 C 16,26 15,25 15,22 C 15,19 17,17.5 17,16 L 28,16 C 28,17.5 30,19 30,22 C 30,25 29,26 29,30 C 29,33 31.5,34 31.5,38 Z" />
            {/* Collar */}
            <path d="M 15.5,33 L 29.5,33" stroke={stroke} strokeWidth="1.5" />
            {/* Crown points */}
            <path d="M 16,16 L 14,9 L 19,13 L 22.5,7 L 26,13 L 31,9 L 29,16 Z" />
            {/* Crown jewels (spheres at tips) */}
            <circle cx="14" cy="9" r="1.2" fill={color === 'w' ? stroke : 'none'} stroke={stroke} />
            <circle cx="19" cy="13" r="1.2" fill={color === 'w' ? stroke : 'none'} stroke={stroke} />
            <circle cx="22.5" cy="7" r="1.2" fill={color === 'w' ? stroke : 'none'} stroke={stroke} />
            <circle cx="26" cy="13" r="1.2" fill={color === 'w' ? stroke : 'none'} stroke={stroke} />
            <circle cx="31" cy="9" r="1.2" fill={color === 'w' ? stroke : 'none'} stroke={stroke} />
          </g>
        </svg>
      );

    case 'k': // King
      return (
        <svg viewBox="0 0 45 45" {...props}>
          <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            {/* Base */}
            <path d="M 12,38 L 33,38 C 33,38 34,40 32,41 L 13,41 C 11,40 12,38 12,38 Z" />
            <path d="M 13.5,38 C 13.5,34 16,33 16,30 C 16,26 15,25 15,22 C 15,19 17.5,17 17.5,15 L 27.5,15 C 27.5,19 30,19 30,22 C 30,25 29,26 29,30 C 29,33 31.5,34 31.5,38 Z" />
            {/* Collar */}
            <path d="M 15.5,33 L 29.5,33" stroke={stroke} strokeWidth="1.5" />
            {/* Crown and arches */}
            <path d="M 16.5,15 C 16.5,15 19,10 22.5,12 C 26,10 28.5,15 28.5,15 Z" />
            {/* Cross on top */}
            <path d="M 22.5,10 L 22.5,5 M 20,7.5 L 25,7.5" fill="none" stroke={stroke} strokeWidth="1.5" />
            {/* Crown center stripe */}
            <path d="M 22.5,12 L 22.5,15" stroke={stroke} strokeWidth="1.5" />
          </g>
        </svg>
      );

    default:
      return null;
  }
};

export default PieceSVG;
