export function parseColorsCount(colorStr?: string | number | null): number {
  if (!colorStr) return 0;
  const str = String(colorStr);
  const plus = str.match(/(\d+)\+(\d+)/);
  if (plus) return parseInt(plus[1]) + parseInt(plus[2]);
  const single = str.match(/\d+/);
  return single ? parseInt(single[0]) : 0;
}

export function getColorFromInput(inputRaw: string): string {
  const input = inputRaw.trim().toLowerCase();
  // hex
  if (input.startsWith("#") && /^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(input)) return input;
  // nama warna umum
  const map: Record<string,string> = {
    red:"#FF0000", green:"#00FF00", blue:"#0000FF", yellow:"#FFFF00",
    cyan:"#00FFFF", magenta:"#FF00FF", black:"#000000", white:"#FFFFFF",
    gray:"#808080", grey:"#808080", orange:"#FFA500", purple:"#800080",
    pink:"#FFC0CB", brown:"#A52A2A", navy:"#000080", teal:"#008080",
  };
  if (map[input]) return map[input];

  // coba biar CSS resolve
  const el = document.createElement("div");
  el.style.color = input;
  if (el.style.color) return input;

  return "transparent";
}
