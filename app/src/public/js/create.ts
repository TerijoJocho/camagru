const video = document.getElementById("webcam") as HTMLVideoElement;
const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const captureBtn = document.getElementById("capture-btn") as HTMLButtonElement;
const uploadInput = document.getElementById("upload-input") as HTMLInputElement;
const ctx = canvas.getContext("2d")!;
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

function showHeaderMessage(message: string, type: "error" | "success"): void {
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

  window.setTimeout(() => {
    flash.remove();
  }, 3000);
}

uploadInput.addEventListener("change", () => {
  const file = uploadInput.files?.[0];
  if (!file) return;

  const img = new Image();
  img.src = URL.createObjectURL(file);

  img.onload = () => {
    mode = "upload";
    baseImage = img;

    canvas.width = img.width;
    canvas.height = img.height;

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

  if (!navigator.mediaDevices?.getUserMedia) {
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

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

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
    const response = await fetch("/create/stickers");
    const data = await response.json();
    const stickers: string[] = data.stickers;

    stickers.forEach((sticker) => {
      const img = document.createElement("img");

      img.src = `/stickers/${sticker}`;
      img.alt = sticker;
      img.className =
        "w-10 h-10 object-contain cursor-pointer border-2 border-transparent rounded";

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

function startRendering(): void {
  const render = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (mode === "webcam" && video) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    } else if (mode === "upload" && baseImage) {
      ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
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
  canvas.addEventListener("mousedown", (event: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();

    const x = (event.clientX - rect.left) * (canvas.width / rect.width);
    const y = (event.clientY - rect.top) * (canvas.height / rect.height);

    if (isMouseOnSticker(x, y)) isDragging = true;
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

    sticker.x = (event.clientX - rect.left) * (canvas.width / rect.width);
    sticker.y = (event.clientY - rect.top) * (canvas.height / rect.height);
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
      },
      body: JSON.stringify({
        image: imageBase64,
      }),
    });

    const data = await result.json();
    if (!result.ok) {
      showHeaderMessage(data.error ?? "Capture failed", "error");
      return;
    }

    showHeaderMessage(
      data.success ?? "Picture created successfully",
      "success",
    );
  } catch (error) {
    console.error("Capture error:", error);
    showHeaderMessage("Capture failed", "error");
  } finally {
    if (stickerImage) captureBtn.disabled = false;
  }
}

getVideo();
getStickers();
enableDragging();
setupControls();
