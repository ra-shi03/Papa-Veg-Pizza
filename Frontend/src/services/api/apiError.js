// Turns a failed API call into an Error carrying the server's own message, so a screen shows what really happened.

const NO_SERVER = "Could not reach the server. Check your connection and try again.";

/**
 * Call in a `catch (err)` around an API call. Always throws:
 *   - an Error with the server's message (and `.response`, so the status stays readable), or
 *   - a "could not reach the server" Error for a network failure.
 * Errors that are not from the network call itself are rethrown unchanged.
 */
export function throwApiError(err, fallbackMessage = "Request failed") {
  if (!err?.isAxiosError) throw err;
  const message = err.response?.data?.message || err.response?.data?.error;
  if (message) throw Object.assign(new Error(message), { response: err.response });
  if (err.response) throw Object.assign(new Error(fallbackMessage), { response: err.response });
  throw new Error(NO_SERVER);
}
