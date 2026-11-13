// Which inputs each provider actually needs, and what its own dashboard calls them.
// Only the required ones are shown when adding or editing a gateway (webhook secrets are a server setting, not asked here); add a provider here when you integrate it.
export const GATEWAY_FIELDS = {
  Razorpay: { merchant: false, webhook: false, keyLabel: 'Key ID', keyHint: 'e.g. rzp_test_xxxxxxxx', secretLabel: 'Key Secret' },
  PhonePe: { merchant: true, webhook: false, keyLabel: 'Salt Index', keyHint: 'e.g. 1', secretLabel: 'Salt Key' },
  Cashfree: { merchant: false, webhook: false, keyLabel: 'App ID', keyHint: 'Your Cashfree App ID', secretLabel: 'Secret Key' },
  Paytm: { merchant: true, webhook: false, keyLabel: 'Website Name', keyHint: 'e.g. WEBSTAGING', secretLabel: 'Merchant Key' },
  Stripe: { merchant: false, webhook: false, keyLabel: 'Publishable Key', keyHint: 'pk_test_...', secretLabel: 'Secret Key' },
  PayPal: { merchant: false, webhook: false, keyLabel: 'Client ID', keyHint: 'Your PayPal Client ID', secretLabel: 'Client Secret' },
};

export const fieldsFor = (provider) => GATEWAY_FIELDS[provider] || { merchant: false, webhook: false, keyLabel: 'Key ID', keyHint: '', secretLabel: 'Secret Key' };
