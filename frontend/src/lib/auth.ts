import Cookies from "js-cookie";
import { API_URL } from "./api";

export function logout() {
  const refreshToken = localStorage.getItem("refresh_token");
  if (refreshToken) {
    fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    }).catch(() => {});
  }
  localStorage.removeItem("token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
  Cookies.remove("token");
  Cookies.remove("refresh_token");
  window.location.href = "/login";
}
