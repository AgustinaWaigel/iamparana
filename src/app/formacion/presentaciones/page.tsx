import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Presentaciones',
  description: 'Material del Encuentro de Animadores',
  openGraph: {
    title: 'Presentaciones',
    description: 'Descripcion',
    url: 'https://iamparana.com.ar/formacion/presentaciones',
    images: [
      {
        url: 'https://iamparana.com.ar/logoiam.jpg',
        alt: 'Logo IAM Paraná',
        width: 800,
        height: 600,
      },
    ],
    type: 'website',
  },
  icons: {
    icon: '/assets/resources/favicon.ico',
  },
};

export default function PresentacionesPage() {
  return (
    <>
<h2 className='barra-contextual color-formacion-boton'>Presentaciones</h2>

      <main className="seccion areas" style={{ padding: '2rem' }}>
        <p className="subtitulo-descriptivo">
          Hemos compartido el encuentro de formación, y acá vas a poder encontrar todo el material
          que estuvimos viendo. Es muy importante estar siempre al tanto. <br />
          <strong>¡Misioneros... A estudiar!</strong>
        </p>
<hr className="divisor" />
        <div className="seccion">
          <h2 className="subtitulo-seccion titulo-formacion ">Taller de Iniciación</h2>
          <div className="listabotones ">
            {[
              ['Pastoral Misionera', '1l2ogfXtrmq34VNjNyG322ULbnzoRdtQV'],
              ['Espiritualidad Misionera', '14swcMB24SqNjG-dvI25MFdfrGmlb3zaS'],
              ['Obras Misionales Pontificias', '1Q2ovMprzB7AeuC5PCTnqHYZ1yYu74Sq0'],
              ['Infancia y Adolescencia Misionera', '1W-eSjzRbP3ZbFYtFL16OWotm_Yt6Y2uG'],
              ['La escuela con Jesús', '1mibTDgdYDViJv-0skTrovsgqS4WIg6yo'],
              ['La Escuela con Jesús II', '1xfhOU7c90JB_QVg0dsS2OBbakHWmiBH3'],
              ['Insignias de la IAM', '1O-bZCvbZmXYHnqQ2Cq_ENusag2ztdTxE'],
            ].map(([title, id]) => (
              <a
                key={id}
                href={`https://drive.google.com/file/d/${id}/view?usp=sharing`}
                target="_blank"
                rel="noopener noreferrer"
                className="botonpaginas color-formacion-boton"
              >
                {title}
              </a>
            ))}
          </div>
        </div>
<hr className="divisor" />
        <div className="seccion">
          <h2 className="subtitulo-seccion titulo-formacion">Taller de Profundización</h2>
          <div className="listabotones">
            {[
              ['El Año Jubilar', '1SMEMQHMxM06ZWipezc-NR0yzw_G1c8xE'],
              ['Metodología Escuelita con Jesús', '1Wgv0bdTvUAz_q17OqGIg8u33fskj5EgA'],
              ['ESAM', '1k4XbyqUTuNxGcUwzVF42N85SHIgBK5mT'],
              ['Misioneros de Esperanza', '1DpNAcbMaDY7kKUnOPpnsl2WMogRoOhKJ'],
              ['Video el Jubileo', 'https://youtu.be/KCbDQqCh8Ac?si=rLX6e-pzaGU0IUJD'],
            ].map(([title, link]) => (
              <a
                key={title}
                href={
                  link.startsWith('http') ? link : `https://drive.google.com/file/d/${link}/view?usp=sharing`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="botonpaginas color-formacion-boton"
              >
                {title}
              </a>
            ))}
          </div>
        </div>
<hr className="divisor" />
        <div className="seccion">
          <h2 className="subtitulo-seccion titulo-formacion">Talleres Compartidos</h2>
          <div className="listabotones">
            {[
              ['Normas de Comportamiento con Menores', '1lx8BD5uiEke50tY0Qby4C473E92F9k4j'],
              ['Protocolo ante sospecha de Abuso Sexual', '1cBmbT9Htkgi9iomNodYdAuQI67f_-spn'],
              ['Taller de Oración', '1fTFmdaD-n-qZFsocpdn1v7fXiHuK3WgT'],
              ['Taller Inclusión', '1m4ce855mwH221iXIdgsNbHXVxKgxLLDd'],
              ['Taller Inclusión II', '1FbBwZwuiIUszqHIF4IYTjCoVBgARemMu'],
            ].map(([title, id]) => (
              <a
                key={id}
                href={`https://drive.google.com/file/d/${id}/view?usp=sharing`}
                target="_blank"
                rel="noopener noreferrer"
                className="botonpaginas color-formacion-boton"
              >
                {title}
              </a>
            ))}
          </div>
          <hr className="divisor" />
        </div>
      </main>
    </>
  );
}
