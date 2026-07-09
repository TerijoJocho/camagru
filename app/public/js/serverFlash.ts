const flash = document.getElementById("site-flash");

function clearFlashQueryParams(): void {
  const url = new URL(window.location.href);
  const hadFlashParam =
    url.searchParams.has("error") || url.searchParams.has("success");

  if (!hadFlashParam) return;

  url.searchParams.delete("error");
  url.searchParams.delete("success");

  const nextUrl = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState({}, "", nextUrl);
}

if (flash) {
  window.setTimeout(() => {
    flash.remove();
  }, 3000);
}

clearFlashQueryParams();
