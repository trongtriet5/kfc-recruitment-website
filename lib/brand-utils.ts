export function getStoreGroupLabel(group: string | null | undefined): string {
  if (!group) return 'N/A'
  
  const labels: Record<string, string> = {
    OPS_SOUTH: 'OPS-South',
    OPS_NORTH: 'OPS-North',
  }
  
  return labels[group] || group
}

export function getBrandLabel(brand: string | null | undefined): string {
  if (!brand) return 'N/A'
  
  const labels: Record<string, string> = {
    KFC: 'KFC',
    BOTH: 'Tất cả',
  }
  
  return labels[brand] || brand
}