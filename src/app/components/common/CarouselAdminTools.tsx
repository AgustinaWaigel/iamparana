"use client";
import { useState } from "react";
import CarouselModal from "./carouselModal";
import { useRouter } from "next/navigation";
import { Settings } from "lucide-react";
import { AdminActionButton } from "@/app/components/common/admin-action-button";

interface CarouselAdminToolsProps {
  compact?: boolean;
}

export default function CarouselAdminTools({ compact = false }: CarouselAdminToolsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <div className={compact ? "" : "fixed bottom-8 right-8 z-[100]"}>
        <AdminActionButton
          onClick={() => setIsOpen(true)}
          action="add"
          icon={Settings}
          label="Gestionar Carrusel"
          compact={compact}
          className={`shadow-lg hover:shadow-xl ${compact ? "px-3 py-2" : "p-4"} ${compact ? "" : "rounded-full"}`}
        >
        </AdminActionButton>
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