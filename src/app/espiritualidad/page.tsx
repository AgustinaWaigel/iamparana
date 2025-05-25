import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Espiritualidad",
  description: "Página del área de espiritualidad",
  openGraph: {
    title: "Espiritualidad",
    description: "Página del área de espiritualidad",
    url: "https://iamparana.com.ar/espiritualidad",
    images: [
      {
        url: "https://iamparana.com.ar/logoiam.jpg",
        alt: "Logo IAM Paraná",
        width: 800,
        height: 600,
      },
    ],
    type: "website",
  },
  icons: {
    icon: "/assets/resources/favicon.ico",
  },
};

export default function Espiritualidad() {
  return (
    <>
      <div id="header"></div>

            <h2 className="barra-contextual color-espiritualidad-boton">Espiritualidad</h2>

      <main className="seccion areas">
              <p className="subtitulo-descriptivo">
          En esta sección vas a encontrar oraciones y guiones para profundizar en la espiritualidad de la IAM.
        </p>
        <hr className="divisor" />
        <section className="seccion-oraciones">
          <h2 className="subtitulo-seccion titulo-espiritualidad">🕊️ Oraciones</h2>
          <div className="acordeon">
            <details>
              <summary>Oración del Animador</summary>
              <p>
                Señor Jesús, alabado seas porque has dado tu vida por la salvación
                de todos los hombres y de todos los pueblos. Te doy gracias porque
                me has escogido para ser tu apóstol y me has llamado a cultivar en
                mí y en los niños y adolescentes el amor universal. Te pido que me
                ayudes a ser un misionero como Tú, que anhela ir por el mundo para
                hacer discípulos tuyos en todos los pueblos. Guíame con la luz de
                tu Espíritu para saber despertar en los niños y adolescentes que
                me has encomendado el gusto por la misión así, que su alegría sea
                plena. Enséñame a quererlos con el mismo amor con que los amas Tú
                y a guiarlos con el fervor ardiente de mi juventud. Que Tu amor
                sea mi amor. Que Tu paciencia sea mi paciencia. Que Tus palabras
                sean mis palabras. Te lo pido a Tí, Enviado del Padre, con la
                fuerza del Espíritu, que vives y reinas por los siglos de los
                siglos. Amén.
              </p>
            </details>

            <details>
              <summary>Oración por los niños y adolescentes</summary>
              <p>
                Señor Jesús, apenas estoy empezando la vida y Tú me llamas a una
                misión. Bien sabes, Señor, que no tengo nada, solo deseos de
                servirte. Dame tu sabiduría, tu amor, tu paz, y un corazón grande
                que abrace a todo el mundo. Solo, Señor, no puedo hacer nada, pero
                contigo será mucho lo que lograré. Señor, millones de niños y
                adolescentes no te conocen y, por lo tanto, no son felices. Yo te
                ofrezco mi vida entera y me pongo en tus manos; Iléname de
                valentía, sinceridad y responsabilidad para con mis hermanos.
                Señor, yo sé que me escuchas y me acompañas siempre. Solo quiero
                que tu nombre sea conocido en todo el universo, y tu Reino de Amor
                se extienda cada vez más. Amén.
              </p>
            </details>

            <details>
              <summary>Oración a San Francisco Javier</summary>
              <p>
                Tú, que diste hasta el último suspiro por ser fiel a Jesús: danos
                fortaleza en la fe. Tú, que dejaste nobleza y tierra por la causa
                de Jesús: ayudanos a ser generosos. Tú, que viviste tan cerca del
                dolor y de los enfermos: intercede, ante Dios, por nuestras
                necesidades. Tú, que tuviste como gran tesoro a Cristo: haznos
                descubrir su presencia. Tú, que naciste para gloria de tu pueblo:
                animanos a dar gloria a Dios en nuestra Patria. Tú, que surcaste
                tierra y mares: imprime valentía en nuestra misión. Tú, que
                hiciste de Jesús tu pasión y la razón de tu existir: empujanos a
                vivir siempre en Él, con Él y por El. Amén.
              </p>
            </details>

            <details>
              <summary>Oración a Santa Teresita</summary>
              <p>
                ¡Santa Teresita del Niño Jesús, modelo de humildad, de confianza y
                de amor! Desde lo alto de los cielos deshoja sobre nosotros esas
                rosas que llevas en tus brazos: La rosa de la humildad, para que
                sujete nuestro orgullo; La rosa de la confianza, para que nos
                abandonemos a la voluntad de Dios y descansemos en su
                misericordia; La rosa del amor, para que abriendo nuestras almas
                sin medida a la gracia, realicemos el único fin para el que Dios
                nos ha creado a su imagen; amarle y hacerle amar. Tú que pasas tu
                cielo haciendo bien en la tierra, concédeme imitarte en tus
                virtudes y amar a Jesucristo como tú lo amaste. Amén.
              </p>
            </details>
          </div>
        </section>
        
        <hr className="divisor" />
        <section className="seccion-guiones">
          <h2 className="subtitulo-seccion titulo-espiritualidad">📜 Guiones</h2>
          <div className="listabotones">
            <a
              className="botonpaginas color-espiritualidad-boton"
              href="https://drive.google.com/file/d/14pYMAo5rrhnTLPIzYa1PTZk1wN2QIzLa/view?usp=drive_link"
              target="_blank"
              rel="noopener noreferrer"
            >
              Guión 1 - Compromiso Animadores
            </a>
            <a
              className="botonpaginas color-espiritualidad-boton"
              href="https://drive.google.com/file/d/1y9vGuTQX4IbW4ziqxQ0Z7aoK8pITlRvo/view?usp=drive_link"
              target="_blank"
              rel="noopener noreferrer"
            >
              Guión 2 - Entrega de la Pañoleta
            </a>
            <a
              className="botonpaginas color-espiritualidad-boton"
              href="https://drive.google.com/file/d/1u20udvULUX_hnIs-bHkrr3Sov49pZWdx/view?usp=drive_link"
              target="_blank"
              rel="noopener noreferrer"
            >
              Guión 3 - Entrega del Carnet
            </a>
            <a
              className="botonpaginas color-espiritualidad-boton"
              href="https://drive.google.com/file/d/1FjL5gUwJXq0Y3QYscq5x9Ne6HeWTFl2m/view?usp=drive_link"
              target="_blank"
              rel="noopener noreferrer"
            >
              Guión 4 - Entrega del Escudo
            </a>
            <a
              className="botonpaginas color-espiritualidad-boton"
              href="https://drive.google.com/file/d/1vQcl8dJ-eVF196COHI1XZLObpvWw3x8i/view?usp=drive_link"
              target="_blank"
              rel="noopener noreferrer"
            >
              Guión 5 - Renovación Consagración
            </a>
          </div>
        </section>
                <hr className="divisor" />
      </main>

      <div id="footer"></div>
    </>
  );
}
