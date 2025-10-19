import { computeLayout } from "../step4Calculation/computeLayout";

// TEST FUNCTION FOR 6OZ VERIFICATION
export function test6ozLayout() {
  console.log("🧪 MANUAL 6OZ TEST STARTING...");
  const testResult = computeLayout(25, 35, 22, 8.5, 0.9, 0.5, 0.2, 0.3);
  console.log("🧪 MANUAL 6OZ TEST RESULT:", {
    itemsPerRow: testResult.itemsPerRow,
    itemsPerCol: testResult.itemsPerCol,
    itemsPerSheet: testResult.itemsPerSheet,
    orientation: testResult.orientation,
    passed: testResult.itemsPerSheet >= 4 ? "✅ 4+ CUPS" : "❌ LESS THAN 4",
  });
  return testResult;
}
