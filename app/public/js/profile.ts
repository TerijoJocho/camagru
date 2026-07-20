import {
  showHeaderMessage,
  getErrorMessage,
  getSuccessMessage,
} from "./feedbacks.js";

const changeProfileForm = document.getElementById("change-profile-form") as HTMLFormElement;
const changeProfileSubmitBtn =document.getElementById("change-profile-btn") as HTMLButtonElement;

const changePasswordForm = document.getElementById("change-password-form") as HTMLFormElement;
const changePasswordSubmitBtn =document.getElementById("change-password-btn") as HTMLButtonElement;

const emailNotificationsInput = document.getElementById("email-notifications-input") as HTMLInputElement;
const emailNotificationsForm = document.getElementById("notifications-form") as HTMLFormElement;

async function submitChangeProfileForm(): Promise<void> {
    if (!changeProfileForm || !changeProfileSubmitBtn)
        return;

    const formData = new FormData(changeProfileForm);
    const body = Object.fromEntries(formData.entries());

    changeProfileSubmitBtn.disabled = true;

    try {
        const res = await fetch("/auth/change-profile", {
          method: "POST",
		  credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") ?? "",
          },
          body: JSON.stringify(body),
        });

        const data = await res.json();

        if (!res.ok) {
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
        changeProfileSubmitBtn.disabled = false;
    }
};

async function submitChangePasswordForm(): Promise<void> {
    if (!changePasswordForm || !changePasswordSubmitBtn)
        return;

    const formData = new FormData(changePasswordForm);
    const body = Object.fromEntries(formData.entries());

    changePasswordSubmitBtn.disabled = true;

    try {
        const res = await fetch("/auth/change-profile-password", {
          method: "POST",
		  credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") ?? "",
          },
          body: JSON.stringify(body),
        });

        const data = await res.json();

        if (!res.ok) {
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
        changePasswordSubmitBtn.disabled = false;
    }
};

async function submitEmailNotificationsForm(): Promise<void> {
    if (!emailNotificationsForm)
        return;

    const formData = new FormData(emailNotificationsForm);
    const body = Object.fromEntries(formData.entries());

    try {
        const res = await fetch("/auth/change-user-preference", {
          method: "POST",
		  credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") ?? "",
          },
          body: JSON.stringify(body),
        });

        const data = await res.json();

        if (!res.ok) {
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
    }
};

if (changePasswordForm)
{
    changePasswordForm.addEventListener("submit", e => {
        e.preventDefault();
        void submitChangePasswordForm();
    })
}

if (changeProfileForm)
{
    changeProfileForm.addEventListener("submit", e => {
        e.preventDefault();
        void submitChangeProfileForm();
    })
}

if (emailNotificationsInput && emailNotificationsForm)
{
    emailNotificationsInput.addEventListener("change", () => {
        void submitEmailNotificationsForm();
    });
}
