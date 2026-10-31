// Deprecated client-side check. Admin authentication is strictly handled server-side at /api/admin/login.
console.warn("Client-side admin.js is deprecated. Please use the secure React portal at /admin.");
function admins() {
  window.location.href = "/admin";
}
