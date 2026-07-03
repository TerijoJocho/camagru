async function getVideo(): Promise<void> {
  const video = document.querySelector("video") as HTMLVideoElement;
  if (!video) return;

  if (!navigator.mediaDevices?.getUserMedia) {
    video.src = "fallbackvideo.webm";
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { exact: 1280 }, height: { exact: 720 } }
    });
    video.srcObject = stream;
  } catch (error) {
    console.error("Webcam access denied:", error);
    video.src = "fallbackvideo.webm";
  }
}

let selectedSticker: string | null = null;

async function getStickers(): Promise<void> {
  const container = document.getElementById("sticker-list");
  const captureBtn = document.getElementById("capture-btn") as HTMLButtonElement;

  if (!container || !captureBtn)
    return;

  try {
    const response = await fetch("/editor/stickers");
    const stickers: string[] = await response.json();

    stickers.forEach((sticker) => {
      const img = document.createElement("img");

      img.src = `/stickers/${sticker}`;
      img.alt = sticker;
      img.className =
        "w-20 h-20 object-contain cursor-pointer border-2 border-transparent rounded";

      img.addEventListener("click", () => {
        // Retire la sélection précédente
        container.querySelectorAll("img").forEach((image) => {
          image.classList.remove("border-blue-500");
          image.classList.add("border-transparent");
        });

        // Sélectionne le sticker courant
        img.classList.remove("border-transparent");
        img.classList.add("border-blue-500");

        selectedSticker = sticker;

        captureBtn.disabled = false;
        captureBtn.classList.remove("opacity-50");
      });

      container.appendChild(img);
    });
  } catch (error) {
    void error;
  }
}

getVideo();
getStickers();