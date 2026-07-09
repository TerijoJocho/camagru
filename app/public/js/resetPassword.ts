import {
  showHeaderMessage,
  getErrorMessage,
  getSuccessMessage,
} from "./feedbacks.js";

const resetPasswordForm = document.getElementById(
  "reset-password-form",
) as HTMLFormElement | null;
const resetPasswordSubmitBtn = document.getElementById(
  "reset-password-btn",
) as HTMLButtonElement | null;

if (resetPasswordForm && resetPasswordSubmitBtn) {
  resetPasswordForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(resetPasswordForm);
    const body = Object.fromEntries(formData.entries());

    resetPasswordSubmitBtn.disabled = true;

    try {
      const response = await fetch(resetPasswordForm.action, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") ?? "",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        showHeaderMessage(getErrorMessage(data.error), "error");
        return;
      }

      showHeaderMessage(getSuccessMessage(data.success), "success");
      resetPasswordForm.reset();
      if (typeof data.redirect === "string" && data.redirect.length > 0) {
            window.setTimeout(() => {
                window.location.href = data.redirect;
            }, 350);
        }
    } catch (error) {
      showHeaderMessage(getErrorMessage("internal_server_error"), "error");
    } finally {
      resetPasswordSubmitBtn.disabled = false;
    }
  });
}
