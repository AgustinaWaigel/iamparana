document.addEventListener("DOMContentLoaded", () => {
  cargarComponente("header", "/assets/resources/banner.html");
  cargarComponente("footer", "/assets/resources/footer.html");
});

function cargarComponente(id, archivo) {
  fetch(archivo)
    .then((res) => res.text())
    .then((html) => {
      document.getElementById(id).innerHTML = html;
      if (id === "header") {
        inicializarMenuHamburguesa();
      }
    })
    .catch((err) => console.error(`Error al cargar ${archivo}:`, err));
}

function inicializarMenuHamburguesa() {
  const hamburgerMenu = document.querySelector(".hamburger-menu");
  const menuList = document.querySelector(".menu-list");
  hamburgerMenu.addEventListener("click", () => {
    menuList.classList.toggle("show-menu");
  });
}
