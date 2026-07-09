import {
  showHeaderMessage,
  getErrorMessage,
  getSuccessMessage,
} from "./feedbacks.js";

const logoutForm = document.getElementById("logout-form") as HTMLFormElement;

if (logoutForm) {
  logoutForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/auth/logout", {
        method: "POST",
        headers: {
          "Accept": "application/json", 
          "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") ?? "",       
        },
      });
  
      const data = await res.json();
  
      if (!res.ok) {
        showHeaderMessage(getErrorMessage(data.error), "error");
        return;
      }
  
      showHeaderMessage(getSuccessMessage(data.success), "success");
      window.setTimeout(() => {
        window.location.href = data.redirect;
      }, 350);
    } catch {
      showHeaderMessage(getErrorMessage("internal_server_error"), "error");
    }
  });
}
