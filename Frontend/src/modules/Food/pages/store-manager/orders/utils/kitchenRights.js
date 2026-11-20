import { getModuleToken, getUserIdFromToken } from "@food/utils/auth"

// Who may do what on an order in the kitchen (the server checks the same rules; this only decides which buttons show).
// There is no kitchen supervisor any more: the store manager assigns the stations, and the kitchen staff member holding
// an order's packaging station does its quality check and marks it ready (the manager can always do both).

/** The signed-in store-panel user's id, read from their own token. */
export const myUserId = () => String(getUserIdFromToken(getModuleToken("admin")) || "")

/** Does the signed-in user hold this order's packaging station? */
export const holdsPackaging = (order) => {
  const packer = order?.assignedStaff?.packaging_staff?._id
  return !!packer && String(packer) === myUserId()
}

/** Mark Ready: the store manager, or the kitchen staff member at this order's packaging station. */
export const canMarkReady = (role, order) => role === "store_manager" || (role === "kitchen_staff" && holdsPackaging(order))
