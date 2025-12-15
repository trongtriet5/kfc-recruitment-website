export function getBrandLabel(brand: string | null | undefined): string {
  if (!brand) return 'N/A'
  
  const labels: Record<string, string> = {
    MAYCHA: 'Maycha',
    TAM_HAO: 'Tam hảo',
    BOTH: 'Cả hai',
  }
  
  return labels[brand] || brand
}

