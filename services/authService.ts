import type { User } from 'firebase/auth';

/**
 * Checks if the user has the 'admin' custom claim.
 * CRITICAL: Forces a token refresh (true) to ensure the latest claims are retrieved from Firebase Auth.
 * This prevents stale tokens from blocking access or granting incorrect access.
 */
export const checkAdminClaim = async (user: User | null): Promise<boolean> => {
  if (!user) return false;
  
  try {
    // Force refresh the token to get the latest custom claims from the server
    const tokenResult = await user.getIdTokenResult(true);
    // Check for the custom claim 'admin'
    return !!tokenResult.claims.admin;
  } catch (error) {
    console.error("Error checking admin claim:", error);
    return false; // Fail safe
  }
};

/**
 * Helper to get the admin status without forcing a refresh.
 * Use this for UI elements (like Navbar) to avoid unnecessary network calls
 * after the initial routing check has passed.
 */
export const getIsAdmin = async (user: User | null): Promise<boolean> => {
    if (!user) return false;
    try {
        const tokenResult = await user.getIdTokenResult(false);
        return !!tokenResult.claims.admin;
    } catch (e) {
        return false;
    }
}