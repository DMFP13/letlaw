"use client";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="bg-gray-900 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2"
    >
      🖨 Print / Save PDF
    </button>
  );
}
