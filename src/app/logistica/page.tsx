export async function generateMetadata() {
  return {
    title: "Logística",
    description: "Resumen de gastos y transparencia en eventos realizados",
    openGraph: {
      title: "Logística",
      description: "Resumen de gastos y transparencia en eventos realizados",
      url: "https://iamparana.com.ar/logistica",
      siteName: "Logística - IAM Paraná",
      images: [
        {
          url: "https://iamparana.com.ar/logoiam.jpg",
          width: 800,
          height: 600,
          alt: "Resumen de gastos",
        },
      ],
      locale: "es_AR",
      type: "website",
    },
  };
}

import { HeroSection } from "@/app/components/common/hero-section";

export default function Logistica() {
  return (
    <>
      {/* Área de logística: publica información de gastos y transparencia de eventos. */}
      <div id="header"></div>

      {/* Encabezado visual de la sección de logística. */}
      <HeroSection
        title="Logística"
        textureUrl="/assets/textures/areasg.webp"
        overlayColor="rgba(220, 38, 38, 0.7), rgba(239, 68, 68, 0.75)"
        gradientClass="from-red-600 to-red-500"
        description="Es muy importante manejarse con transparencia. Aquí vas a poder encontrar los resúmenes de ingresos-egresos de los distintos eventos que hemos realizado."
        textColor="text-white"
      />

      <main className="seccion areas">
        {/* Resumen visual de los gastos o rendiciones disponibles para consulta. */}
        <h2 className="subtitulo-descriptivo" style={{ marginTop: '2rem' }}>
          Resumen de gastos en la formación de animadores
        </h2>

        <img
          src="/assets/multimedia/gastosformacion.webp"
          alt="Resumen de gastos"
          style={{
            maxWidth: '90%',
            display: 'block',
            margin: '1rem auto',
            borderRadius: '12px',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
          }}
        />
                <hr className="divisor" />
      </main>
      <div id="footer"></div>
    </>
  );
}
