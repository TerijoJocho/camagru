import {
  showHeaderMessage,
  getErrorMessage,
  getSuccessMessage,
} from "./feedbacks.js";

const video = document.getElementById("webcam") as HTMLVideoElement;
const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const captureBtn = document.getElementById("capture-btn") as HTMLButtonElement;
const webcamToggleBtn = document.getElementById("webcam-toggle") as HTMLButtonElement;
const uploadInput = document.getElementById("upload-input") as HTMLInputElement;
const userPicturesContainer = document.getElementById("user-pictures") as HTMLDivElement;
const deleteModal = document.getElementById("delete-modal") as HTMLDivElement;
const deleteForm = document.getElementById("delete-form") as HTMLFormElement;
const deleteInput = document.getElementById("delete-picture-id") as HTMLInputElement;
const cancelDelete = document.getElementById("cancel-delete") as HTMLButtonElement;
const confirmDelete = document.getElementById("confirm-delete") as HTMLButtonElement;
const scaleInput = document.getElementById("scale") as HTMLInputElement;
const rotationInput = document.getElementById("rotation") as HTMLInputElement;
const ctx = canvas.getContext("2d")!;
const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;

let isDragging = false;
let animationId: number | null = null;
let webcamStream: MediaStream | null = null;
let webcamEnabled = false;

let stickerImage: HTMLImageElement | null = null;
let selectedStickerFilename: string | null = null;

let sticker = {
  x: 300,
  y: 200,
  scale: 1,
  rotation: 0,
};

let baseImage: HTMLVideoElement | HTMLImageElement | null = video;
let mode: "webcam" | "upload" = "webcam";

function computeMaxStickerScale(rotationRadians: number = sticker.rotation): number {
  if (!stickerImage || !stickerImage.complete || !stickerImage.width || !stickerImage.height) {
    return 2;
  }

  const sin = Math.abs(Math.sin(rotationRadians));
  const cos = Math.abs(Math.cos(rotationRadians));
  const rotatedWidthAtScaleOne = stickerImage.width * cos + stickerImage.height * sin;
  const rotatedHeightAtScaleOne = stickerImage.width * sin + stickerImage.height * cos;

  if (!rotatedWidthAtScaleOne || !rotatedHeightAtScaleOne) {
    return 0.1;
  }

  return Math.max(
    0.1,
    Math.min(2, CANVAS_WIDTH / rotatedWidthAtScaleOne, CANVAS_HEIGHT / rotatedHeightAtScaleOne),
  );
}

function syncScaleInputBounds(): void {
  if (!scaleInput) return;

  const maxScale = Math.max(0.1, computeMaxStickerScale());
  const minScale = maxScale < 0.2 ? 0.1 : 0.2;

  scaleInput.min = minScale.toFixed(1);
  scaleInput.max = maxScale.toFixed(2);

  const currentScale = Number(scaleInput.value);
  const boundedScale = Math.min(Math.max(currentScale, minScale), maxScale);

  if (boundedScale !== currentScale) {
    scaleInput.value = boundedScale.toFixed(2);
  }

  sticker.scale = boundedScale;
}

function updateCaptureButtonState(): void {
  const hasSource = mode === "upload" || webcamEnabled;
  const isEnabled = Boolean(stickerImage && hasSource);

  captureBtn.disabled = !isEnabled;
  captureBtn.classList.toggle("opacity-50", !isEnabled);
}

function updateWebcamToggleLabel(): void {
  webcamToggleBtn.textContent = webcamEnabled
    ? "Disable the webcam"
    : "Activate the webcam";

  webcamToggleBtn.classList.toggle("bg-gray-500", webcamEnabled);
  webcamToggleBtn.classList.toggle("bg-green-500", !webcamEnabled);
}

function stopWebcamStream(): void {
  if (webcamStream) {
    webcamStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
    webcamStream = null;
  }

  video.srcObject = null;
  video.classList.add("hidden");
  webcamEnabled = false;
  updateWebcamToggleLabel();
  updateCaptureButtonState();
}

async function startWebcamStream(): Promise<void> {
  mode = "webcam";
  baseImage = video;

  if (!navigator.mediaDevices?.getUserMedia) {
    stopWebcamStream();
    showHeaderMessage(
      "La webcam n'est pas supportée sur ce navigateur.",
      "error",
    );
    startRendering();
    return;
  }

  try {
    webcamStream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: CANVAS_WIDTH },
        height: { ideal: CANVAS_HEIGHT },
      },
    });

    video.srcObject = webcamStream;
    video.classList.remove("hidden");
    await video.play();
    webcamEnabled = true;
    updateWebcamToggleLabel();
    updateCaptureButtonState();
    startRendering();
  } catch (error) {
    stopWebcamStream();
    mode = "webcam";
    baseImage = null;
    const reason =
      error instanceof DOMException && error.name === "NotAllowedError"
        ? "Camera access denied — use the upload button below."
        : "Unable to activate the webcam at the moment.";
    showHeaderMessage(reason, "error");
    startRendering();
  }
}

