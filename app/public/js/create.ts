import {
  showHeaderMessage,
  getErrorMessage,
  getSuccessMessage,
} from "./feedbacks.js";

const video = document.getElementById("webcam") as HTMLVideoElement;
const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const captureBtn = document.getElementById("capture-btn") as HTMLButtonElement;
const uploadInput = document.getElementById("upload-input") as HTMLInputElement;
const userPicturesContainer = document.getElementById("user-pictures") as HTMLDivElement;
const deleteModal = document.getElementById("delete-modal") as HTMLDivElement;
const deleteForm = document.getElementById("delete-form") as HTMLFormElement;
const deleteInput = document.getElementById("delete-picture-id") as HTMLInputElement;
const cancelDelete = document.getElementById("cancel-delete") as HTMLButtonElement;
const confirmDelete = document.getElementById("confirm-delete") as HTMLButtonElement;
const ctx = canvas.getContext("2d")!;
const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;
let isDragging = false;

let animationId: number | null = null;

let stickerImage: HTMLImageElement | null = null;

let sticker = {
  x: 300,
  y: 200,
  scale: 1,
  rotation: 0,
};

let baseImage: HTMLVideoElement | HTMLImageElement | null = video;
let mode: "webcam" | "upload" = "webcam";

uploadInput.addEventListener("change", () => {
  const files = uploadInput.files;
  const file = files ? files[0] : null;
  if (!file) return;

  const img = new Image();
  img.src = URL.createObjectURL(file);

  img.onload = () => {
    mode = "upload";
    baseImage = img;

    const stream = video.srcObject as MediaStream | null;
    if (stream) {
      stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
    }
    video.srcObject = null;

    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    sticker.x = canvas.width / 2;
    sticker.y = canvas.height / 2;

    stopRendering();
    startRendering();
  };
});

async function getVideo(): Promise<void> {
  mode = "webcam";
  baseImage = video;
  if (!video) return;

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    video.src = "fallbackvideo.webm";
    return;
  }

  captureBtn.addEventListener("click", () => {
    capture();
  });

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { exact: 1280 }, height: { exact: 720 } },
    });

    video.srcObject = stream;

    video.addEventListener("loadedmetadata", () => {
      if (mode !== "webcam") return;

      canvas.width = CANVAS_WIDTH;
      canvas.height = CANVAS_HEIGHT;

      startRendering();
    });
  } catch (error) {
    console.error("Webcam access denied:", error);
    video.src = "fallbackvideo.webm";
  }
}

async function getStickers(): Promise<void> {
  const container = document.getElementById("sticker-list");
  const captureBtn = document.getElementById(
    "capture-btn",
  ) as HTMLButtonElement;

  if (!container || !captureBtn) return;

  try {
    const response = await fetch("/create/stickers", {
      method: "GET",
      headers: { "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") ?? "" },
    });
    const data = await response.json();
    const stickers: string[] = data.stickers;

    stickers.forEach((sticker) => {
      const img = document.createElement("img");

      img.src = `/stickers/${sticker}`;
      img.alt = sticker;
      img.className =
        "w-10 h-10 object-cover cursor-pointer border-2 border-transparent rounded";

      img.addEventListener("click", () => {
        // Retire la sélection précédente
        container.querySelectorAll("img").forEach((image) => {
          image.classList.remove("border-violet-400");
          image.classList.add("border-transparent");
        });

        // Sélectionne le sticker courant
        img.classList.remove("border-transparent");
        img.classList.add("border-violet-400");

        stickerImage = new Image();
        stickerImage.src = `/stickers/${sticker}`;

        captureBtn.disabled = false;
        captureBtn.classList.remove("opacity-50");
      });

      container.appendChild(img);
    });
  } catch (error) {
    void error;
  }
}

function drawContain(image: HTMLImageElement | HTMLVideoElement): void {
  const imageWidth =
    image instanceof HTMLVideoElement ? image.videoWidth : image.width;

  const imageHeight =
    image instanceof HTMLVideoElement ? image.videoHeight : image.height;

  const imageRatio = imageWidth / imageHeight;
  const canvasRatio = canvas.width / canvas.height;

  let drawWidth: number;
  let drawHeight: number;
  let x: number;
  let y: number;

  if (imageRatio > canvasRatio) {
    drawHeight = canvas.height;
    drawWidth = drawHeight * imageRatio;
    y = 0;
    x = (canvas.width - drawWidth) / 2;
  } else {
    drawWidth = canvas.width;
    drawHeight = drawWidth / imageRatio;
    x = 0;
    y = (canvas.height - drawHeight) / 2;
  }

  ctx.drawImage(image, x, y, drawWidth, drawHeight);
}

function startRendering(): void {
  const render = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (mode === "webcam" && video) {
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
      ctx.restore();
    } else if (mode === "upload" && baseImage) {
      drawContain(baseImage);
    }

    if (stickerImage && stickerImage.complete) {
      ctx.save();
      ctx.translate(sticker.x, sticker.y);
      ctx.rotate(sticker.rotation);
      ctx.scale(sticker.scale, sticker.scale);
      ctx.drawImage(stickerImage, -stickerImage.width / 2, -stickerImage.height / 2);
      ctx.restore();
    }

    animationId = requestAnimationFrame(render);
  };

  render();
}

