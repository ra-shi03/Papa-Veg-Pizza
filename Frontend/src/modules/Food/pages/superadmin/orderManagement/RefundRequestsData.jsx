// Refund requests screen: not connected to the server's refunds yet (/food/admin/refunds), so it starts empty and
// approve / reject say they are not available here instead of pretending.
import { useState, useEffect } from 'react';

export const refundActivityLogs = [];

const notAvailable = (what) => Promise.reject(new Error(`${what} is not available from this screen yet.`));

export const getRefundRequests = () => Promise.resolve([]);
export const getRefundDetails = () => Promise.reject(new Error('Refund request not found'));
export const approveRefund = () => notAvailable('Approving a refund');
export const rejectRefund = () => notAvailable('Rejecting a refund');

export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}
