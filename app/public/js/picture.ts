import {
  showHeaderMessage,
  getErrorMessage,
  getSuccessMessage,
} from "./feedbacks.js";

const likeForm = document.getElementById("like-form") as HTMLFormElement | null;
const likeCount = document.getElementById("like-count") as HTMLSpanElement | null;
const likeIcon = document.getElementById("like-icon") as HTMLElement | null;

const commentForm = document.getElementById("comment-form") as HTMLFormElement | null;
const commentInput = document.getElementById("comment-input") as HTMLTextAreaElement | null;
const commentsList = document.getElementById("comments-list") as HTMLDivElement | null;

const deleteBtns = document.querySelectorAll<HTMLButtonElement>(".delete-comment-btn");

function wireDeleteCommentButton(btn: HTMLButtonElement): void {
  btn.addEventListener("click", async () => {
    const commentId = btn.dataset.commentId;
    const pictureId = btn.dataset.pictureId;

    if (!commentId || !pictureId) return;

    try {
      const res = await fetch(
        `/gallery/pictures/${pictureId}/comment/${commentId}`,
        {
          method: "DELETE",
          headers: {
            Accept: "application/json",
          },
        },
      );

      const data = await res.json();

      if (!res.ok) {
        showHeaderMessage(getErrorMessage(data.error), "error");
        return;
      }

      const comment = document.getElementById(`comment-${commentId}`);
      comment?.classList.add("opacity-0", "transition-opacity", "duration-300");

      setTimeout(() => {
        comment?.remove();
      }, 300);

      showHeaderMessage(getSuccessMessage(data.success), "success");
    } catch (error) {
      showHeaderMessage(getErrorMessage("internal_server_error"), "error");
    }
  });
}

likeForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    const response = await fetch(likeForm.action, {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      showHeaderMessage(getErrorMessage(data.error), "error");
      return;
    }

    if (likeCount) {
      likeCount.textContent = String(
        data.likesCount ?? likeCount.textContent ?? "0",
      );
    }

    if (likeIcon) {
      likeIcon.className = data.isLiked
        ? "fa-solid fa-heart text-red-500"
        : "fa-regular fa-heart";
    }

    showHeaderMessage(getSuccessMessage(data.success), "success");
  } catch (error) {
    showHeaderMessage(getErrorMessage("internal_server_error"), "error");
  }
});

commentForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!commentInput) return;

  const content = commentInput.value.trim();
  if (!content) return;

  try {
    const response = await fetch(commentForm.action, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ comment: content }),
    });

    const data = await response.json();

    if (!response.ok) {
      showHeaderMessage(getErrorMessage(data.error), "error");
      return;
    }

    if (commentsList && data.comment) {
      const comment = document.createElement("div");
      comment.id = `comment-${data.comment._id}`;
      comment.className = "border rounded-md bg-white flex flex-col relative";

      const headerRow = document.createElement("div");
      headerRow.className = "flex items-center";

      const author = document.createElement("p");
      author.className =
        "text-base font-medium px-2 py-1 rounded bg-violet-100 m-2";
      author.textContent = data.comment.author ?? "You";

      const date = document.createElement("p");
      date.className = "text-xs flex-1 px-2 py-1 italic text-gray-300";
      date.textContent = new Date(data.comment.createdAt).toLocaleDateString(
        "en-EN",
      );

      const content = document.createElement("p");
      content.className = "m-2";
      content.textContent = data.comment.content;

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "delete-comment-btn absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded";
      deleteButton.dataset.commentId = data.comment._id;
      deleteButton.dataset.pictureId = commentForm?.dataset.pictureId ?? "";
      deleteButton.innerHTML = '<i class="fa-regular fa-trash-can"></i>';
      wireDeleteCommentButton(deleteButton);

      headerRow.appendChild(author);
      headerRow.appendChild(date);
      comment.appendChild(headerRow);
      comment.appendChild(deleteButton);
      comment.appendChild(content);

      commentsList.prepend(comment);
      commentInput.value = "";
    }

    showHeaderMessage(getSuccessMessage(data.success), "success");
  } catch (error) {
    showHeaderMessage(getErrorMessage("internal_server_error"), "error");
  }
});

deleteBtns.forEach((btn) => {
  wireDeleteCommentButton(btn);
});
