// pieces.js -- Étape 2 : Les pièces et la position de départ
//
// Ce fichier définit :
//   1. createPiece(type, color)  -- fabrique un objet pièce
//   2. initBoard(board)          -- place les 32 pièces en position de départ
//
// Une pièce est un objet JavaScript :
//   { type: 'pawn', color: 'white' }
//
// Types valides  : 'king', 'queen', 'rook', 'bishop', 'knight', 'pawn'
// Couleurs valides : 'white', 'black'


// ─────────────────────────────────────────────
// createPiece(type, color)
// Crée et retourne un objet représentant une pièce d'échecs.
//
// Paramètres :
//   type  -- chaîne : 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn'
//   color -- chaîne : 'white' | 'black'
//
// Retourne :
//   un objet  { type, color }
// ─────────────────────────────────────────────
function createPiece(type, color) {
  return { type, color };
  // Note : { type, color } est une écriture courte pour { type: type, color: color }
  // C'est du JavaScript moderne -- quand la clé et la variable ont le même nom,
  // on peut écrire juste le nom une seule fois.
}


// ─────────────────────────────────────────────
// initBoard(board)
// Remplit le tableau board[] avec les 32 pièces aux positions de départ.
//
// Position de départ standard :
//   Rangée 1 (index  0-7 ) : pièces blanches  (tour, cavalier, fou, dame, roi, fou, cavalier, tour)
//   Rangée 2 (index  8-15) : 8 pions blancs
//   Rangées 3 à 6           : vides (null)
//   Rangée 7 (index 48-55) : 8 pions noirs
//   Rangée 8 (index 56-63) : pièces noires (même ordre que rangée 1)
//
// Paramètre :
//   board -- le tableau de 64 cases (créé dans board.js)
//
// Ne retourne rien -- modifie directement le tableau passé en paramètre.
// ─────────────────────────────────────────────
function initBoard(board) {

  // --- Ordre des pièces sur la rangée de départ (colonnes a à h) ---
  // C'est un tableau qui sert de "modèle" pour les rangées 1 et 8.
  const backRank = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
  //                  a        b         c        d       e        f         g         h

  // --- Rangée 1 : pièces blanches (index 0 à 7) ---
  for (let col = 0; col < 8; col++) {
    board[col] = createPiece(backRank[col], 'white');
  }

  // --- Rangée 2 : pions blancs (index 8 à 15) ---
  for (let col = 0; col < 8; col++) {
    board[8 + col] = createPiece('pawn', 'white');
  }

  // --- Rangées 3 à 6 : cases vides (index 16 à 47) ---
  // Ces cases sont déjà null si board a été créé avec .fill(null),
  // mais on les remet explicitement au cas où initBoard() serait rappelée.
  for (let i = 16; i <= 47; i++) {
    board[i] = null;
  }

  // --- Rangée 7 : pions noirs (index 48 à 55) ---
  for (let col = 0; col < 8; col++) {
    board[48 + col] = createPiece('pawn', 'black');
  }

  // --- Rangée 8 : pièces noires (index 56 à 63) ---
  for (let col = 0; col < 8; col++) {
    board[56 + col] = createPiece(backRank[col], 'black');
  }
}


// ─────────────────────────────────────────────
// getPieceAt(board, square)
// Retourne la pièce sur une case donnée, ou null si la case est vide.
//
// Paramètres :
//   board  -- le tableau de 64 cases
//   square -- notation algébrique, ex: 'e1', 'a8'
//
// Retourne :
//   un objet pièce { type, color } ou null
// ─────────────────────────────────────────────
function getPieceAt(board, square) {
  const index = squareToIndex(square); // squareToIndex est définie dans board.js
  if (index === -1) return null;
  return board[index];
}
