export const DEFAULT_TERMS_SECTIONS = [
  {
    title: "Everyday Value Offers",
    items: [
      "Offer applicable only on purchase of every 2 pizzas from Everyday Value Offers Section.",
      "Everyday Value Offer is applicable only Regular and Medium size Pizzas.",
      "Everyday Value Offer does not apply to Pizza Mania OR Combos.",
      "Offer is applicable on Papa Veg's own ordering channels (apps, mobile and desktop ordering site and in-store ordering), but not applicable on Aggregators.",
      "Offer cannot be combined with any other offer/coupons.",
      "Pizza Customisation or Crust Upgrade will be charged extra.",
      "Everyday Value pricing is excluding any taxes or delivery charges.",
      "For Delivery Charges, refer Delivery charges T&C."
    ]
  },
  {
    title: "Order Delivery",
    items: [
      "Minimum order value for delivery may vary depending on the delivery location and time of ordering.",
      "Delivery time guarantees are subject to weather conditions, traffic restrictions, and peak operational hours.",
      "In case of unforeseen delays, our customer care executive will contact you with updated delivery estimates.",
      "Delivery orders will be dispatched from the nearest operational outlet."
    ]
  },
  {
    title: "Menu",
    items: [
      "All menu items are 100% pure vegetarian and prepared in hygienic, certified kitchens.",
      "Prices, availability, and menu offerings are subject to change without prior notice.",
      "Visual representations of products on the app are for illustrative purposes; actual presentation may vary slightly."
    ]
  },
  {
    title: "NONG (No Onion No Garlic) Pizza T&C",
    items: [
      "NONG pizzas are prepared strictly without onion and garlic ingredients for our Jain and observant customers.",
      "Prepared using dedicated utensils, prep areas, and separate sauce bases.",
      "Select pizzas and sides can be customized as NONG upon request during ordering."
    ]
  },
  {
    title: "Modify / Cancel the Online Order",
    items: [
      "Orders can only be modified or cancelled within 60 seconds of placement.",
      "Once the kitchen starts baking your order, cancellations and modifications cannot be entertained.",
      "In the event of a cancellation accepted by the system, refunds will be initiated to the original payment source within 3-5 business days."
    ]
  },
  {
    title: "Service Guarantee",
    items: [
      "We are committed to serving oven-hot, fresh vegetarian pizzas.",
      "Any service deficiency must be reported within 15 minutes of receiving the order along with photos.",
      "Validated complaints are eligible for replacements, store credits, or refund per company policy."
    ]
  },
  {
    title: "Delivery Charges",
    items: [
      "Free delivery applies on orders above the specified threshold value in your zone.",
      "Delivery fee and surge charges (if applicable during rain or high demand) are displayed transparently at checkout.",
      "Government taxes (GST) are applicable on delivery and handling fees."
    ]
  },
  {
    title: "Late Night Delivery",
    items: [
      "Late night orders (post 11:00 PM) are serviced by designated late-night operational kitchens.",
      "Limited menu and delivery zones apply during late night operational hours.",
      "Late night delivery convenience fee may apply as displayed during checkout."
    ]
  },
  {
    title: "Cashback or Discount on Payment page:",
    items: [
      "Bank offers, wallet cashbacks, and instant discounts are subject to the partnering payment gateway's terms.",
      "Cashbacks will be credited directly by the respective bank or wallet provider within their standard turnaround time.",
      "Papa Veg Pizza is not liable for delayed credits or cashbacks managed by third-party payment gateways."
    ]
  },
  {
    title: "T & C for E Gift Card",
    items: [
      "E-Gift Cards can be redeemed across the Papa Veg Pizza app and official website.",
      "E-Gift Cards are valid for 1 year from the date of issuance and cannot be reloaded.",
      "Multiple gift vouchers can be combined during checkout as per platform limits."
    ]
  },
  {
    title: "T & C for Gift Card",
    items: [
      "Physical gift cards must have an intact scratch-off PIN for redemption.",
      "Gift cards cannot be exchanged for cash or transferred to bank accounts.",
      "Balance inquiries can be made online via the Gift Card balance check section."
    ]
  },
  {
    title: "Domino's Wallet",
    items: [
      "Wallet credits can be used for 100% order payments without restriction.",
      "Wallet balances are non-transferable and cannot be withdrawn to external bank accounts.",
      "Promotional wallet credits may carry an expiry date as communicated during campaigns."
    ]
  },
  {
    title: "EDV Mix & Match",
    items: [
      "Mix & Match combinations apply to any two qualifying pizzas in the Everyday Value category.",
      "Both pizzas must be of the same size tier (Regular or Medium) to qualify for EDV pricing.",
      "Crust upgrades and extra toppings will be billed over and above the combo base rate."
    ]
  },
  {
    title: "Pizzas at 49",
    items: [
      "Special promotional pricing of ₹49 applies only to select single-topping personal pizzas.",
      "Valid for dine-in and takeaway; delivery requires minimum order cart threshold.",
      "Limit of 4 promotional items per user account per day."
    ]
  },
  {
    title: "IRCTC",
    items: [
      "Deliveries on trains are coordinated based on real-time train tracking and PNR status.",
      "Orders must be booked at least 45 minutes prior to the scheduled arrival at the delivery station.",
      "If the train is cancelled or diverted, full automated refund will be processed to the original payment mode."
    ]
  },
  {
    title: "Information Security",
    items: [
      "Customer personal and transactional data is encrypted using 256-bit SSL encryption.",
      "We do not store full credit/debit card numbers or CVVs on our servers.",
      "For privacy inquiries, please review our comprehensive Privacy Policy."
    ]
  }
];

export const DEFAULT_TERMS_TEXT = DEFAULT_TERMS_SECTIONS.map(
  section => `# ${section.title}\n${section.items.map(item => `- ${item}`).join('\n')}`
).join('\n\n');

/**
 * Parses raw text or HTML from backend into structured accordion sections
 */
export function parseTermsSections(content) {
  if (!content || typeof content !== 'string') return DEFAULT_TERMS_SECTIONS;
  const raw = content.trim();
  if (!raw) return DEFAULT_TERMS_SECTIONS;

  // Normalize HTML to markdown-like headings and bullets
  const normalized = raw
    .replace(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/gi, "\n### $1\n")
    .replace(/<li[^>]*>(.*?)<\/li>/gi, "\n- $1")
    .replace(/<p[^>]*>(.*?)<\/p>/gi, "\n$1\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, ""); // strip any remaining tags

  const lines = normalized.split(/\r?\n/);
  const sections = [];
  let currentSection = null;

  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const headingMatch = trimmed.match(/^#{1,3}\s+(.*)$/);
    if (headingMatch) {
      const headingTitle = headingMatch[1].trim();
      // Skip top-level disclaimer heading as section
      if (headingTitle.toLowerCase() === 'disclaimer') continue;

      currentSection = {
        title: headingTitle,
        items: []
      };
      sections.push(currentSection);
      continue;
    }

    const bulletMatch = trimmed.match(/^[-*•▪]\s+(.*)$/);
    if (bulletMatch) {
      const bulletText = bulletMatch[1].trim();
      if (!currentSection) {
        currentSection = { title: "Terms & Conditions", items: [] };
        sections.push(currentSection);
      }
      currentSection.items.push(bulletText);
    } else {
      if (!currentSection) {
        currentSection = { title: "Terms & Conditions", items: [] };
        sections.push(currentSection);
      }
      currentSection.items.push(trimmed);
    }
  }

  return sections.length > 0 ? sections : DEFAULT_TERMS_SECTIONS;
}

