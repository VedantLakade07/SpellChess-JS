// Chess logic with custom spell mechanics for Spell Chess Online (ES Module Version)

export const createInitialBoard = () => {
  const backRank = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
  const board = [];

  // Row 0: Black back rank
  board.push(backRank.map(type => ({ type, color: 'b', frozenTurns: 0, hasMoved: false })));

  // Row 1: Black pawns
  board.push(Array(8).fill(null).map(() => ({ type: 'p', color: 'b', frozenTurns: 0, hasMoved: false })));

  // Rows 2-5: empty
  for (let i = 0; i < 4; i++) {
    board.push(Array(8).fill(null));
  }

  // Row 6: White pawns
  board.push(Array(8).fill(null).map(() => ({ type: 'p', color: 'w', frozenTurns: 0, hasMoved: false })));

  // Row 7: White back rank
  board.push(backRank.map(type => ({ type, color: 'w', frozenTurns: 0, hasMoved: false })));

  return board;
};

export const createInitialGameState = () => ({
  board: createInitialBoard(),
  turn: 'w', // 'w' or 'b'
  spells: {
    w: { freeze: 1, double_move: 1, move_changer: 1 },
    b: { freeze: 1, double_move: 1, move_changer: 1 }
  },
  activeSpells: {
    w: { doubleMove: false, moveChanger: false },
    b: { doubleMove: false, moveChanger: false }
  },
  doubleMoveStep: 0, // 0 = normal, 1 = completed 1st move of double move, waiting for 2nd
  lastMove: null, // { from: {r, c}, to: {r, c}, piece }
  winner: null,
  status: 'active' // 'active', 'checkmate', 'draw', 'stalemate'
});

export const cloneBoard = (board) => {
  return board.map(row =>
    row.map(cell => (cell ? { ...cell } : null))
  );
};

export const cloneGameState = (state) => {
  return {
    board: cloneBoard(state.board),
    turn: state.turn,
    spells: {
      w: { ...state.spells.w },
      b: { ...state.spells.b }
    },
    activeSpells: {
      w: { ...state.activeSpells.w },
      b: { ...state.activeSpells.b }
    },
    doubleMoveStep: state.doubleMoveStep,
    lastMove: state.lastMove ? { ...state.lastMove } : null,
    winner: state.winner,
    status: state.status
  };
};

const inBounds = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;

