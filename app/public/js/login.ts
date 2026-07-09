import {
  showHeaderMessage,
  getErrorMessage,
  getSuccessMessage,
} from "./feedbacks.js";

const loginForm = document.getElementById("login-form") as HTMLFormElement;
const loginSubmitBtn = document.getElementById(
  "login-btn",
) as HTMLButtonElement;

async function submitLoginAjax(event: SubmitEvent): Promise<void> {
  event.preventDefault();

  if (!loginForm || !loginSubmitBtn) return;

  const formData = new FormData(loginForm);
  const body = Object.fromEntries(formData.entries());

  loginSubmitBtn.disabled = true;

  try {
    const response = await fetch("/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
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

    if (typeof data.redirect === "string" && data.redirect.length > 0) {
      window.setTimeout(() => {
        window.location.href = data.redirect;
      }, 350);
    }
  } catch (error) {
    showHeaderMessage(getErrorMessage("internal_server_error"), "error");
  } finally {
    loginSubmitBtn.disabled = false;
  }
}

if (loginForm) {
  loginForm.addEventListener("submit", (event) => {
    void submitLoginAjax(event);
  });
}
