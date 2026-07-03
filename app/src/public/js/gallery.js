const galleryContainer = document.getElementById("gallery-container");
let currentPage = 1;
let totalPages = 1;

async function getData(page) {
  const url = `https://localhost/gallery/pictures?page=${page}`;
  try {
    const reponse = await fetch(url);
    if (!reponse.ok)
      throw new Error(`error : ${reponse.status}`);

    if (!galleryContainer)
        throw new Error("error : internal server error");

    const data = await reponse.json();
    
    galleryContainer.innerHTML = data.pictures.map((pic) => `
        <div class="bg-white  rounded-md">
            <a href="/comment-section">
                <img class="rounded-t-base" src="${pic.filepath}" alt="Picture by ${pic.author}" />
            </a>
            <div class="p-2 flex flex-col ">
                <span class="inline-flex items-center bg-brand-softer border border-brand-subtle text-fg-brand-strong text-xs font-medium px-1.5 py-0.5 rounded-sm">
                    ${pic.author}
                </span>
                
               <span class="inline-flex items-center bg-brand-softer border border-brand-subtle text-fg-brand-strong text-xs font-medium px-1.5 py-0.5 rounded-sm">
                   ${pic.likesCount}
                </span>
            </div>
        </div>
    `).join("");

    document.getElementById("prev-btn").style.opacity = page <= 1 ? "0.3" : "1";
    document.getElementById("next-btn").style.opacity = page >= data.totalPages ? "0.3" : "1";
    document.getElementById("page-info").textContent = `Page ${page} / ${data.totalPages}`;
    totalPages = data.totalPages;
  } catch (erreur) {
    console.error(erreur);
  }
}

document.getElementById("prev-btn").addEventListener("click", (e) => {
  e.preventDefault();
  if (currentPage > 1) getData(--currentPage);
});

document.getElementById("next-btn").addEventListener("click", (e) => {
  e.preventDefault();
  if (currentPage < totalPages)
    getData(++currentPage);
});

getData(currentPage);