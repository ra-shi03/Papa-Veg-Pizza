// Inventory endpoints live under /food/store/inventory. The real answer is always shown, including the server's own error message.
export const INV = "/food/store/inventory";

export function throwApiError(err) {
  const message = err?.response?.data?.message || err?.response?.data?.error;
  throw message ? new Error(message) : err;
}
