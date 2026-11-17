// What train delivery does in this app, in the customer's words. Kept in step with the code: the station picks the
// store (super admin station mapping), the journey is a delivery note, nothing is looked up with any third party,
// and payment and cancellation follow the normal order rules.
export const TRAIN_TERMS_TITLE = "Train Delivery Terms"

export const TRAIN_TERMS_SHORT = [
  "Train delivery is available at the stations a Papa Veg Pizza store serves. Choose your station from the list.",
  "Enter your train number, coach and seat so the delivery partner can find you. A PNR is optional and is never checked.",
  "Pay in cash or online, whichever payment options are offered at checkout.",
]

export const TRAIN_TERMS_FULL = [
  {
    title: "How does train delivery work?",
    text: "You pick the station where you want your order. It goes to the store that serves that station, and the delivery partner brings it to your train coach and seat using the details you enter.",
  },
  {
    title: "What details do I need?",
    text: "Your station, train number, coach and seat. A PNR number is optional: it is only passed on as a note and is not checked with any other service.",
  },
  {
    title: "How do I pay?",
    text: "In cash on delivery or online, according to the payment options shown at checkout.",
  },
  {
    title: "When can I not order?",
    text: "If train delivery is not set up for your station yet, or the store that serves it is closed, you will be told why and the order is not placed.",
  },
  {
    title: "Can I cancel?",
    text: "Yes, before the store accepts the order. A prepaid order cancelled at that point is refunded automatically. Once the store has accepted it, please use Report a problem in your order's help screen.",
  },
  {
    title: "What if my train is late or skips the station?",
    text: "We do not track trains. If the delivery cannot be made, report a problem within 24 hours of the order and the store will look into it.",
  },
]
