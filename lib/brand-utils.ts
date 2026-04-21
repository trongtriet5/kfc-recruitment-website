export function getStoreGroupLabel(group: string | null | undefined): string {
  if (!group) return 'N/A'
  
  const labels: Record<string, string> = {
    OPS_SOUTH: 'OPS-South',
    OPS_NORTH: 'OPS-North',
  }
  
  return labels[group] || group
}