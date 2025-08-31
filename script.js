/* ======== Portfolio Rows (edit me) ======== */
const projects = [
  {
    title: "BRAND",
    image: "",           // optional: put an image URL here
    url: ""              // optional: click-through link
  },
  {
    title: "DIGITAL",
    image: "",           // optional
    url: ""
  },
  {
    title: "STREETWEAR",
    image: "",           // optional
    url: ""
  }
];

/* ======== DOM ======== */
const listContainer = document.querySelector(".projects-container");
const bgImg = document.getElementById("background-image");

/* Utility: set background image safely */
function setBackground(src) {
  if (!bgImg) return;
  if (!src) {
    bgImg.removeAttribute("src");
    bgImg.removeAttribute("style");
    return;
  }

  // show the image element if hidden by CSS and set src
  bgImg.style.opacity = 1;
  bgImg.src = src;

  // If GSAP exists, add a subtle zoom-in on hover swap
  if (window.gsap) {
    gsap.killTweensOf(bgImg);
    gsap.fromTo(
      bgImg,
      { scale: 1.02, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.4, ease: "power2.out" }
    );
  }
}

/* Render a single row */
function createRow(project) {
  const row = document.createElement(project.url ? "a" : "div");
  row.className = "project-row";
  if (project.url) {
    row.href = project.url;
    row.target = "_blank";
    row.rel = "noopener noreferrer";
  }

  const title = document.createElement("span");
  title.className = "project-title";
  title.textContent = project.title.toUpperCase();

  // If your CSS expects a right column (e.g., years), we leave it empty
  const right = document.createElement("span");
  right.className = "project-right"; // keeps layout/grid consistent

  row.appendChild(title);
  row.appendChild(right);

  // Hover/Focus background behavior
  const show = () => setBackground(project.image || "");
  const clear = () => setBackground("");

  row.addEventListener("mouseenter", show);
  row.addEventListener("focus", show);
  row.addEventListener("mouseleave", clear);
  row.addEventListener("blur", clear);

  return row;
}

/* Clear current list and render all */
function renderProjects(items) {
  if (!listContainer) return;
  listContainer.innerHTML = "";
  items.forEach(p => listContainer.appendChild(createRow(p)));
}

/* Init */
renderProjects(projects);

/* Keyboard navigation nicety (up/down to move focus) */
document.addEventListener("keydown", (e) => {
  const rows = Array.from(document.querySelectorAll(".project-row"));
  const i = rows.indexOf(document.activeElement);
  if (e.key === "ArrowDown") {
    e.preventDefault();
    (rows[i + 1] || rows[0]).focus();
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    (rows[i - 1] || rows[rows.length - 1]).focus();
  }
});

