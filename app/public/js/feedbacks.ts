export type HeaderMessageType = "error" | "success";

const errorMessages: Record<string, string> = {
	invalid_credentials: "Bad email or password",
	email_not_confirmed: "Please confirm your email before logging in",
	server_error: "Server error",
	user_not_found: "Bad email or bad password",
	bad_password: "Bad email or password",
	internal_server_error: "Server error, please try again.",
	invalid_email: "Invalid email address.",
	missing_reset_token: "Reset token missing.",
	invalid_reset_token: "Invalid or expired reset link.",
	invalid_password: "Password doesn't meet requirements.",
	not_authenticated: "You must be logged in.",
	bad_current_password: "Current password is incorrect.",
	password_mismatch: "Passwords don't match.",
	invalid_registration_data: "Invalid data, please check your inputs.",
	user_already_exists: "This email or username is already taken.",
	post_not_found: "This post does not exist.",
	comment_not_found: "This comment does not exist.",
	comment_delete_not_allowed: "You can only delete your own comment.",
	invalid_comment_data: "Invalid comment.",
	no_image: "No image provided.",
	error_stickers: "Unable to load stickers.",
	invalid_file_type: "Your file must be .jpeg, .png or .webp.",
	too_many_requests: "Too many attempts. Please wait a few minutes and try again.",
	test_log: "error here",
	no_sticker: "Please select a sticker.",
	invalid_sticker: "This sticker doesn't exist.",
	invalid_sticker_transform: "Invalid sticker placement.",
	invalid_image_data: "Invalid image data.",
};

const successMessages: Record<string, string> = {
	account_created: "Account created! Check your email to confirm.",
	email_confirmed: "Email confirmed, you can now log in.",
	forgot_password_email_sent: "Reset link sent, check your email.",
	logout_successful: "You have been logged out.",
	password_reset_successful: "Password reset, you can now log in.",
	password_changed: "Password changed successfully.",
	profile_changed: "Your profile has been changed.",
	comment_added: "Comment posted successfully.",
	comment_deleted: "Comment deleted successfully.",
	create_ready: "Create page is ready.",
	capture_created: "Your picture has been created.",
	picture_deleted: "Your picture has been deleted successfully.",
	login_successful: "You are logged in.",
	like_toggled: "Like updated.",
};

export function getErrorMessage(error: string): string {
  return errorMessages[error] ?? "An error occurred.";
}

export function getSuccessMessage(success: string): string {
  return successMessages[success] ?? "Success.";
}

export function showHeaderMessage(
  message: string,
  type: HeaderMessageType,
): void {
  const header = document.querySelector("header");

  if (!header) return;

  const existingFlash = document.getElementById("site-flash");

  if (existingFlash) {
    existingFlash.remove();
  }

  const flash = document.createElement("div");

  flash.id = "site-flash";
  flash.className = [
    "fixed",
    "right-4",
    "top-4",
    "z-50",
    "max-w-sm",
    "rounded-md",
    "px-4",
    "py-3",
    "text-sm",
    "font-medium",
    "shadow-lg",
    type === "error" ? "bg-red-500 text-white" : "bg-emerald-500 text-white",
  ].join(" ");

  flash.textContent = message;

  header.appendChild(flash);

  setTimeout(() => {
    flash.remove();
  }, 3000);
}
