"use client";

import { useEffect } from "react";

interface ComponentConfig {
  id: string;
  archivo: string;
  initCallback?: () => void;
}

async function cargarComponente(
  id: string,
  archivo: string,
  initCallback?: () => void
): Promise<void> {
  try {
    const response = await fetch(archivo);
    const html = await response.text();
    const element = document.getElementById(id);
    if (element) {
      element.innerHTML = html;
      if (initCallback) {
        initCallback();
      }
    }
  } catch (error) {
    console.error(`Error al cargar ${archivo}:`, error);
  }
}

function inicializarMenuHamburguesa(): void {
  const hamburgerMenu = document.querySelector(".hamburger-menu");
  const menuList = document.querySelector(".menu-list");

  if (hamburgerMenu && menuList) {
    hamburgerMenu.addEventListener("click", () => {
      menuList.classList.toggle("show-menu");
    });
  }
}

export function useComponentLoader(
  componentes: ComponentConfig[]
): void {
  useEffect(() => {
    componentes.forEach((comp) => {
      cargarComponente(comp.id, comp.archivo, comp.initCallback);
    });
  }, [componentes]);
}

export async function loadHeaderAndFooter(): Promise<void> {
  await cargarComponente("header", "/assets/resources/banner.html");
  await cargarComponente("footer", "/assets/resources/footer.html", () => {
    inicializarMenuHamburguesa();
  });
}
