import {
  showHeaderMessage,
  getErrorMessage,
  getSuccessMessage,
} from "./feedbacks.js";

const forgotPasswordForm = document.getElementById(
  "forgot-password-form",
) as HTMLFormElement | null;
const forgotPasswordSubmitBtn = document.getElementById(
  "forgot-password-btn",
) as HTMLButtonElement | null;

if (forgotPasswordForm && forgotPasswordSubmitBtn) {
  forgotPasswordForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(forgotPasswordForm);
    const csrfToken =
      document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute("content") ?? "";
    const body = Object.fromEntries(formData.entries());

    forgotPasswordSubmitBtn.disabled = true;

    try {
      const response = await fetch("/auth/forgot-password", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        showHeaderMessage(getErrorMessage(data.error), "error");
        return;
      }

      showHeaderMessage(getSuccessMessage(data.success), "success");
      if (typeof data.redirect === "string" && data.redirect.length > 0) {
        window.setTimeout(() => {
          window.location.href = data.redirect;
        }, 350);
      }
    } catch (error) {
      showHeaderMessage(getErrorMessage("internal_server_error"), "error");
    } finally {
      forgotPasswordSubmitBtn.disabled = false;
    }
  });
}
