// ai.js — IA Adversaire Niveau 2 (Greedy Bot)
//
// Responsabilité : choisir le meilleur coup pour les Noirs.
//
// Dépendances :
//   moves.js → getLegalMoves(), isKingInCheck()
//   pieces.js → (structure des pièces)


// ═══════════════════════════════════════════════════════════════════
// TABLE DES VALEURS DES PIÈCES
// ═══════════════════════════════════════════════════════════════════

// Valeurs standard aux échecs.
// Le roi a une valeur très élevée pour éviter tout échange.
const PIECE_VALUES = {
  pawn:   1,
  knight: 3,
  bishop: 3,
  rook:   5,
  queen:  9,
  king:   1000,
};


// ═══════════════════════════════════════════════════════════════════
// FONCTIONS D'AIDE
// ═══════════════════════════════════════════════════════════════════

// ───────────────────────────────────────────────────────────────────
// getAllLegalMoves(board, color, castlingRights, enPassantTarget)
//
// Retourne TOUS les coups légaux disponibles pour une couleur donnée.
//
// Paramètres :
//   board             -- tableau de 64 cases
//   color             -- 'white' ou 'black'
//   castlingRights    -- objet { whiteKingside, whiteQueenside, blackKingside, blackQueenside }
//   enPassantTarget   -- index de la case en passant, ou null
//
// Retour :
//   Tableau d'objets { from: index, to: index }
// ───────────────────────────────────────────────────────────────────
function getAllLegalMoves(board, color, castlingRights, enPassantTarget) {
  const moves = [];

  // Parcourir toutes les cases du plateau
  for (let index = 0; index < 64; index++) {
    const piece = board[index];

    // Ignorer les cases vides ou les pièces adverses
    if (!piece || piece.color !== color) continue;

    // Obtenir les coups légaux pour cette pièce
    const legalMoves = getLegalMoves(board, index, castlingRights, enPassantTarget);

    // Ajouter chaque coup légal au tableau
    for (const targetIndex of legalMoves) {
      moves.push({
        from: index,
        to: targetIndex
      });
    }
  }

  return moves;
}


// ───────────────────────────────────────────────────────────────────
// evaluateMove(board, move, color)
//
// Calcule le gain net d'un coup.
//
// Stratégie d'évaluation :
//   1. Gain immédiat : valeur de la pièce capturée (0 si case vide)
//   2. Risque : si la pièce qui capture peut être reprise, soustraire sa valeur
//
// Paramètres :
//   board -- tableau de 64 cases (état AVANT le coup)
//   move  -- objet { from: index, to: index }
//   color -- couleur de l'IA ('black' normalement)
//
// Retour :
//   Nombre (gain net, peut être négatif)
// ───────────────────────────────────────────────────────────────────
function evaluateMove(board, move, color) {
  const movingPiece = board[move.from];
  const targetPiece = board[move.to];

  // Gain immédiat : valeur de la pièce capturée
  let score = targetPiece ? PIECE_VALUES[targetPiece.type] : 0;

  // Risque : simulation rapide pour vérifier si la pièce peut être reprise
  // On simule le coup, puis on vérifie si un adversaire peut capturer la case d'arrivée
  const simulatedBoard = board.slice();
  simulatedBoard[move.to] = movingPiece;
  simulatedBoard[move.from] = null;

  const opponentColor = color === 'white' ? 'black' : 'white';

  // Vérifier si un adversaire peut capturer la case d'arrivée
  for (let index = 0; index < 64; index++) {
    const piece = simulatedBoard[index];
    if (!piece || piece.color !== opponentColor) continue;

    // Obtenir les coups légaux de cette pièce adverse
    const opponentMoves = getLegalMoves(simulatedBoard, index, null, null);

    // Si l'adversaire peut capturer notre pièce
    if (opponentMoves.includes(move.to)) {
      // Soustraire la valeur de notre pièce
      score -= PIECE_VALUES[movingPiece.type];
      break; // Un seul adversaire suffit à créer le risque
    }
  }

  return score;
}


// ───────────────────────────────────────────────────────────────────
// getBestMove(board, color, castlingRights, enPassantTarget)
//
// Point d'entrée principal de l'IA.
//
// 1. Liste tous les coups légaux
// 2. Évalue chaque coup
// 3. Retourne le coup avec le meilleur score
// 4. En cas d'égalité, choisit au hasard parmi les meilleurs
//
// Paramètres :
//   board             -- tableau de 64 cases
//   color             -- 'white' ou 'black'
//   castlingRights    -- objet des droits de roque
//   enPassantTarget   -- index en passant ou null
//
// Retour :
//   Objet { from, to } ou null si aucun coup disponible
// ───────────────────────────────────────────────────────────────────
function getBestMove(board, color, castlingRights, enPassantTarget) {
  // 1. Obtenir tous les coups légaux
  const allMoves = getAllLegalMoves(board, color, castlingRights, enPassantTarget);

  // Aucun coup disponible → partie terminée
  if (allMoves.length === 0) {
    return null;
  }

  // 2. Évaluer chaque coup
  const movesWithScores = allMoves.map(function(move) {
    return {
      move: move,
      score: evaluateMove(board, move, color)
    };
  });

  // 3. Trouver le score maximum
  let maxScore = -Infinity;
  for (let i = 0; i < movesWithScores.length; i++) {
    if (movesWithScores[i].score > maxScore) {
      maxScore = movesWithScores[i].score;
    }
  }

  // 4. Récupérer tous les coups ayant le score maximum
  const bestMoves = [];
  for (let i = 0; i < movesWithScores.length; i++) {
    if (movesWithScores[i].score === maxScore) {
      bestMoves.push(movesWithScores[i].move);
    }
  }

  // 5. Choisir au hasard parmi les meilleurs (évite que l'IA joue toujours pareil)
  const randomIndex = Math.floor(Math.random() * bestMoves.length);
  return bestMoves[randomIndex];
}
