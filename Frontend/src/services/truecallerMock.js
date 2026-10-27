import { toast } from "sonner";

// Truecaller login is not available yet: the server refuses it (501) until a real Truecaller verification is set up,
// and there is no Truecaller SDK in this build. The buttons stay where they are; pressing one now tells the customer
// to use their mobile number instead of spinning, or worse, pretending to verify a made-up phone number.
// Resolving never happens, so the login page's catch simply ends its loading state.
const MESSAGE = "Truecaller login isn't available right now. Please continue with your mobile number.";

export const truecallerMock = {
  isInstalled: () => true,
  requestVerification: () => {
    try {
      toast.info(MESSAGE);
    } catch (_) {
      // no toaster mounted: the login page still just stops loading
    }
    return Promise.reject(new Error(MESSAGE));
  },
};
