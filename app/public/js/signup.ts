import {
  showHeaderMessage,
  getErrorMessage,
  getSuccessMessage,
} from "./feedbacks.js";

const signupForm = document.getElementById("signup-form") as HTMLFormElement;
const signupSubmitBtn = document.getElementById("signup-btn") as HTMLButtonElement;

if (signupForm) {
  signupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    void submitSignupAjax();
  });
}

async function submitSignupAjax(): Promise<void> {
  if (!signupSubmitBtn) return;

  const formData = new FormData(signupForm);
  const body = Object.fromEntries(formData.entries());

  signupSubmitBtn.disabled = true;

  try {
    const response = await fetch("/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",        
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
    signupSubmitBtn.disabled = false;
  }
}
