// moves.js -- Étape 4 : Logique des mouvements légaux
//
// Ce fichier calcule, pour n'importe quelle pièce sur le plateau,
// la liste des cases légalement accessibles.
//
// Il ne modifie rien et n'affiche rien -- il calcule uniquement.
//
// Dépendances :
//   board.js   -- squareToIndex(), indexToSquare() (convention d'index)
//   pieces.js  -- createPiece(), initBoard() (structure des pièces)
//
// Rappel de la convention d'index :
//   index = rangée * 8 + colonne
//   index 0  = a1 (bas-gauche, côté blanc)
//   index 63 = h8 (haut-droite, côté noir)
//   Le pion blanc avance vers les index croissants (+8 par rangée).
//   Le pion noir  avance vers les index décroissants (-8 par rangée).


// ═══════════════════════════════════════════════════════════════════
// UTILITAIRES
// Petites fonctions partagées par tous les calculateurs.
// ═══════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────
// isOnBoard(index)
// Vérifie qu'un index calculé est bien entre 0 et 63.
//
// Paramètre :
//   index -- nombre entier
//
// Retourne :
//   true  si l'index est valide (0 à 63)
//   false sinon
// ─────────────────────────────────────────────
function isOnBoard(index) {
  return index >= 0 && index <= 63;
}


// ─────────────────────────────────────────────
// isEmpty(board, index)
// Vérifie qu'une case est vide (null).
//
// Paramètres :
//   board -- tableau de 64 cases
//   index -- index de la case à vérifier
//
// Retourne :
//   true  si la case est vide
//   false si elle contient une pièce
// ─────────────────────────────────────────────
function isEmpty(board, index) {
  return board[index] === null;
}


// ─────────────────────────────────────────────
// isEnemy(board, index, color)
// Vérifie qu'une case contient une pièce de la couleur adverse.
//
// Paramètres :
//   board -- tableau de 64 cases
//   index -- index de la case à vérifier
//   color -- couleur de la pièce qui veut se déplacer ('white' ou 'black')
//
// Retourne :
//   true  si la case contient une pièce ennemie
//   false si la case est vide ou contient un allié
// ─────────────────────────────────────────────
function isEnemy(board, index, color) {
  const piece = board[index];
  return piece !== null && piece.color !== color;
}


// ─────────────────────────────────────────────
// isAlly(board, index, color)
// Vérifie qu'une case contient une pièce de la même couleur.
//
// Paramètres :
//   board -- tableau de 64 cases
//   index -- index de la case à vérifier
//   color -- couleur de la pièce qui veut se déplacer ('white' ou 'black')
//
// Retourne :
//   true  si la case contient un allié
//   false si la case est vide ou contient un ennemi
// ─────────────────────────────────────────────
function isAlly(board, index, color) {
  const piece = board[index];
  return piece !== null && piece.color === color;
}


// ═══════════════════════════════════════════════════════════════════
// GLISSEMENT EN LIGNE DROITE (utilitaire interne)
//
// Les pièces qui "glissent" (tour, fou, dame) partagent le même
// mécanisme : on avance case par case dans une direction jusqu'à
// sortir du plateau ou rencontrer un obstacle.
//
// Cette fonction factorise ce mécanisme pour éviter la duplication.
// ═══════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────
// slideInDirection(board, index, color, delta, stopAtEdgeCol)
//
// Parcourt le plateau dans une direction (delta = pas en index)
// et collecte toutes les cases accessibles.
//
// Paramètres :
//   board         -- tableau de 64 cases
//   index         -- position de départ
//   color         -- couleur de la pièce qui se déplace
//   delta         -- le pas : +1 (droite), -1 (gauche), +8 (haut), -8 (bas),
//                    +9, +7, -7, -9 (diagonales)
//   stopAtEdgeCol -- (optionnel) colonne à ne pas franchir pour éviter le wrapping.
//                    Pour les déplacements horizontaux (+1 ou -1), on s'arrête
//                    si on change de colonne de manière incohérente.
//                    null = pas de vérification de colonne.
//
// Retourne :
//   tableau d'index des cases accessibles dans cette direction
// ─────────────────────────────────────────────
function slideInDirection(board, startIndex, color, delta) {
  const moves = [];
  let current = startIndex;

  while (true) {
    const prev = current;
    current = current + delta;

    // 1) Vérification : toujours sur le plateau ?
    if (!isOnBoard(current)) break;

    // 2) Vérification anti-wrapping pour les déplacements diagonaux et horizontaux.
    //
    //    Problème : le tableau 1D est continu. Si on est en h1 (index 7)
    //    et qu'on ajoute +1, on obtient l'index 8 qui est a2 -- on a "sauté"
    //    d'une rangée à l'autre en passant par le bord. C'est un wrapping interdit.
    //
    //    Règle : si le delta contient une composante horizontale (+1 ou -1),
    //    la colonne doit changer exactement de 1 (ou -1). Si elle change de 7,
    //    c'est un wrapping illégal.
    //
    //    Colonnes : 0 (a) à 7 (h)
    //    Une différence de colonne > 1 entre deux cases consécutives = wrapping.
    const prevCol = prev % 8;
    const currCol = current % 8;
    const colDiff = Math.abs(currCol - prevCol);

    // Pour tout delta avec composante horizontale (les 6 directions non purement verticales),
    // si la différence de colonne est > 1, c'est un saut de bord -- on arrête.
    if (delta !== 8 && delta !== -8) {
      if (colDiff > 1) break;
    }

    // 3) Case occupée par un allié : blocage, on s'arrête sans inclure la case.
    if (isAlly(board, current, color)) break;

    // 4) Case occupée par un ennemi : on peut capturer (case incluse) puis on s'arrête.
    if (isEnemy(board, current, color)) {
      moves.push(current);
      break;
    }

    // 5) Case vide : accessible, on continue.
    moves.push(current);
  }

  return moves;
}


