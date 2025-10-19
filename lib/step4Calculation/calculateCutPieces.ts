import { calculateCutStrategy, type CutStrategy } from "./calculateCutStrategy";

export function calculateCutPieces(
  inputWidth: number,
  inputHeight: number,
  machineMaxWidth: number,
  machineMaxHeight: number
): CutStrategy {
  const s1 = calculateCutStrategy(
    inputWidth,
    inputHeight,
    machineMaxWidth,
    machineMaxHeight
  );
  const s2 = calculateCutStrategy(
    inputWidth,
    inputHeight,
    machineMaxHeight,
    machineMaxWidth
  );

  const eff1 =
    (s1.totalPieces * machineMaxWidth * machineMaxHeight) /
    (inputWidth * inputHeight);
  const eff2 =
    (s2.totalPieces * machineMaxWidth * machineMaxHeight) /
    (inputWidth * inputHeight);

  return eff2 > eff1 && eff2 > 0.99 ? s2 : s1;
}
