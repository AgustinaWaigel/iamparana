import React from 'react';
import { Metadata } from 'next';
import { PresentacionesClient } from '@/app/formacion/components/presentaciones-client';
import { AreaHero, AreaPage } from '@/app/components/common/area-hero';
import { AreaSection, LinkCard, LinkGrid } from '@/app/components/common/area-sections';

export const metadata: Metadata = {
  title: 'Presentaciones',
  description: 'Material del Encuentro de Animadores',
  openGraph: {
    title: 'Presentaciones',
    description: 'Descripcion',
    url: 'https://iamparana.com/formacion/presentaciones',
    images: [
      {
        url: 'https://iamparana.com/logoiam.jpg',
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

// Cada material es [título, id de Drive o URL completa].
const TALLERES: Array<{ title: string; items: Array<[string, string]> }> = [
  {
    title: 'Taller de Iniciación',
    items: [
      ['Pastoral Misionera', '1l2ogfXtrmq34VNjNyG322ULbnzoRdtQV'],
      ['Espiritualidad Misionera', '14swcMB24SqNjG-dvI25MFdfrGmlb3zaS'],
      ['Obras Misionales Pontificias', '1Q2ovMprzB7AeuC5PCTnqHYZ1yYu74Sq0'],
      ['Infancia y Adolescencia Misionera', '1W-eSjzRbP3ZbFYtFL16OWotm_Yt6Y2uG'],
      ['La escuela con Jesús', '1mibTDgdYDViJv-0skTrovsgqS4WIg6yo'],
      ['La Escuela con Jesús II', '1xfhOU7c90JB_QVg0dsS2OBbakHWmiBH3'],
      ['Insignias de la IAM', '1O-bZCvbZmXYHnqQ2Cq_ENusag2ztdTxE'],
    ],
  },
  {
    title: 'Taller de Profundización',
    items: [
      ['El Año Jubilar', '1SMEMQHMxM06ZWipezc-NR0yzw_G1c8xE'],
      ['Metodología Escuelita con Jesús', '1Wgv0bdTvUAz_q17OqGIg8u33fskj5EgA'],
      ['ESAM', '1k4XbyqUTuNxGcUwzVF42N85SHIgBK5mT'],
      ['Misioneros de Esperanza', '1DpNAcbMaDY7kKUnOPpnsl2WMogRoOhKJ'],
      ['Video el Jubileo', 'https://youtu.be/KCbDQqCh8Ac?si=rLX6e-pzaGU0IUJD'],
    ],
  },
  {
    title: 'Talleres Compartidos',
    items: [
      ['Normas de Comportamiento con Menores', '1lx8BD5uiEke50tY0Qby4C473E92F9k4j'],
      ['Protocolo ante sospecha de Abuso Sexual', '1cBmbT9Htkgi9iomNodYdAuQI67f_-spn'],
      ['Taller de Oración', '1fTFmdaD-n-qZFsocpdn1v7fXiHuK3WgT'],
      ['Taller Inclusión', '1m4ce855mwH221iXIdgsNbHXVxKgxLLDd'],
      ['Taller Inclusión II', '1FbBwZwuiIUszqHIF4IYTjCoVBgARemMu'],
    ],
  },
];

const content = (
  <AreaPage
    hero={
      <AreaHero
        area="formacion"
        title="Presentaciones"
        description="Hemos compartido el encuentro de formación, y acá vas a poder encontrar todo el material que estuvimos viendo. Es muy importante estar siempre al tanto."
        crumbs={[]}
      />
    }
  >
    <p className="m-0 mb-10 max-w-none text-left font-display text-2xl font-extrabold text-brand-brown sm:text-3xl">
      ¡Misioneros... A estudiar!
    </p>

    {TALLERES.map((taller) => (
      <AreaSection key={taller.title} title={taller.title} meta={`${taller.items.length} materiales`}>
        <LinkGrid>
          {taller.items.map(([title, link]) => {
            const isUrl = link.startsWith('http');
            return (
              <LinkCard
                key={link}
                area="formacion"
                kind={isUrl ? 'video' : 'doc'}
                title={title}
                href={isUrl ? link : `https://drive.google.com/file/d/${link}/view?usp=sharing`}
              />
            );
          })}
        </LinkGrid>
      </AreaSection>
    ))}
  </AreaPage>
);

export default function PresentacionesPage() {
  // Página específica del material de presentaciones del área de formación.
  return <PresentacionesClient>{content}</PresentacionesClient>;
}