// ═══════════════════════════════════════════════════════════════════
// CALCULATEURS PAR TYPE DE PIÈCE
// ═══════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────
// getKnightMoves(board, index, color)
// Calcule les mouvements légaux d'un cavalier.
//
// Le cavalier se déplace en L :
//   2 cases dans une direction + 1 case perpendiculaire.
// Il peut sauter par-dessus d'autres pièces.
//
// Les 8 destinations possibles sont exprimées comme des offsets
// (delta de rangée, delta de colonne). On convertit ensuite en delta d'index.
// ─────────────────────────────────────────────
function getKnightMoves(board, index, color) {
  const moves = [];

  // Les 8 offsets possibles du cavalier : [deltaRangée, deltaColonne]
  // Exprimé en rangées et colonnes pour pouvoir détecter le wrapping.
  const offsets = [
    [+2, +1], [+2, -1],  // 2 en haut,    1 droite/gauche
    [-2, +1], [-2, -1],  // 2 en bas,     1 droite/gauche
    [+1, +2], [+1, -2],  // 1 en haut,    2 droite/gauche
    [-1, +2], [-1, -2],  // 1 en bas,     2 droite/gauche
  ];

  // Position actuelle en rangée/colonne
  const startRow = Math.floor(index / 8); // 0 à 7
  const startCol = index % 8;             // 0 à 7

  for (const [dRow, dCol] of offsets) {
    const targetRow = startRow + dRow;
    const targetCol = startCol + dCol;

    // Vérification : la destination est-elle sur le plateau ?
    // On vérifie rangée ET colonne séparément pour éviter le wrapping.
    if (targetRow < 0 || targetRow > 7) continue;
    if (targetCol < 0 || targetCol > 7) continue;

    const targetIndex = targetRow * 8 + targetCol;

    // La destination est valide si elle est vide ou occupée par un ennemi.
    if (!isAlly(board, targetIndex, color)) {
      moves.push(targetIndex);
    }
  }

  return moves;
}


// ─────────────────────────────────────────────
// getRookMoves(board, index, color)
// Calcule les mouvements légaux d'une tour.
//
// La tour glisse dans 4 directions : haut, bas, gauche, droite.
// ─────────────────────────────────────────────
function getRookMoves(board, index, color) {
  return [
    ...slideInDirection(board, index, color, +8),  // haut (rangée +1)
    ...slideInDirection(board, index, color, -8),  // bas  (rangée -1)
    ...slideInDirection(board, index, color, +1),  // droite
    ...slideInDirection(board, index, color, -1),  // gauche
  ];
}


// ─────────────────────────────────────────────
// getBishopMoves(board, index, color)
// Calcule les mouvements légaux d'un fou.
//
// Le fou glisse dans 4 directions diagonales.
// ─────────────────────────────────────────────
function getBishopMoves(board, index, color) {
  return [
    ...slideInDirection(board, index, color, +9),  // diagonale haut-droite
    ...slideInDirection(board, index, color, +7),  // diagonale haut-gauche
    ...slideInDirection(board, index, color, -7),  // diagonale bas-droite
    ...slideInDirection(board, index, color, -9),  // diagonale bas-gauche
  ];
}


