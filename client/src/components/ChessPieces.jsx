import React from 'react';

// Re-designed Chess Pieces (Futuristic Geometric Vector Outlines with Crisp Glassmorphic Gradient Fills)
const ChessDefs = ({ color }) => {
  const isWhite = color === 'w';
  return (
    <defs>
      {/* Premium glossy gradient for piece bodies */}
      <linearGradient id={`grad-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={isWhite ? '#ffffff' : '#1f2833'} stopOpacity={isWhite ? "0.2" : "0.75"} />
        <stop offset="50%" stopColor={isWhite ? '#e2fcfb' : '#151c27'} stopOpacity={isWhite ? "0.15" : "0.8"} />
        <stop offset="100%" stopColor={isWhite ? '#66fcf1' : '#0b0c10'} stopOpacity={isWhite ? "0.2" : "0.9"} />
      </linearGradient>
      {/* Soft inner energy core gradient */}
      <radialGradient id={`core-${color}`} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor={isWhite ? '#66fcf1' : '#45a29e'} stopOpacity="0.3" />
        <stop offset="100%" stopColor={isWhite ? '#66fcf1' : '#45a29e'} stopOpacity="0" />
      </radialGradient>
    </defs>
  );
};

const PieceSVG = ({ type, color, ...props }) => {
  const fill = `url(#grad-${color})`;
  const stroke = color === 'w' ? '#66fcf1' : '#45a29e';
  const coreFill = `url(#core-${color})`;

  switch (type) {
    case 'p': // Pawn (Shield & Energy Sphere)
      return (
        <svg viewBox="0 0 45 45" {...props}>
          <ChessDefs color={color} />
          <g stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            {/* Base */}
            <path d="M 12,38 L 33,38 C 33,38 35,39 33,41 L 12,41 Z" fill={fill} />
            <path d="M 14,38 L 14,35 L 31,35 L 31,38 Z" fill={fill} />
            {/* Body Construct */}
            <path d="M 15,35 L 18,22 C 18,22 13,19 18,14 L 27,14 C 32,19 27,22 27,22 L 30,35 Z" fill={fill} />
            {/* Energy Core */}
            <circle cx="22.5" cy="23" r="5" fill={coreFill} stroke="none" />
            <line x1="22.5" y1="18" x2="22.5" y2="28" stroke={stroke} strokeWidth="1.2" />
            {/* Head */}
            <circle cx="22.5" cy="10" r="4.5" fill={fill} />
          </g>
        </svg>
      );

    case 'r': // Rook (Castellated Energy Prism)
      return (
        <svg viewBox="0 0 45 45" {...props}>
          <ChessDefs color={color} />
          <g stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            {/* Base */}
            <path d="M 11,39 L 34,39 C 34,39 36,40 34,42 L 11,42 Z" fill={fill} />
            <path d="M 13,39 L 13,35 L 32,35 L 32,39 Z" fill={fill} />
            {/* Tower Body */}
            <path d="M 14,35 L 17,19 L 28,19 L 31,35 Z" fill={fill} />
            {/* Core Circuit Lines */}
            <path d="M 22.5,19 L 22.5,35 M 17,27 L 28,27" fill="none" stroke={stroke} strokeWidth="1.2" />
            {/* Top Battlements */}
            <path d="M 14,19 L 31,19 L 31,13 L 27.5,13 L 27.5,16 L 24.5,16 L 24.5,13 L 20.5,13 L 20.5,16 L 17.5,16 L 17.5,13 L 14,13 Z" fill={fill} />
          </g>
        </svg>
      );

    case 'n': // Knight (Cyber Horse Construct)
      return (
        <svg viewBox="0 0 45 45" {...props}>
          <ChessDefs color={color} />
          <g stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            {/* Base */}
            <path d="M 12,39 L 33,39 C 33,39 35,40 33,42 L 12,42 Z" fill={fill} />
            <path d="M 14,39 L 15,35 L 30,35 Z" fill={fill} />
            {/* Geometric Cyber Horse Outline */}
            <path d="M 30,35 C 30,30 28.5,27 26.5,25 C 28.5,23 30,20 30,17 C 30,11 25,10 22.5,10 C 20,10 18,12 17,14 L 14.5,15.5 C 13,16.5 13,18 14.5,19.5 L 17,21 C 15,22.5 13.5,25.5 13.5,29 C 13.5,32.5 16,35 16,35 Z" fill={fill} />
            {/* Eye (Glowing Jewel) */}
            <circle cx="24.5" cy="15.5" r="1.5" fill={stroke} stroke="none" />
            {/* Tech details (Mane circuit) */}
            <path d="M 21.5,17.5 L 20.5,21.5 L 22.5,25.5" fill="none" stroke={stroke} strokeWidth="1.2" />
          </g>
        </svg>
      );

    case 'b': // Bishop (Energy Mitre / Relic)
      return (
        <svg viewBox="0 0 45 45" {...props}>
          <ChessDefs color={color} />
          <g stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            {/* Base */}
            <path d="M 12,39 L 33,39 C 33,39 35,40 33,42 L 12,42 Z" fill={fill} />
            <path d="M 14,39 L 14,35 L 31,35 L 31,39 Z" fill={fill} />
            {/* Hexagonal Mitre Body */}
            <path d="M 17,35 C 15,31 15,24 18,20 C 16.5,19 16,18 16,16.5 C 16,14 18.5,11.5 22.5,11.5 C 26.5,11.5 29,14 29,16.5 C 29,18 28.5,19 27,20 C 30,24 30,31 28,35 Z" fill={fill} />
            {/* Glowing Core Slit */}
            <line x1="22.5" y1="16" x2="22.5" y2="30" stroke={stroke} strokeWidth="1.5" />
            {/* Relic Cross */}
            <path d="M 22.5,11.5 L 22.5,8 M 20.5,9.5 L 24.5,9.5" fill="none" stroke={stroke} strokeWidth="1.5" />
          </g>
        </svg>
      );

    case 'q': // Queen (Radiant Coronet Construct)
      return (
        <svg viewBox="0 0 45 45" {...props}>
          <ChessDefs color={color} />
          <g stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            {/* Base */}
            <path d="M 11,40 L 34,40 C 34,40 36,41 34,43 L 11,43 Z" fill={fill} />
            <path d="M 13,40 C 13,35 15.5,34 15.5,31 C 15.5,27 14.5,26 14.5,23 L 30.5,23 C 30.5,26 29.5,27 29.5,31 C 29.5,34 32,35 32,40 Z" fill={fill} />
            <path d="M 15,34 L 30,34" stroke={stroke} strokeWidth="1.5" fill="none" />
            {/* Crown Spikes */}
            <path d="M 15,23 L 12.5,13 L 18,18.5 L 22.5,10.5 L 27,18.5 L 32.5,13 L 30,23 Z" fill={fill} />
            {/* Crown Jewel Spheres */}
            <circle cx="12.5" cy="13" r="1.5" fill={stroke} stroke="none" />
            <circle cx="18" cy="18.5" r="1.5" fill={stroke} stroke="none" />
            <circle cx="22.5" cy="10.5" r="1.5" fill={stroke} stroke="none" />
            <circle cx="27" cy="18.5" r="1.5" fill={stroke} stroke="none" />
            <circle cx="32.5" cy="13" r="1.5" fill={stroke} stroke="none" />
          </g>
        </svg>
      );

    case 'k': // King (High-Tech Monolith)
      return (
        <svg viewBox="0 0 45 45" {...props}>
          <ChessDefs color={color} />
          <g stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            {/* Base */}
            <path d="M 11,40 L 34,40 C 34,40 36,41 34,43 L 11,43 Z" fill={fill} />
            <path d="M 13,40 C 13,35 15.5,34 15.5,31 L 29.5,31 C 29.5,34 32,35 32,40 Z" fill={fill} />
            <path d="M 15,34 L 30,34" stroke={stroke} strokeWidth="1.5" fill="none" />
            {/* Monolith Body */}
            <path d="M 15.5,31 C 15.5,31 17.5,17 22.5,14.5 C 27.5,17 29.5,31 29.5,31 Z" fill={fill} />
            {/* Internal Circuit Core */}
            <path d="M 22.5,14.5 L 22.5,31" stroke={stroke} strokeWidth="1.5" fill="none" />
            <circle cx="22.5" cy="22.5" r="4.5" fill={coreFill} stroke={stroke} strokeWidth="1.2" />
            {/* High-Tech Cross */}
            <path d="M 22.5,11 L 22.5,5 M 19,8 L 26,8" fill="none" stroke={stroke} strokeWidth="1.8" />
          </g>
        </svg>
      );

    default:
      return null;
  }
};

export default PieceSVG;