export const getRawMoves = (board, r, c, activeSpells = {}) => {
  const piece = board[r][c];
  if (!piece) return [];
  if (piece.frozenTurns > 0) return []; // Frozen pieces cannot move

  const color = piece.color;
  const moves = [];

  const isMoveChangerActive = activeSpells[color]?.moveChanger;

  if (piece.type === 'b' && isMoveChangerActive) {
    // Bishop moves like a King (1 square in any direction)
    const offsets = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];
    for (const [dr, dc] of offsets) {
      const nr = r + dr;
      const nc = c + dc;
      if (inBounds(nr, nc)) {
        const dest = board[nr][nc];
        if (!dest || dest.color !== color) {
          moves.push({ r: nr, c: nc });
        }
      }
    }
    return moves;
  }

  if (piece.type === 'q' && isMoveChangerActive) {
    // Queen moves like a Knight (horse L-shape)
    const offsets = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2],  [1, 2],  [2, -1],  [2, 1]
    ];
    for (const [dr, dc] of offsets) {
      const nr = r + dr;
      const nc = c + dc;
      if (inBounds(nr, nc)) {
        const dest = board[nr][nc];
        if (!dest || dest.color !== color) {
          moves.push({ r: nr, c: nc });
        }
      }
    }
    return moves;
  }

  switch (piece.type) {
    case 'p': {
      const dir = color === 'w' ? -1 : 1;
      const startRow = color === 'w' ? 6 : 1;

      // Single step forward
      const nr = r + dir;
      if (inBounds(nr, c) && !board[nr][c]) {
        moves.push({ r: nr, c });

        // Double step forward
        const nnr = r + 2 * dir;
        if (r === startRow && inBounds(nnr, c) && !board[nnr][c]) {
          moves.push({ r: nnr, c });
        }
      }

      // Diagonal captures
      const captureCols = [c - 1, c + 1];
      for (const nc of captureCols) {
        if (inBounds(nr, nc)) {
          const dest = board[nr][nc];
          if (dest && dest.color !== color) {
            moves.push({ r: nr, c: nc });
          }
        }
      }
      break;
    }

    case 'n': {
      const offsets = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2],  [1, 2],  [2, -1],  [2, 1]
      ];
      for (const [dr, dc] of offsets) {
        const nr = r + dr;
        const nc = c + dc;
        if (inBounds(nr, nc)) {
          const dest = board[nr][nc];
          if (!dest || dest.color !== color) {
            moves.push({ r: nr, c: nc });
          }
        }
      }
      break;
    }

    case 'b': {
      const dirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
      for (const [dr, dc] of dirs) {
        let nr = r + dr;
        let nc = c + dc;
        while (inBounds(nr, nc)) {
          const dest = board[nr][nc];
          if (!dest) {
            moves.push({ r: nr, c: nc });
          } else {
            if (dest.color !== color) {
              moves.push({ r: nr, c: nc });
            }
            break;
          }
          nr += dr;
          nc += dc;
        }
      }
      break;
    }

    case 'r': {
      const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      for (const [dr, dc] of dirs) {
        let nr = r + dr;
        let nc = c + dc;
        while (inBounds(nr, nc)) {
          const dest = board[nr][nc];
          if (!dest) {
            moves.push({ r: nr, c: nc });
          } else {
            if (dest.color !== color) {
              moves.push({ r: nr, c: nc });
            }
            break;
          }
          nr += dr;
          nc += dc;
        }
      }
      break;
    }

    case 'q': {
      const dirs = [
        [-1, -1], [-1, 1], [1, -1], [1, 1],
        [-1, 0],  [1, 0],  [0, -1], [0, 1]
      ];
      for (const [dr, dc] of dirs) {
        let nr = r + dr;
        let nc = c + dc;
        while (inBounds(nr, nc)) {
          const dest = board[nr][nc];
          if (!dest) {
            moves.push({ r: nr, c: nc });
          } else {
            if (dest.color !== color) {
              moves.push({ r: nr, c: nc });
            }
            break;
          }
          nr += dr;
          nc += dc;
        }
      }
      break;
    }

    case 'k': {
      const offsets = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1]
      ];
      for (const [dr, dc] of offsets) {
        const nr = r + dr;
        const nc = c + dc;
        if (inBounds(nr, nc)) {
          const dest = board[nr][nc];
          if (!dest || dest.color !== color) {
            moves.push({ r: nr, c: nc });
          }
        }
      }

      // Castling logic (simplified check)
      if (!piece.hasMoved) {
        const row = r;
        const rookKing = board[row][7];
        if (rookKing && rookKing.type === 'r' && !rookKing.hasMoved && !board[row][5] && !board[row][6]) {
          moves.push({ r: row, c: 6, isCastle: true, rookFrom: { r: row, c: 7 }, rookTo: { r: row, c: 5 } });
        }
        const rookQueen = board[row][0];
        if (rookQueen && rookQueen.type === 'r' && !rookQueen.hasMoved && !board[row][1] && !board[row][2] && !board[row][3]) {
          moves.push({ r: row, c: 2, isCastle: true, rookFrom: { r: row, c: 0 }, rookTo: { r: row, c: 3 } });
        }
      }
      break;
    }
  }

  return moves;
};

export const isKingInCheck = (board, color, activeSpells = {}) => {
  let kingPos = null;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.type === 'k' && piece.color === color) {
        kingPos = { r, c };
        break;
      }
    }
    if (kingPos) break;
  }

  if (!kingPos) return false;

  const opponentColor = color === 'w' ? 'b' : 'w';

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.color === opponentColor) {
        const moves = getRawMoves(board, r, c, activeSpells);
        const canAttack = moves.some(m => m.r === kingPos.r && m.c === kingPos.c);
        if (canAttack) return true;
      }
    }
  }

  return false;
};

export const getLegalMoves = (state, r, c) => {
  const piece = state.board[r][c];
  if (!piece || piece.color !== state.turn) return [];

  const rawMoves = getRawMoves(state.board, r, c, state.activeSpells);
  const legalMoves = [];

  for (const move of rawMoves) {
    const tempBoard = cloneBoard(state.board);
    const movingPiece = tempBoard[r][c];

    tempBoard[move.r][move.c] = { ...movingPiece, hasMoved: true };
    tempBoard[r][c] = null;

    if (move.isCastle) {
      const rook = tempBoard[move.rookFrom.r][move.rookFrom.c];
      tempBoard[move.rookTo.r][move.rookTo.c] = { ...rook, hasMoved: true };
      tempBoard[move.rookFrom.r][move.rookFrom.c] = null;
    }

    if (!isKingInCheck(tempBoard, state.turn, state.activeSpells)) {
      legalMoves.push(move);
    }
  }

  return legalMoves;
};

