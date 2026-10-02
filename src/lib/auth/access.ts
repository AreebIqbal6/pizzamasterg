export type AuthLikeUser = {
  id?: string | null
  email?: string | null
  user_metadata?: Record<string, any> | null
}

export const ADMIN_EMAIL = "admin@pizzamasterg.com"

export const HARDCODED_KITCHEN_EMAILS = [
  "pizzamastergmukkachowk@gmail.com",
  "pizzamasterggulshaneiqbalblock2@gmail.com",
  "pizzamastergnorthkarachiandamor@gmail.com",
  "pizzamastergfbareasagheercenter@gmail.com",
]

const ADMIN_ROLES = new Set(["admin"])
const KITCHEN_ROLES = new Set(["kitchen", "kitchen_staff"])

export function normalizeEmail(email?: string | null) {
  return (email || "").trim().toLowerCase()
}

export function getUserRole(user?: AuthLikeUser | null) {
  return String(user?.user_metadata?.role || "").trim().toLowerCase()
}

export function isAdminEmail(email?: string | null) {
  return normalizeEmail(email) === ADMIN_EMAIL
}

export function isHardcodedKitchenEmail(email?: string | null) {
  return HARDCODED_KITCHEN_EMAILS.includes(normalizeEmail(email))
}

export function isAdminAuthUser(user?: AuthLikeUser | null) {
  const role = getUserRole(user)
  return ADMIN_ROLES.has(role) || isAdminEmail(user?.email)
}

export function isKitchenAuthUser(user?: AuthLikeUser | null) {
  const role = getUserRole(user)
  return KITCHEN_ROLES.has(role) || isHardcodedKitchenEmail(user?.email)
}

export function isStaffAuthUser(user?: AuthLikeUser | null) {
  return isAdminAuthUser(user) || isKitchenAuthUser(user)
}

export function getSafeNextPath(next?: string | null, fallback = "/") {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return fallback
  return next
}
