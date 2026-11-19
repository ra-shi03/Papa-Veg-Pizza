// Customer Terms & Conditions used until the super admin publishes their own
// (Super Admin > Settings > Content Management > Policies > Terms & Conditions).
export const DEFAULT_TERMS_TEXT = `
# Welcome and Acceptance
- These Terms & Conditions apply when you browse, order or pay through the Papa Veg Pizza app and website.
- By creating an account or placing an order you agree to these terms, our **Privacy Policy**, **Cancellation Policy**, **Refund Policy** and **Shipping Policy**.
- If you do not agree, please do not use the app.

# Your Account
- You must be 18 or older, or use the app under the supervision of a parent or guardian.
- You sign in with your mobile number and a one-time password (OTP). Never share your OTP with anyone.
- Keep your name, phone number and addresses correct. We are not responsible for orders that fail because of wrong details.
- You are responsible for everything done through your account. Tell us at once if you think it has been misused.

# 100% Vegetarian Promise
- Every item on our menu is 100% vegetarian.
- Our kitchens use shared equipment, so traces of gluten, dairy, nuts, soy or mustard may be present in any item.
- Allergen and nutrition details are shown on the **Nutrition Information** page. If you have a serious allergy, please check it before you order.

# Menu, Prices and Availability
- Prices and availability are set by the store that will prepare your order and can differ between stores.
- Photos are for illustration. Toppings, colour and presentation may vary slightly.
- Prices, offers and menu items can change without notice. The price shown in your cart when you place the order is the price you pay.
- If an item is unavailable after you order, the store may contact you, replace it or remove it, and you pay only for what is served.

# Placing an Order
- An order is confirmed only after the store accepts it. A store may decline an order if it is busy, closed or cannot reach your address.
- Check your cart, address and phone number before paying. The bill shows the food total, every fee and tax, and any discount.
- You can follow your order from the kitchen to your door in **My Orders**.

# Fees, Taxes and Charges
- Besides the food, an order can include a handling charge, platform fee, packaging fee, delivery fee and GST.
- Delivery fee depends on the distance from the store. Free delivery applies above the order value shown in your cart.
- Every charge that applies to you is listed in the cart and on your bill before you pay. A charge that is not shown is not applied.

# Payments
- You can pay with the methods offered at checkout. Online payments are processed by secure third-party payment gateways.
- We do not store your full card number, CVV or UPI PIN.
- If money is deducted but your order is not placed, it is returned to the same payment source automatically, usually within 3 to 5 working days.

# Delivery and Pickup
- Delivery times are estimates. Traffic, weather, festivals and peak hours can cause delays.
- Share the **delivery code** only with the delivery partner when the order is handed over. The delivery partner may take a photo at handover as proof of delivery.
- If we cannot reach you or no one is available at the address, the order may be marked delivered or cancelled, and the cancellation rules apply.
- For pickup orders, collect your order from the store at the time shown. Orders left uncollected may be cancelled.

# Cancellations and Refunds
- You can cancel free of charge within the cancellation window shown when you place the order. After that window, a cancellation fee may be kept from prepaid orders. Cash orders are never charged a cancellation fee.
- Once the kitchen has started preparing your order, it may not be possible to cancel it.
- Your order follows the cancellation rules that were shown when you placed it.
- Approved refunds go back to the original payment source within 3 to 5 working days.

# Quality Issues
- If something is missing, wrong or not as fresh as it should be, report it from **Help and Support** within 15 minutes of delivery, with photos.
- After checking, we may offer a replacement, store credit or a refund.

# Bulk and Party Orders
- Bulk and party orders are sent as a request. The store checks it, confirms the items, price and timing, and then you pay to confirm.
- Bulk orders need advance notice. Menu, price and timing are confirmed by the store, not by the request form.
- Cancellation and refund terms for a bulk order are shown when the store confirms it.

# Coupons, Offers and Rewards
- A coupon or offer can be used only as described in it: eligible items, minimum order, validity and usage limits.
- Unless stated otherwise, one coupon can be used per order and coupons cannot be combined.
- Reward codes give the item named in the reward. They have no cash value.
- We may withdraw an offer, and cancel benefits, if we find misuse, fake accounts or repeated abuse.

# Wallet and Referrals
- Wallet balance can be used to pay for orders in the app. It cannot be transferred to another account.
- Referral rewards are given only for genuine new customers who complete the required first order.

# Acceptable Use
- Do not misuse the app, place fake or prank orders, abuse our delivery partners or store staff, or try to break or copy our systems.
- We may suspend or close an account that breaks these terms.

# Privacy and Your Data
- We use your phone number, address and location to take, prepare and deliver your orders and to improve the service.
- We do not sell your personal data. Read the **Privacy Policy** to see what we collect and the choices you have.
- You can ask to delete your account from the Account section of the app.

# Our Responsibility
- We take care to prepare and deliver food safely, but we are not responsible for delays or failures caused by events outside our control.
- To the extent the law allows, our liability for any order is limited to the amount you paid for it.

# Changes to These Terms
- We may update these terms from time to time. The date at the top of this page shows when they were last changed.
- If you keep using the app after a change, you accept the updated terms.

# Contact Us
- Questions about these terms or an order? Open **Help and Support** in the app and we will get back to you.
`.trim();

// The HTML bold tags the admin editor saves and "**bold**" both become **bold** here;
// the Terms page turns **bold** into bold text.
const toMarkdownish = (raw) =>
  raw
    .replace(/<\/?(strong|b)>/gi, "**")
    .replace(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/gi, "\n### $1\n")
    .replace(/<li[^>]*>(.*?)<\/li>/gi, "\n- $1")
    .replace(/<p[^>]*>(.*?)<\/p>/gi, "\n$1\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "") // strip any remaining tags
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

function splitSections(content) {
  const lines = toMarkdownish(String(content || "").trim()).split(/\r?\n/);
  const sections = [];
  let current = null;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const heading = trimmed.match(/^#{1,3}\s+(.*)$/);
    if (heading) {
      const title = heading[1].replace(/\*\*/g, "").trim();
      // A heading that only repeats the page title is not a section
      if (/^(disclaimer|terms\s*(&|and)\s*conditions?)$/i.test(title.replace(/^[^\w]+/, ""))) continue;
      current = { title, items: [] };
      sections.push(current);
      continue;
    }
    if (!current) {
      current = { title: "Terms & Conditions", items: [] };
      sections.push(current);
    }
    current.items.push(trimmed.replace(/^[-*•▪]\s+/, ""));
  }
  return sections;
}

export const DEFAULT_TERMS_SECTIONS = splitSections(DEFAULT_TERMS_TEXT);

/**
 * Parses raw text or HTML from backend into structured accordion sections
 */
export function parseTermsSections(content) {
  if (!content || typeof content !== "string" || !content.trim()) return DEFAULT_TERMS_SECTIONS;
  const sections = splitSections(content);
  return sections.length > 0 ? sections : DEFAULT_TERMS_SECTIONS;
}
