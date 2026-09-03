// src/lib/auth-utils.ts
export function getRedirectUrlForUser(user: { role?: string; department?: string }) {
  // Check if user is in Advancement, Senate, Council, or a Reviewer role
  if (
    user.department === "ADVANCEMENT_OFFICE" ||
    user.department === "GOVERNING_COUNCIL" ||
    user.department === "UNIVERSITY_SENATE" ||
    user.role === "REVIEWER"
  ) {
    return "/reviewer/dashboard"; // <-- Adjust to your actual reviewer route
  }

  // Default fallback for regular department submitters
  return "/dashboard";
}