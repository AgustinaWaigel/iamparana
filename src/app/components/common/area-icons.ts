import { ClipboardList, Flame, GraduationCap, Megaphone, PartyPopper, type LucideIcon } from 'lucide-react';
import type { AreaKey } from './area-theme';

export const AREA_ICONS: Record<AreaKey, LucideIcon> = {
  formacion: GraduationCap,
  animacion: PartyPopper,
  espiritualidad: Flame,
  comunicacion: Megaphone,
  logistica: ClipboardList,
};