export const hasAnyLegalMoves = (state, color) => {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = state.board[r][c];
      if (piece && piece.color === color) {
        const moves = getLegalMoves(state, r, c);
        if (moves.length > 0) return true;
      }
    }
  }
  return false;
};

export const makeMove = (state, from, to) => {
  const piece = state.board[from.r][from.c];
  if (!piece || piece.color !== state.turn) return false;

  const legalMoves = getLegalMoves(state, from.r, from.c);
  const matchedMove = legalMoves.find(m => m.r === to.r && m.c === to.c);

  if (!matchedMove) return false;

  if (state.activeSpells[state.turn]?.moveChanger && (piece.type === 'b' || piece.type === 'q')) {
    state.activeSpells[state.turn].moveChanger = false;
  }

  // Check for King capture (king is dead)
  const destPiece = state.board[to.r][to.c];
  if (destPiece && destPiece.type === 'k') {
    state.board[to.r][to.c] = { ...piece, hasMoved: true };
    state.board[from.r][from.c] = null;
    state.winner = state.turn;
    state.status = 'checkmate';
    state.lastMove = { from, to, piece };
    return true;
  }

  state.board[to.r][to.c] = { ...piece, hasMoved: true };
  state.board[from.r][from.c] = null;

  if (matchedMove.isCastle) {
    const rook = state.board[matchedMove.rookFrom.r][matchedMove.rookFrom.c];
    state.board[matchedMove.rookTo.r][matchedMove.rookTo.c] = { ...rook, hasMoved: true };
    state.board[matchedMove.rookFrom.r][matchedMove.rookFrom.c] = null;
  }

  if (piece.type === 'p' && (to.r === 0 || to.r === 7)) {
    state.board[to.r][to.c].type = 'q';
  }

  state.lastMove = { from, to, piece };

  if (state.activeSpells[state.turn].doubleMove && state.doubleMoveStep === 0) {
    state.doubleMoveStep = 1;
    state.activeSpells[state.turn].doubleMove = false;
  } else {
    state.doubleMoveStep = 0;
    
    const nextTurn = state.turn === 'w' ? 'b' : 'w';
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = state.board[r][c];
        if (p && p.color === nextTurn && p.frozenTurns > 0) {
          p.frozenTurns--;
        }
      }
    }

    state.turn = nextTurn;
  }

  const nextPlayer = state.turn;
  const inCheck = isKingInCheck(state.board, nextPlayer, state.activeSpells);
  const movesAvailable = hasAnyLegalMoves(state, nextPlayer);

  if (!movesAvailable) {
    if (inCheck) {
      state.winner = state.turn === 'w' ? 'b' : 'w';
      state.status = 'checkmate';
    } else {
      state.status = 'stalemate';
    }
  }

  return true;
};

export const castSpell = (state, spellId, targetPos = null) => {
  const player = state.turn;

  if (!state.spells[player][spellId] || state.spells[player][spellId] <= 0) {
    return { success: false, error: 'No charges remaining for this spell' };
  }

  if (state.doubleMoveStep === 1) {
    return { success: false, error: 'Cannot cast spells during a double move' };
  }

  switch (spellId) {
    case 'freeze': {
      if (!targetPos) return { success: false, error: 'Freeze requires a target piece' };
      const piece = state.board[targetPos.r][targetPos.c];
      if (!piece) return { success: false, error: 'No piece at target location' };
      if (piece.color === player) return { success: false, error: 'Cannot freeze your own piece' };

      piece.frozenTurns = 2;
      state.spells[player].freeze = 0;
      return { success: true };
    }

    case 'double_move': {
      state.activeSpells[player].doubleMove = true;
      state.doubleMoveStep = 0;
      state.spells[player].double_move = 0;
      return { success: true };
    }

    case 'move_changer': {
      state.activeSpells[player].moveChanger = true;
      state.spells[player].move_changer = 0;
      return { success: true };
    }

    default:
      return { success: false, error: 'Unknown spell ID' };
  }
};
