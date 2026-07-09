export const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
export const currentYear = new Date().getFullYear();
export const YEARS = [currentYear - 1, currentYear, currentYear + 1];

// ── XLSX cell helpers ────────────────────────────────────────────────
export function colLetter(n: number): string {
  let s = '';
  n++;
  while (n > 0) { s = String.fromCharCode(65 + (n - 1) % 26) + s; n = Math.floor((n - 1) / 26); }
  return s;
}
export function addr(col: number, row: number) { return `${colLetter(col)}${row + 1}`; }
export function setCell(ws: any, col: number, row: number, v: string | number, s: any = {}) {
  ws[addr(col, row)] = { v, t: typeof v === 'number' ? 'n' : 's', s };
}

// ── Status badge ─────────────────────────────────────────────────────
export function expBadge(s: string) {
  if (s === 'approved') return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">Approved</span>;
  if (s === 'rejected') return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700">Rejected</span>;
  return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700">Pending</span>;
}
