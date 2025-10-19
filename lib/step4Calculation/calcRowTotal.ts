import { CandidateRow } from "@/types";

export const RU = Math.ceil,
  RD = Math.floor;


export const unitPrice = (units: number) => {
  const u = Math.max(0, Math.floor(units));
  if (u <= 10) return 50 * u;
  if (u <= 20) return 60 * u - u * u; // 60u - u^2
  return 40 * u;
};

export function calcRowTotal(
  base: {
    pieceW: number;
    pieceH: number;
    qty: number;
    sides: number;
    colours: number;
    paperCostPerSheet: number;
  },
  row: CandidateRow
) {
  const { pieceW, pieceH, qty, sides, colours, paperCostPerSheet } = base;
  const { parentW, parentH, cutPcs } = row;

  // 1) Imposition (Option1/2)
  const opt1 = RD(parentW / (pieceH + 1)) * RD(parentH / (pieceW + 1));
  const opt2 = RD(parentW / (pieceW + 1)) * RD(parentH / (pieceH + 1));
  const noOfUps = Math.max(opt1, opt2);

  // 2) Odd/even rule (IF(Sides=1, TRUE, ISEVEN(No. of ups)))
  const oddEven = sides === 1 ? true : noOfUps % 2 === 0;

  // 3) Ups/sheet; 4) Waste; 5) Sheets
  const upsPerSht = noOfUps * cutPcs;
  const wasteSheets = RU((parentW > 50 ? 120 : 100) / cutPcs);
  const sheets = upsPerSht === 0 ? 0 : RU(qty / upsPerSht + wasteSheets);

  // 6) Paper cost
  const paperCost = sheets * paperCostPerSheet;

  // 7) Units → 8) unit price
  const coreUnits = RU((sheets * cutPcs * colours * sides) / 1000);
  const baseUnits = Math.max(colours, coreUnits);
  const units = oddEven ? baseUnits : baseUnits * 2;
  const unit_price = unitPrice(units);

  // 9) Plate
  const platePerSide = (parentW > 54 ? 50 : 20) * colours;
  const plateTotal = platePerSide * sides;

  // 10) Total (ensure no zero totals for valid calculations)
  const total =
    sheets === 0 || noOfUps === 0 ? 0 : unit_price + paperCost + plateTotal;

  return {
    ...row,
    noOfUps,
    upsPerSht,
    wasteSheets,
    sheets,
    paperCost,
    units,
    unit_price,
    platePerSide,
    plateTotal,
    total,
  };
}