// ─────────────────────────────────────────────
// getQueenMoves(board, index, color)
// Calcule les mouvements légaux d'une dame.
//
// La dame combine les mouvements de la tour et du fou :
// elle peut se déplacer dans les 8 directions.
// On réutilise directement getRookMoves et getBishopMoves.
// ─────────────────────────────────────────────
function getQueenMoves(board, index, color) {
  return [
    ...getRookMoves(board, index, color),
    ...getBishopMoves(board, index, color),
  ];
}


// ─────────────────────────────────────────────
// getPawnMoves(board, index, color)
// Calcule les mouvements légaux d'un pion.
//
// Règles spéciales du pion :
//   - Il avance d'une case (jamais en arrière).
//   - Il peut avancer de 2 cases depuis sa rangée de départ.
//   - Il capture en diagonale (ne capture PAS vers l'avant).
//   - L'en passant et la promotion sont exclus de cette étape.
// ─────────────────────────────────────────────
function getPawnMoves(board, index, color) {
  const moves = [];

  const row = Math.floor(index / 8); // rangée actuelle (0 à 7)
  const col = index % 8;             // colonne actuelle (0 à 7)

  // Direction : le pion blanc monte (+1 rangée), le pion noir descend (-1 rangée)
  const direction = color === 'white' ? +1 : -1;

  // Rangée de départ : rangée 1 (index 8-15) pour le blanc, rangée 6 (index 48-55) pour le noir
  const startRow = color === 'white' ? 1 : 6;

  // ── Avance d'une case ──────────────────────────────────────────
  const oneStep = index + direction * 8;

  if (isOnBoard(oneStep) && isEmpty(board, oneStep)) {
    moves.push(oneStep);

    // ── Avance de deux cases (seulement depuis la rangée de départ) ──
    // Condition : on doit être sur la rangée de départ ET la case intermédiaire
    // doit être libre (déjà vérifié ci-dessus) ET la case finale aussi.
    if (row === startRow) {
      const twoSteps = index + direction * 16;

      if (isOnBoard(twoSteps) && isEmpty(board, twoSteps)) {
        moves.push(twoSteps);
      }
    }
  }

  // ── Captures diagonales ────────────────────────────────────────
  // Le pion peut capturer en diagonale gauche ou droite, mais UNIQUEMENT
  // s'il y a vraiment une pièce ennemie sur cette case.
  // On vérifie aussi que la diagonale ne franchit pas le bord du plateau.

  // Diagonale gauche (col - 1)
  if (col > 0) {
    const captureLeft = index + direction * 8 - 1;
    if (isOnBoard(captureLeft) && isEnemy(board, captureLeft, color)) {
      moves.push(captureLeft);
    }
  }

  // Diagonale droite (col + 1)
  if (col < 7) {
    const captureRight = index + direction * 8 + 1;
    if (isOnBoard(captureRight) && isEnemy(board, captureRight, color)) {
      moves.push(captureRight);
    }
  }

  return moves;
}


// ─────────────────────────────────────────────
// getKingMoves(board, index, color)
// Calcule les mouvements légaux d'un roi.
//
// Le roi se déplace d'une seule case dans n'importe laquelle
// des 8 directions. Le roque n'est pas inclus dans cette étape.
// La vérification "ne pas se mettre en échec" est aussi reportée.
// ─────────────────────────────────────────────
function getKingMoves(board, index, color) {
  const moves = [];

  const startRow = Math.floor(index / 8);
  const startCol = index % 8;

  // Les 8 directions du roi : [deltaRangée, deltaColonne]
  const directions = [
    [+1,  0],  // haut
    [-1,  0],  // bas
    [ 0, +1],  // droite
    [ 0, -1],  // gauche
    [+1, +1],  // haut-droite
    [+1, -1],  // haut-gauche
    [-1, +1],  // bas-droite
    [-1, -1],  // bas-gauche
  ];

  for (const [dRow, dCol] of directions) {
    const targetRow = startRow + dRow;
    const targetCol = startCol + dCol;

    // Vérification anti-wrapping : rangée et colonne dans les bornes
    if (targetRow < 0 || targetRow > 7) continue;
    if (targetCol < 0 || targetCol > 7) continue;

    const targetIndex = targetRow * 8 + targetCol;

    // La destination est valide si elle est vide ou occupée par un ennemi.
    if (!isAlly(board, targetIndex, color)) {
      moves.push(targetIndex);
    }
  }

  return moves;
}