function isMouseOnSticker(mouseX: number, mouseY: number): boolean {
  if (!stickerImage) return false;

  const w = stickerImage.width * sticker.scale;
  const h = stickerImage.height * sticker.scale;

  const left = sticker.x - w / 2;
  const right = sticker.x + w / 2;
  const top = sticker.y - h / 2;
  const bottom = sticker.y + h / 2;

  return mouseX >= left && mouseX <= right && mouseY >= top && mouseY <= bottom;
}

function enableDragging(): void {
  let dragOffsetX = 0;
  let dragOffsetY = 0;

  canvas.addEventListener("mousedown", (event: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();

    const x = (event.clientX - rect.left) * (canvas.width / rect.width);
    const y = (event.clientY - rect.top) * (canvas.height / rect.height);

    if (isMouseOnSticker(x, y)) {
      isDragging = true;
      dragOffsetX = x - sticker.x;
      dragOffsetY = y - sticker.y;
    }
  });

  canvas.addEventListener("mouseup", () => {
    isDragging = false;
  });

  canvas.addEventListener("mouseleave", () => {
    isDragging = false;
  });

  canvas.addEventListener("mousemove", (event: MouseEvent) => {
    if (!isDragging) return;

    const rect = canvas.getBoundingClientRect();

    sticker.x =
      (event.clientX - rect.left) * (canvas.width / rect.width) - dragOffsetX;
    sticker.y =
      (event.clientY - rect.top) * (canvas.height / rect.height) - dragOffsetY;
  });
}

function setupControls(): void {
  const scaleInput = document.getElementById("scale") as HTMLInputElement;
  const rotationInput = document.getElementById("rotation") as HTMLInputElement;

  if (!scaleInput || !rotationInput) return;

  scaleInput.addEventListener("input", () => {
    sticker.scale = Number(scaleInput.value);
  });

  rotationInput.addEventListener("input", () => {
    sticker.rotation = (Number(rotationInput.value) * Math.PI) / 180;
  });
}

function stopRendering(): void {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}

async function capture(): Promise<void> {
  captureBtn.disabled = true;

  const imageBase64 = canvas.toDataURL("image/jpeg", 0.9);

  try {
    const result = await fetch("/create/capture", {
      method: "POST",
      headers: {
        "Content-type": "application/json",
        "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") ?? "",
      },
      body: JSON.stringify({
        image: imageBase64,
      }),
    });

    const data = await result.json();
    if (!result.ok) {
      showHeaderMessage(getErrorMessage(data.error), "error");
      return;
    }

    showHeaderMessage(getSuccessMessage(data.success), "success");
    renderPictures();
  } catch (error) {
    showHeaderMessage("Capture failed", "error");
  } finally {
    if (stickerImage) captureBtn.disabled = false;
  }
}

function openDeleteModal(pictureId: string): void {
  deleteInput.value = pictureId;
  deleteModal.classList.remove("hidden");
  deleteModal.classList.add("flex");
}

cancelDelete.addEventListener("click", () => {
  deleteModal.classList.remove("flex");
  deleteModal.classList.add("hidden");
});

deleteForm?.addEventListener("submit", async (event: SubmitEvent) => {
  event.preventDefault();

  const pictureId = deleteInput.value;
  if (!pictureId) return;

  confirmDelete.disabled = true;

  try {
    const result = await fetch("/create/delete", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") ?? "",
      },
      body: JSON.stringify({ pictureId }),
    });

    const data = await result.json();

    if (!result.ok) {
      showHeaderMessage(getErrorMessage(data.error), "error");
      return;
    }

    document.getElementById(`picture-card-${pictureId}`)?.remove();
    showHeaderMessage(getSuccessMessage(data.success), "success");
    deleteModal.classList.remove("flex");
    deleteModal.classList.add("hidden");
  } catch (error) {
    showHeaderMessage(getErrorMessage("internal_server_error"), "error");
  } finally {
    confirmDelete.disabled = false;
  }
});

async function renderPictures(): Promise<void> {
  try {
    const result = await fetch("/create/user-pictures", {
      method: "GET",
      headers: { "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") ?? "" },
    });
    const data = await result.json();
    if (!result.ok) {
      showHeaderMessage(getErrorMessage(data.error), "error");
      return;
    }
    const pictures = data.pictures;

    userPicturesContainer.innerHTML = "";

    pictures.forEach((pic: any) => {
      const card = document.createElement("div");
      card.id = `picture-card-${pic._id}`;
      card.className = "relative";

      const img = document.createElement("img");
      img.src = `/uploads/${pic.filepath}`;
      // img.alt = pic; //mettre la description de la picture a terme
      img.className = "w-full aspect-square object-cover rounded-md";

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.textContent = "Delete";
      deleteBtn.className =
        "absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded";
      deleteBtn.addEventListener("click", () => {
        openDeleteModal(pic._id);
      });

      card.appendChild(img);
      card.appendChild(deleteBtn);
      userPicturesContainer.appendChild(card);
    });
  } catch (error) {}
}

getVideo();
getStickers();
enableDragging();
setupControls();
renderPictures();
