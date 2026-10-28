// When the screens may fall back to local mock data.
//
// With a backend the answer is always the server's: a 403, 404, 409 or a network failure is shown as the error it is,
// never replaced by sample data or a success toast for something that was not saved. The localStorage mock only runs when
// VITE_STANDALONE_MOCK=true (no backend at all). The inventory and kitchen hooks use the same switch.
export const STANDALONE_MOCK = import.meta.env?.VITE_STANDALONE_MOCK === "true";

const NO_SERVER = "Could not reach the server. Check your connection and try again.";

/**
 * Call first thing in a `catch (err)` that has a mock fallback below it:
 *   - standalone mock: returns, so the fallback below runs
 *   - otherwise: throws an Error carrying the server's own message (and `.response`, so the status stays readable)
 * Errors that are not from the network call itself (our own "format mismatch" checks) are rethrown unchanged.
 */
export function failOrMock(err, fallbackMessage = "Request failed") {
  if (STANDALONE_MOCK) return;
  if (!err?.isAxiosError) throw err;
  const message = err.response?.data?.message || err.response?.data?.error;
  if (message) throw Object.assign(new Error(message), { response: err.response });
  if (err.response) throw Object.assign(new Error(fallbackMessage), { response: err.response });
  throw new Error(NO_SERVER);
}
