// The train details a customer enters (both train screens use this): station from the list, train number, coach, seat and
// an optional PNR. Nothing is looked up: the PNR is never checked against anything and only travels as a delivery note.

export const TRAIN_UNAVAILABLE = "Train delivery is not available yet"
export const TRAIN_KEY = "pvp_train"
export const OTHER_STATION = "__other__"

const clean = (value) => String(value ?? "").trim()
const NO_HTML = /[<>]/

export const emptyJourney = () => ({ stationCode: "", stationName: "", trainNo: "", coach: "", seat: "", pnr: "" })

/** Trimmed, upper-cased where the railways write it that way, and cut to the allowed length. */
export function cleanJourney(input = {}) {
  return {
    stationCode: clean(input.stationCode).toUpperCase().slice(0, 8),
    stationName: clean(input.stationName).slice(0, 80),
    trainNo: clean(input.trainNo).toUpperCase().slice(0, 10),
    coach: clean(input.coach).toUpperCase().slice(0, 6),
    seat: clean(input.seat).toUpperCase().slice(0, 8),
    pnr: clean(input.pnr).replace(/\D/g, "").slice(0, 10),
  }
}

/** A message for the first thing wrong with the details, or null. `info` is the station list from the server. */
export function journeyProblem(journey, info) {
  const j = cleanJourney(journey)
  if (info && !info.available) return TRAIN_UNAVAILABLE
  if (!j.stationCode && !j.stationName) return "Please choose your station."
  if (j.stationCode && info && !(info.stations || []).some((s) => s.code === j.stationCode)) return "Please choose your station from the list."
  if (!j.stationCode && info && !info.defaultAvailable) return "Please choose your station from the list."
  if (NO_HTML.test(j.stationName) || !/^[\p{L}\p{N} .,'()&/-]*$/u.test(j.stationName)) return "The station name has characters that are not allowed."
  if (!/^[A-Z0-9-]{1,10}$/.test(j.trainNo)) return "Please enter the train number (letters and digits only)."
  if (!/^[A-Z0-9-]{1,6}$/.test(j.coach)) return "Please enter your coach (for example B2)."
  if (!/^[A-Z0-9/-]{1,8}$/.test(j.seat)) return "Please enter your seat number."
  if (j.pnr && j.pnr.length !== 10) return "A PNR has 10 digits. Leave it empty if you do not have it."
  return null
}

/** The address text shown for a train order: the journey, as the customer typed it. */
export const journeyText = (journey) => {
  const j = cleanJourney(journey)
  return [`Train ${j.trainNo}`, `Coach ${j.coach}`, `Seat ${j.seat}`, `Station: ${j.stationName}`].join(", ")
}

/** The fields of the order request for a train: the PNR only when given. */
export function trainOrderFields(journey) {
  const { pnr, ...rest } = cleanJourney(journey)
  return { ...rest, ...(pnr ? { pnr } : {}) }
}

/** The journey saved on this device for the cart and checkout, or null when the order is not for a train. */
export function readTrainJourney(storage = localStorage) {
  if (storage.getItem("activeService") !== "train") return null
  try {
    const saved = JSON.parse(storage.getItem(TRAIN_KEY) || "null")
    if (saved && typeof saved === "object") return cleanJourney(saved)
  } catch (_) {}
  return emptyJourney()
}

/** Saves the journey and confirms the "location" so the cart opens. `confirmLocation` is the location store's. */
export function saveTrainJourney(journey, confirmLocation, storage = localStorage) {
  const j = cleanJourney(journey)
  storage.setItem(TRAIN_KEY, JSON.stringify(j))
  confirmLocation({ address: journeyText(j), serviceType: "train" })
  return j
}

/** Query for the store endpoints: for a train the super admin's station mapping picks the store, not a map point. */
export function trainStoreQuery(journey) {
  return journey ? { train: "1", ...(journey.stationCode ? { stationCode: journey.stationCode } : {}) } : null
}

/** What to tell the customer in the cart before an order is placed, or null when the train order can go ahead. */
export function trainOrderProblem(journey, info) {
  if (!journey) return null
  if (!info) return null // still loading
  if (!info.available) return TRAIN_UNAVAILABLE
  const j = cleanJourney(journey)
  if (j.stationCode ? !(info.stations || []).some((s) => s.code === j.stationCode) : !info.defaultAvailable) {
    return "This station is not available for train delivery. Please choose your station again."
  }
  return null
}
