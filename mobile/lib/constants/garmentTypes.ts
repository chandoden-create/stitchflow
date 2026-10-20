export const GARMENT_TYPES = [
  { value: 'BLOUSE_STITCHING', label: 'Blouse Stitching', icon: 'shirt-outline' },
  { value: 'BLOUSE_FITTING', label: 'Blouse Fitting / Alteration', icon: 'resize-outline' },
  { value: 'DRESS_STITCHING', label: 'Dress Stitching', icon: 'color-palette-outline' },
  { value: 'PANT_FITTING', label: 'Pant Fitting', icon: 'man-outline' },
  { value: 'KURTI_STITCHING', label: 'Kurti Stitching', icon: 'woman-outline' },
  { value: 'ALTERATION', label: 'Alteration', icon: 'cut-outline' },
  { value: 'SKIRT_STITCHING', label: 'Skirt Stitching', icon: 'color-filter-outline' },
  { value: 'SALWAR_STITCHING', label: 'Salwar Stitching', icon: 'layers-outline' },
  { value: 'LEHENGA_STITCHING', label: 'Lehenga Stitching', icon: 'sparkles-outline' },
  { value: 'OTHER', label: 'Other / Custom', icon: 'add-circle-outline' },
] as const;

export type GarmentTypeValue = typeof GARMENT_TYPES[number]['value'];

export function getGarmentLabel(value: string): string {
  return GARMENT_TYPES.find((g) => g.value === value)?.label ?? value;
}

export function getGarmentIcon(value: string): string {
  return GARMENT_TYPES.find((g) => g.value === value)?.icon ?? 'shirt-outline';
}

export function getGarmentTypeConfig(value: string): { value: string; label: string; icon: string } {
  const found = GARMENT_TYPES.find((g) => g.value === value);
  return found
    ? { value: found.value, label: found.label, icon: found.icon }
    : { value, label: value || 'Garment', icon: 'shirt-outline' };
}
