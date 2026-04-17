/**
 * A robust CSV parser that handles quoted strings and various line endings.
 */
export function parseCSV(text: string): Record<string, string>[] {
  const result: any[] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    
    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Double quote inside quoted string
          field += '"';
          i++;
        } else {
          // End of quoted string
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(field.trim());
        field = "";
      } else if (char === '\n' || char === '\r') {
        if (field || row.length > 0) {
          row.push(field.trim());
          result.push(row);
        }
        row = [];
        field = "";
        // Skip next char if it's \n in \r\n
        if (char === '\r' && nextChar === '\n') i++;
      } else {
        field += char;
      }
    }
  }
  
  // Last field/row
  if (field || row.length > 0) {
    row.push(field.trim());
    result.push(row);
  }

  if (result.length < 2) return [];

  const headers = result[0].map((h: string) => h.toLowerCase().trim());
  return result.slice(1).map(row => {
    const obj: Record<string, string> = {};
    headers.forEach((header: string, index: number) => {
      obj[header] = row[index] || "";
    });
    return obj;
  });
}

/**
 * Generates a template CSV string.
 */
export function generateCSVTemplate(): string {
  const headers = ["date", "crop", "market", "price_per_kg"];
  const samples = [
    ["2024-04-17", "tomato", "Bowenpally", "32.50"],
    ["2024-04-17", "onion", "Guntur", "24.00"],
    ["2024-04-17", "cotton", "Warangal", "65.00"]
  ];
  
  return [
    headers.join(","),
    ...samples.map(s => s.join(","))
  ].join("\n");
}