uploadInput.addEventListener("change", () => {
  const files = uploadInput.files;
  const file = files ? files[0] : null;
  if (!file) return;

  const img = new Image();
  img.src = URL.createObjectURL(file);

  img.onload = () => {
    mode = "upload";
    baseImage = img;

    stopWebcamStream();

    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    sticker.x = canvas.width / 2;
    sticker.y = canvas.height / 2;

    updateCaptureButtonState();
    startRendering();
  };
});

async function getVideo(): Promise<void> {
  if (!video) return;

  captureBtn.addEventListener("click", () => {
    void capture();
  });

  webcamToggleBtn.addEventListener("click", async () => {
    webcamToggleBtn.disabled = true;

    try {
      if (webcamEnabled) {
        stopWebcamStream();
        startRendering();
        return;
      }

      await startWebcamStream();
    } finally {
      webcamToggleBtn.disabled = false;
    }
  });

  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  await startWebcamStream();
}

async function getStickers(): Promise<void> {
  const container = document.getElementById("sticker-list");

  if (!container) return;

  try {
    const response = await fetch("/create/stickers", {
      method: "GET",
	  credentials: "include",
      headers: {
        "X-CSRF-Token":
          document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute("content") ?? "",
      },
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
        container.querySelectorAll("img").forEach((image) => {
          image.classList.remove("border-violet-400");
          image.classList.add("border-transparent");
        });

        img.classList.remove("border-transparent");
        img.classList.add("border-violet-400");

        stickerImage = new Image();
        stickerImage.onload = () => {
          syncScaleInputBounds();
          updateCaptureButtonState();
        };
        stickerImage.src = `/stickers/${sticker}`;
		selectedStickerFilename = sticker;

        syncScaleInputBounds();
        updateCaptureButtonState();
      });

      container.appendChild(img);
    });
  } catch (error) {
    void error;
  }
}

function drawContain(image: HTMLImageElement | HTMLVideoElement, targetCtx: CanvasRenderingContext2D = ctx): void {
  const imageWidth = image instanceof HTMLVideoElement ? image.videoWidth : image.width;
  const imageHeight = image instanceof HTMLVideoElement ? image.videoHeight : image.height;

  if (!imageWidth || !imageHeight) return;

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

  targetCtx.drawImage(image, x, y, drawWidth, drawHeight);
}

function startRendering(): void {
  if (animationId !== null) return;

  const render = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (mode === "webcam") {
      if (
        webcamEnabled &&
        video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
      ) {
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
        ctx.restore();
      } else {
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    } else if (mode === "upload" && baseImage) {
      drawContain(baseImage);
    }

    if (stickerImage && stickerImage.complete) {
      ctx.save();
      ctx.translate(sticker.x, sticker.y);
      ctx.rotate(sticker.rotation);
      ctx.scale(sticker.scale, sticker.scale);
      ctx.drawImage(
        stickerImage,
        -stickerImage.width / 2,
        -stickerImage.height / 2,
      );
      ctx.restore();
    }

    animationId = requestAnimationFrame(render);
  };

  animationId = requestAnimationFrame(render);
}

function stopRendering(): void {
  if (animationId !== null) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
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
  if (!scaleInput || !rotationInput) return;

  scaleInput.addEventListener("input", () => {
    sticker.scale = Math.min(Number(scaleInput.value), computeMaxStickerScale());
  });

  rotationInput.addEventListener("input", () => {
    sticker.rotation = (Number(rotationInput.value) * Math.PI) / 180;
    syncScaleInputBounds();
  });

  syncScaleInputBounds();
}

function captureBackgroundDataURL(): string {
  const bgCanvas = document.createElement("canvas");
  bgCanvas.width = CANVAS_WIDTH;
  bgCanvas.height = CANVAS_HEIGHT;
  const bgCtx = bgCanvas.getContext("2d")!;

  if (mode === "webcam" && webcamEnabled) {
    bgCtx.save();
    bgCtx.scale(-1, 1);
    bgCtx.drawImage(video, -CANVAS_WIDTH, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    bgCtx.restore();
  } else if (mode === "upload" && baseImage) {
    drawContain(baseImage, bgCtx);
  }

  return bgCanvas.toDataURL("image/jpeg", 0.9);
}

async function capture(): Promise<void> {
	if (!stickerImage || !selectedStickerFilename) return;

	captureBtn.disabled = true;

	const backgroundDataUrl = captureBackgroundDataURL();
	const rotateDegrees = (sticker.rotation * 180) / Math.PI;

	try {
	  const result = await fetch("/create/capture", {
		method: "POST",
		credentials: "include",
		headers: {
			"Content-type": "application/json",
			"X-CSRF-Token": document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") ?? "",
		},
		body: JSON.stringify({
				image: backgroundDataUrl,
				sticker: selectedStickerFilename,
				x: sticker.x,
				y: sticker.y,
				scale: sticker.scale,
				rotation: rotateDegrees,
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
		updateCaptureButtonState();
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
	  credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-CSRF-Token":
          document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute("content") ?? "",
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
	  credentials: "include",
      headers: {
        "X-CSRF-Token":
          document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute("content") ?? "",
      },
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
