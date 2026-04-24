"use client";
import { useState } from "react";
import CarouselModal from "./carouselModal";
import { useRouter } from "next/navigation";
import { Settings } from "lucide-react";

interface CarouselAdminToolsProps {
  compact?: boolean;
}

export default function CarouselAdminTools({ compact = false }: CarouselAdminToolsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <div className={compact ? "" : "fixed bottom-8 right-8 z-[100]"}>
        <button 
          onClick={() => setIsOpen(true)}
          className={`bg-stone-900 text-white rounded-full shadow-2xl hover:bg-orange-600 transition-all flex items-center gap-2 group ${compact ? "px-3 py-2" : "p-4"}`}
        >
          <Settings size={compact ? 16 : 20} className="group-hover:rotate-90 transition-transform duration-500" />
          <span className={`font-bold uppercase tracking-widest ${compact ? "text-[10px]" : "text-xs hidden md:inline"}`}>
            Gestionar Carrusel
          </span>
        </button>
      </div>

      <CarouselModal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        onSave={() => {
          router.refresh(); // Esto hace que la HomePage vuelva a ejecutar listCarouselItems()
        }}
      />
    </>
  );
}