import type { Metadata, Viewport } from 'next';
import { RosarioMisionero } from '../components/rosario-misionero';

// El Rosario Misionero en su propia página, pensada para rezarlo: solo el rosario, cuenta por cuenta.
// Los misterios (gozosos, luminosos, dolorosos o gloriosos) se eligen solos según el día de la semana.

export const viewport: Viewport = { themeColor: '#fbf8f3' };

export const metadata: Metadata = {
  title: 'Rosario Misionero',
  description: 'Rezá el Rosario Misionero cuenta por cuenta: cinco misterios, uno por cada continente, con los misterios de cada día.',
  alternates: { canonical: '/espiritualidad/rosario' },
};

export default function RosarioPage() {
  return <RosarioMisionero />;
}
