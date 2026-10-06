export const truecallerMock = {
  isInstalled: () => {
    // Randomly true or false, or just true for testing
    return true; 
  },
  requestVerification: () => {
    return new Promise((resolve, reject) => {
      console.log("Mock Truecaller: Requesting verification...");
      // Simulate network delay
      setTimeout(() => {
        const success = Math.random() > 0.1; // 90% success rate
        if (success) {
          resolve({
            successful: true,
            payload: {
              phone: "+919999999999",
              firstName: "Truecaller",
              lastName: "User",
              isVerified: true
            }
          });
        } else {
          reject(new Error("User cancelled or verification failed"));
        }
      }, 1500);
    });
  }
};
