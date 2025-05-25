"use client";

import { useEffect, useRef, useState } from "react";
import "./carousel.css"; 

interface CarouselItem {
  imageDesktop: string;
  imageMobile: string;
  alt: string;
  link?: string;
  buttonText?: string;
}

export default function Carousel() {
  const [items, setItems] = useState<CarouselItem[]>([]);
  const [index, setIndex] = useState(0);
  const slideRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/carousel")
      .then((res) => res.json())
      .then(setItems)
      .catch(console.error);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => moveSlide(1), 40000);
    return () => clearInterval(interval);
  }, [index, items]);

  const moveSlide = (direction: number) => {
    setIndex((prev) => (prev + direction + items.length) % items.length);
  };

  useEffect(() => {
    const slide = slideRef.current;
    if (!slide) return;

    let touchStartX = 0;
    let touchEndX = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.changedTouches[0].screenX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      touchEndX = e.changedTouches[0].screenX;
      if (touchEndX < touchStartX - 50) moveSlide(1);
      if (touchEndX > touchStartX + 50) moveSlide(-1);
    };

    slide.addEventListener("touchstart", handleTouchStart);
    slide.addEventListener("touchend", handleTouchEnd);
    return () => {
      slide.removeEventListener("touchstart", handleTouchStart);
      slide.removeEventListener("touchend", handleTouchEnd);
    };
  }, [items]);

  if (items.length === 0) {
    return <div className="carousel-container"></div>;
  }

  return (
    <div className="carousel-container">
      <div
        id="carousel-slide"
        ref={slideRef}
        className="carousel-wrapper"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {items.map((item, i) => (
          <div className="carousel-item" key={i}>
            <picture>
              <source media="(max-width: 768px)" srcSet={item.imageMobile} />
              <source media="(min-width: 769px)" srcSet={item.imageDesktop} />
              <img src={item.imageDesktop} alt={item.alt} loading="lazy" />
            </picture>
            {item.link && (
              <a href={item.link} className="overlay-button">
                {item.buttonText}
              </a>
            )}
          </div>
        ))}
      </div>

      <button className="carousel-button left" onClick={() => moveSlide(-1)}>
        &#10094;
      </button>
      <button className="carousel-button right" onClick={() => moveSlide(1)}>
        &#10095;
      </button>
    </div>
  );
}
