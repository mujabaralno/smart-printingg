export type CutPiece = { x: number; y: number; width: number; height: number };
export type CutStrategy = {
  pieces: CutPiece[];
  verticalCuts: number[];
  horizontalCuts: number[];
  totalPieces: number;
  pieceWidth: number;
  pieceHeight: number;
  piecesPerRow: number;
  piecesPerCol: number;
};

export function calculateCutStrategy(
  sheetWidth: number,
  sheetHeight: number,
  maxWidth: number,
  maxHeight: number
): CutStrategy {
  const pieces: CutPiece[] = [];
  const verticalCuts: number[] = [];
  const horizontalCuts: number[] = [];

  const pieceWidth = maxWidth;
  const pieceHeight = maxHeight;

  const piecesPerRow = Math.floor(sheetWidth / pieceWidth);
  const piecesPerCol = Math.floor(sheetHeight / pieceHeight);

  for (let row = 0; row < piecesPerCol; row++) {
    for (let col = 0; col < piecesPerRow; col++) {
      pieces.push({
        x: col * pieceWidth,
        y: row * pieceHeight,
        width: pieceWidth,
        height: pieceHeight,
      });
    }
  }

  for (let i = 1; i < piecesPerRow; i++) verticalCuts.push(i * pieceWidth);
  for (let i = 1; i < piecesPerCol; i++) horizontalCuts.push(i * pieceHeight);

  return {
    pieces,
    verticalCuts,
    horizontalCuts,
    totalPieces: pieces.length,
    pieceWidth,
    pieceHeight,
    piecesPerRow,
    piecesPerCol,
  };
}
