/**
 * Fetch team details utility
 * Wrapper around authService for reusable team data fetching
 */

import { authService } from "./auth-service"

export async function fetchTeamDetails() {
  return authService.getTeamDetails()
}
