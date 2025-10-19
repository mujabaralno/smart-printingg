import { CandidateRow } from "@/types";
import { calcRowTotal } from "./calcRowTotal";

export function pickCheapestTotal(
  base: {
    pieceW: number;
    pieceH: number;
    qty: number;
    sides: number;
    colours: number;
    paperCostPerSheet: number;
  },
  candidates: CandidateRow[]
) {
  const rows = candidates.map((r) => calcRowTotal(base, r));

  // Filter out zero totals and invalid calculations
  const validRows = rows.filter(
    (row) =>
      row.total > 0 && row.sheets > 0 && row.noOfUps > 0 && row.upsPerSht > 0
  );

  // Sort by total (cheapest first)
  validRows.sort((a, b) => a.total - b.total);

  if (validRows.length === 0) {
    console.warn(
      "⚠️ All offset calculation results have zero total - no valid option found"
    );
    return []; // Return empty array if no valid results
  }

  console.log(
    "✅ Offset calculation - valid options found:",
    validRows.length,
    "cheapest:",
    validRows[0]?.total
  );
  return validRows; // validRows[0] is cheapest non-zero
}