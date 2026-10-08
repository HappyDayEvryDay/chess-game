// board.js -- Étape 1 : Le plateau d'échecs
// Représentation en tableau 1D de 64 cases (index 0 à 63)
//
// Convention de numérotation :
//   index 0  = a1 (coin bas-gauche, côté blanc)
//   index 7  = h1
//   index 56 = a8 (coin haut-gauche, côté noir)
//   index 63 = h8
//
// Formule : index = (rangée - 1) * 8 + (colonne - 1)
//   avec colonne : a=0, b=1, c=2, ..., h=7
//   avec rangée  : 1 à 8

// ─────────────────────────────────────────────
// createBoard()
// Crée et retourne un nouveau plateau vide de 64 cases.
// null signifie "case vide" -- plus tard ce sera un objet pièce.
//
// Utilisation :
//   const board = createBoard();
// ─────────────────────────────────────────────
function createBoard() {
  return new Array(64).fill(null);
}


// ─────────────────────────────────────────────
// squareToIndex(square)
// Convertit une notation algébrique ('e4') en index (28)
//
// Paramètre :
//   square -- chaîne de 2 caractères, ex: 'a1', 'h8', 'e4'
//
// Retourne :
//   un nombre entre 0 et 63
//   ou -1 si la notation est invalide
// ─────────────────────────────────────────────
function squareToIndex(square) {
  if (typeof square !== 'string' || square.length !== 2) return -1;

  const col = square[0].toLowerCase().charCodeAt(0) - 'a'.charCodeAt(0); // a=0, b=1, ..., h=7
  const row = parseInt(square[1]) - 1; // '1'->0, '2'->1, ..., '8'->7

  if (col < 0 || col > 7 || row < 0 || row > 7) return -1;

  return row * 8 + col;
}


// ─────────────────────────────────────────────
// indexToSquare(index)
// Convertit un index (28) en notation algébrique ('e4')
//
// Paramètre :
//   index -- nombre entre 0 et 63
//
// Retourne :
//   une chaîne comme 'e4'
//   ou null si l'index est invalide
// ─────────────────────────────────────────────
function indexToSquare(index) {
  if (typeof index !== 'number' || index < 0 || index > 63) return null;

  const col = index % 8;             // 0 à 7
  const row = Math.floor(index / 8); // 0 à 7

  const colLetter = String.fromCharCode('a'.charCodeAt(0) + col); // 0->'a', 1->'b', etc.
  const rowNumber = row + 1; // 0->1, 1->2, ..., 7->8

  return colLetter + rowNumber;
}


// ─────────────────────────────────────────────
// printBoard(board)
// Affiche le plateau dans la console, rangée par rangée
// (utile pour les tests pendant le développement)
// ─────────────────────────────────────────────
function printBoard(board) {
  console.log('  a b c d e f g h');
  console.log('  ─────────────────');

  for (let row = 7; row >= 0; row--) { // on part de la rangée 8 (haut) vers 1 (bas)
    let line = (row + 1) + ' ';

    for (let col = 0; col < 8; col++) {
      const index = row * 8 + col;
      const piece = board[index];

      if (piece === null) {
        line += '. ';
      } else {
        line += piece.type[0].toUpperCase() + ' '; // K, Q, R, B, N, P
      }
    }

    console.log(line);
  }

  console.log('  ─────────────────');
}
