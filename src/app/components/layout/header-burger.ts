"use client";

import { useEffect } from "react";

export function initHeaderBurger(): void {
  const hamburgerMenu = document.getElementById("hamburger-menu");
  const menuList = document.querySelector(".menu-list");

  if (hamburgerMenu && menuList) {
    hamburgerMenu.addEventListener("click", () => {
      menuList.classList.toggle("show-menu");
    });
  }
}

export function useHeaderBurger(): void {
  useEffect(() => {
    initHeaderBurger();
  }, []);
}
