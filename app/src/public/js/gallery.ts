const galleryContainer = document.getElementById(
  "gallery-container",
) as HTMLDivElement | null;
const prevBtn = document.getElementById("prev-btn") as HTMLAnchorElement | null;
const nextBtn = document.getElementById("next-btn") as HTMLAnchorElement | null;
const pageInfo = document.getElementById("page-info") as HTMLSpanElement | null;

let currentPage: number = 1;
let totalPages: number = 1;

interface Picture {
  _id: string;
  filepath: string;
  author: string;
  likesCount: number;
  comments: unknown[];
}

interface GalleryResponse {
  pictures: Picture[];
  totalPages: number;
}

async function getData(page: number): Promise<void> {
  const url = `/gallery/pictures?page=${page}`;

  try {
    const response = await fetch(url);

    if (!response.ok) throw new Error(`error : ${response.status}`);

    if (!galleryContainer) throw new Error("error : internal server error");

    const data: GalleryResponse = await response.json();

    galleryContainer.innerHTML = data.pictures
      .map(
        (pic) => `
        <div class="bg-white rounded-md">
            <a href="/pages/gallery/${pic._id}" class="w-full">
                <img class="rounded-t-base w-full max-h-[450px] object-cover" src="${pic.filepath}" alt="Picture by ${pic.author}" />
            </a>

            <div class="p-2 flex justify-between items-center">
                <span class="bg-violet-100 text-xs font-medium px-1.5 py-0.5 rounded-sm w-fit">
                    ${pic.author}
                </span>

                <div class="flex gap-3">
                  <span data-id="${pic._id}">
                    <p class="text-sm text-gray-500 inline-block">
                      ${pic.likesCount}
                    </p>
                    <i class="fa-solid fa-heart text-red-500"></i>
                  </span>
                  <span data-id="${pic._id}">
                    <p class="text-sm text-gray-500 inline-block">
                      ${pic.comments.length}
                    </p>
                    <i class="fa-solid fa-comment text-gray-300"></i>
                  </span>
                </div>
            </div>
        </div>
      `,
      )
      .join("");

    if (prevBtn) prevBtn.style.opacity = page <= 1 ? "0.3" : "1";

    if (nextBtn) nextBtn.style.opacity = page >= data.totalPages ? "0.3" : "1";

    if (pageInfo) pageInfo.textContent = `Page ${page} / ${data.totalPages}`;

    totalPages = data.totalPages;
  } catch (error) {
    console.error(error);
  }
}

prevBtn?.addEventListener("click", (e: MouseEvent) => {
  e.preventDefault();

  if (currentPage > 1) getData(--currentPage);
});

nextBtn?.addEventListener("click", (e: MouseEvent) => {
  e.preventDefault();

  if (currentPage < totalPages) getData(++currentPage);
});

getData(currentPage);
