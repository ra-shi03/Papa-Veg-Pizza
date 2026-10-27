// Inventory endpoints live under /food/store/inventory. With a backend the real answer is always shown (including
// the server's own error message); the local mock data in ../mockData only runs when VITE_STANDALONE_MOCK=true.
export const INV = "/food/store/inventory";
export const STANDALONE_MOCK = import.meta.env?.VITE_STANDALONE_MOCK === "true";

export function failOrMock(err) {
  if (STANDALONE_MOCK) return;
  const message = err?.response?.data?.message || err?.response?.data?.error;
  throw message ? new Error(message) : err;
}