// ═══════════════════════════════════════════════════════════════════
// MOUVEMENTS SPÉCIAUX
// ═══════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────
// getRawMoves(board, index, color)
// Mouvements bruts d'une pièce, sans filtrage d'échec ni mouvements spéciaux.
// Utilisé par isKingInCheck pour éviter toute récursion infinie.
// ─────────────────────────────────────────────
function getRawMoves(board, index) {
  const piece = board[index];
  if (!piece) return [];
  switch (piece.type) {
    case 'pawn':   return getPawnMoves(board, index, piece.color);
    case 'rook':   return getRookMoves(board, index, piece.color);
    case 'bishop': return getBishopMoves(board, index, piece.color);
    case 'knight': return getKnightMoves(board, index, piece.color);
    case 'queen':  return getQueenMoves(board, index, piece.color);
    case 'king':   return getKingMoves(board, index, piece.color);
    default:       return [];
  }
}


// ─────────────────────────────────────────────
// isSquareAttacked(board, squareIndex, defendingColor)
// Vérifie si une case est attaquée par l'adversaire de defendingColor.
// ─────────────────────────────────────────────
function isSquareAttacked(board, squareIndex, defendingColor) {
  const attackerColor = defendingColor === 'white' ? 'black' : 'white';
  for (let i = 0; i < 64; i++) {
    const piece = board[i];
    if (piece === null || piece.color !== attackerColor) continue;
    const rawMoves = getRawMoves(board, i, attackerColor);
    if (rawMoves.includes(squareIndex)) return true;
  }
  return false;
}


// ─────────────────────────────────────────────
// isKingInCheck(board, color)
// Retourne true si le roi de la couleur donnée est en échec.
// ─────────────────────────────────────────────
function isKingInCheck(board, color) {
  let kingIndex = -1;
  for (let i = 0; i < 64; i++) {
    const piece = board[i];
    if (piece !== null && piece.type === 'king' && piece.color === color) {
      kingIndex = i;
      break;
    }
  }
  if (kingIndex === -1) return false;
  return isSquareAttacked(board, kingIndex, color);
}


// ─────────────────────────────────────────────
// filterLegalMoves(board, index, rawMoves, color)
// Filtre les coups bruts : retire ceux qui laisseraient le roi en échec.
// Simule chaque coup sur une COPIE du plateau — le plateau réel est intact.
// ─────────────────────────────────────────────
function filterLegalMoves(board, index, rawMoves, color) {
  return rawMoves.filter(function(to) {
    const boardCopy = board.slice();
    boardCopy[to] = boardCopy[index];
    boardCopy[index] = null;
    return !isKingInCheck(boardCopy, color);
  });
}


// ─────────────────────────────────────────────
// getCastlingMoves(board, index, color, castlingRights)
// Calcule les destinations de roque disponibles pour le roi.
//
// Conditions (toutes requises) :
//   - Roi/tour n'a jamais bougé (castlingRights).
//   - Cases intermédiaires vides.
//   - Roi non en échec au départ.
//   - Roi ne traverse pas et n'arrive pas sur une case attaquée.
// ─────────────────────────────────────────────
function getCastlingMoves(board, index, color, castlingRights) {
  const moves = [];

  // Pas de roque si le roi est en échec
  if (isKingInCheck(board, color)) return moves;

  if (color === 'white') {
    // Petit roque blanc : e1(4) → g1(6), tour h1(7) → f1(5)
    if (castlingRights.whiteKingside) {
      if (isEmpty(board, 5) && isEmpty(board, 6)) {
        if (!isSquareAttacked(board, 5, color) && !isSquareAttacked(board, 6, color)) {
          moves.push(6);
        }
      }
    }
    // Grand roque blanc : e1(4) → c1(2), tour a1(0) → d1(3)
    if (castlingRights.whiteQueenside) {
      if (isEmpty(board, 1) && isEmpty(board, 2) && isEmpty(board, 3)) {
        if (!isSquareAttacked(board, 3, color) && !isSquareAttacked(board, 2, color)) {
          moves.push(2);
        }
      }
    }
  } else {
    // Petit roque noir : e8(60) → g8(62), tour h8(63) → f8(61)
    if (castlingRights.blackKingside) {
      if (isEmpty(board, 61) && isEmpty(board, 62)) {
        if (!isSquareAttacked(board, 61, color) && !isSquareAttacked(board, 62, color)) {
          moves.push(62);
        }
      }
    }
    // Grand roque noir : e8(60) → c8(58), tour a8(56) → d8(59)
    if (castlingRights.blackQueenside) {
      if (isEmpty(board, 57) && isEmpty(board, 58) && isEmpty(board, 59)) {
        if (!isSquareAttacked(board, 59, color) && !isSquareAttacked(board, 58, color)) {
          moves.push(58);
        }
      }
    }
  }

  return moves;
}


