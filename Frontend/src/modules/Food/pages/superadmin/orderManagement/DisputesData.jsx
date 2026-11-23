// Order disputes: there is no disputes service on the server yet, so the screen starts empty and actions say they are not available.
import { useState, useEffect } from 'react';

export const supportAgents = [];
export const storeOptions = {};
export const franchiseOptions = {};
export const disputeActivityLogs = [];

const notAvailable = (what) => Promise.reject(new Error(`${what} is not available yet.`));

export const getDisputes = () => Promise.resolve([]);
export const getDisputeDetails = () => Promise.reject(new Error('Dispute not found'));
export const assignDispute = () => notAvailable('Assigning a dispute');
export const escalateDispute = () => notAvailable('Escalating a dispute');
export const resolveDispute = () => notAvailable('Resolving a dispute');
export const closeDispute = () => notAvailable('Closing a dispute');
export const postInternalNote = () => notAvailable('Adding a note');

export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}
