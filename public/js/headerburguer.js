document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM cargado y script funcionando");

  const hamburgerMenu = document.getElementById("hamburger-menu");
  const menuList = document.querySelector(".menu-list");

  if (hamburgerMenu && menuList) {
    console.log("Menú hamburguesa y menú encontrados");
    hamburgerMenu.addEventListener("click", function () {
      console.log("Menú hamburguesa clickeado");
      menuList.classList.toggle("show-menu");
    });
  } else {
    console.log("No se encontraron los elementos hamburgerMenu o menuList");
  }
});
