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

export default function Logistica() {
  return (
    <>
      <div id="header"></div>
      <h2 className="mt-20 py-8 px-5 text-3xl font-bold bg-gradient-to-r from-red-600 to-red-500 text-white text-center">Logística</h2>

      <main className="seccion areas">
        <p className="subtitulo-descriptivo">
          Es muy importante manejarse con transparencia, es por eso que acá vas a
          poder encontrar los resúmenes de ingresos-egresos de los distintos
          eventos que hemos realizado.
        </p>
        <hr className="divisor" />
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
