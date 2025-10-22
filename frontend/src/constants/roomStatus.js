// Centralized room status constants and mapping helpers

export const ROOM_API_STATUSES = [
  'available',
  'clean',
  'needs-cleaning',
  'occupied',
  'maintenance'
]

export const FRONT_OFFICE_CODES = ['VC', 'VD', 'OC', 'OD', 'OOO']

export const allowedStatuses = [
  { value: 'available', label: 'Available' },
  { value: 'clean', label: 'Clean' },
  { value: 'needs-cleaning', label: 'Needs Cleaning' },
  { value: 'occupied', label: 'Occupied' },
  { value: 'maintenance', label: 'Maintenance' }
]

export const mapApiToFront = (s = '') => {
  const v = String(s).toLowerCase()
  if (v === 'occupied') return 'OC'
  if (v === 'maintenance') return 'OOO'
  if (v === 'needs-cleaning' || v === 'vd' || v === 'vacant_dirty') return 'VD'
  // treat 'available' and 'clean' as VC
  return 'VC'
}

export const mapFrontToApi = (code) => ({
  VC: 'available',
  VD: 'needs-cleaning',
  OC: 'occupied',
  OD: 'occupied',
  OOO: 'maintenance'
})[code] || 'available'
