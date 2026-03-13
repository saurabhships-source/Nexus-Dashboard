/* ===== FORCE UI TO BE CLICKABLE ===== */

document.addEventListener("DOMContentLoaded", function () {

  // Remove modal backdrop if it blocks clicks
  const backdrop = document.getElementById("modalBackdrop");
  if (backdrop) {
    backdrop.style.display = "none";
  }

  // Enable pointer events everywhere
  document.body.style.pointerEvents = "auto";

  // Safety fix for overlays
  const overlays = document.querySelectorAll(".modal, .modal-backdrop, .overlay");
  overlays.forEach(el => {
    el.classList.add("hidden");
  });

});