// ─────────────────────────────────────────────
// getEnPassantMove(board, index, color, enPassantTarget)
// Retourne la case de capture en passant si disponible pour ce pion, ou null.
// ─────────────────────────────────────────────
function getEnPassantMove(board, index, color, enPassantTarget) {
  if (enPassantTarget === null || enPassantTarget === undefined) return null;

  const col = index % 8;
  const direction = color === 'white' ? +1 : -1;
  const myRow = Math.floor(index / 8);
  const targetRow = Math.floor(enPassantTarget / 8);
  const targetCol = enPassantTarget % 8;

  // La case cible doit être sur la rangée directement devant ce pion
  if (targetRow !== myRow + direction) return null;
  // Et sur une colonne adjacente
  if (Math.abs(targetCol - col) !== 1) return null;

  return enPassantTarget;
}


// ═══════════════════════════════════════════════════════════════════
// ÉTAT DE LA PARTIE
// ═══════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────
// hasAnyLegalMove(board, color, castlingRights, enPassantTarget)
// Retourne true si le joueur a au moins un coup légal.
// ─────────────────────────────────────────────
function hasAnyLegalMove(board, color, castlingRights, enPassantTarget) {
  for (let i = 0; i < 64; i++) {
    const piece = board[i];
    if (piece === null || piece.color !== color) continue;
    const moves = getLegalMoves(board, i, castlingRights, enPassantTarget);
    if (moves.length > 0) return true;
  }
  return false;
}


// ─────────────────────────────────────────────
// getGameStatus(board, color, castlingRights, enPassantTarget)
// Retourne l'état de la partie du point de vue du joueur color :
//   'playing'   -- la partie continue
//   'check'     -- en échec mais des coups existent
//   'checkmate' -- échec et mat
//   'stalemate' -- pat
// ─────────────────────────────────────────────
function getGameStatus(board, color, castlingRights, enPassantTarget) {
  const inCheck = isKingInCheck(board, color);
  const hasMove = hasAnyLegalMove(board, color, castlingRights, enPassantTarget);

  if (hasMove) return inCheck ? 'check' : 'playing';
  return inCheck ? 'checkmate' : 'stalemate';
}


// ═══════════════════════════════════════════════════════════════════
// POINT D'ENTRÉE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────
// getLegalMoves(board, index, castlingRights, enPassantTarget)
// Retourne la liste des cases légalement accessibles.
// Inclut le filtrage d'échec et les mouvements spéciaux.
//
// Paramètres :
//   board           -- tableau de 64 cases
//   index           -- index de la pièce (0 à 63)
//   castlingRights  -- (optionnel) objet droits de roque
//   enPassantTarget -- (optionnel) index cible en passant ou null
// ─────────────────────────────────────────────
function getLegalMoves(board, index, castlingRights, enPassantTarget) {
  if (!isOnBoard(index)) return [];
  const piece = board[index];
  if (piece === null) return [];

  const color = piece.color;

  // 1. Mouvements bruts selon le type
  let rawMoves;
  switch (piece.type) {
    case 'pawn':   rawMoves = getPawnMoves(board, index, color);   break;
    case 'rook':   rawMoves = getRookMoves(board, index, color);   break;
    case 'bishop': rawMoves = getBishopMoves(board, index, color); break;
    case 'knight': rawMoves = getKnightMoves(board, index, color); break;
    case 'queen':  rawMoves = getQueenMoves(board, index, color);  break;
    case 'king':   rawMoves = getKingMoves(board, index, color);   break;
    default:       rawMoves = [];
  }

  // 2. Mouvements spéciaux
  if (piece.type === 'king' && castlingRights) {
    rawMoves = rawMoves.concat(getCastlingMoves(board, index, color, castlingRights));
  }
  if (piece.type === 'pawn' && enPassantTarget != null) {
    const epMove = getEnPassantMove(board, index, color, enPassantTarget);
    if (epMove !== null) rawMoves.push(epMove);
  }

  // 3. Filtrage des coups illégaux (laisseraient le roi en échec)
  return filterLegalMoves(board, index, rawMoves, color);
}
