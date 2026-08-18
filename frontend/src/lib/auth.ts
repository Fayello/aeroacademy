import Cookies from "js-cookie";
import { API_URL } from "./api";

export async function logout() {
  const refreshToken = localStorage.getItem("refresh_token");
  try {
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ refresh_token: refreshToken || "" }),
    });
  } catch {}
  localStorage.removeItem("token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
  Cookies.remove("token");
  Cookies.remove("refresh_token");
  window.location.href = "/login";
}
