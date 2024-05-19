// inject css to hide scrollbar
window.addEventListener("DOMContentLoaded", () => {
  let el = document.createElement("style");
  el.textContent = "* {-ms-overflow-style: none; scrollbar-width: none;}";
});
