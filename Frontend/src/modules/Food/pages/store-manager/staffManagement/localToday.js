// Today as YYYY-MM-DD in the browser's own time zone (IST for the stores). new Date().toISOString() is UTC, which
// between midnight and 05:30 IST is still yesterday, so attendance defaulted to the wrong day.
export const localToday = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split("T")[0];
};
