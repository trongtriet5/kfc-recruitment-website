'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import Icon from '@/components/icons/Icon'

interface Candidate {
  id: string
  fullName: string
  status: string | { id: string; name: string; code: string } | null
}

interface StatusOption {
  value: string
  label: string
}

interface DynamicStatus {
  id: string
  code: string
  name: string
  order: number
  color?: string
}

const STATUS_GROUPS = {
  application: {
    label: 'Ứng tuyển',
    statuses: [
      { value: 'CV_FILTERING', label: 'Lọc CV' },
      { value: 'CV_PASSED', label: 'Ứng viên đạt' },
      { value: 'CV_FAILED', label: 'Ứng viên loại' },
      { value: 'BLACKLIST', label: 'Blacklist' },
      { value: 'CANNOT_CONTACT', label: 'Không liên hệ được' },
      { value: 'AREA_NOT_RECRUITING', label: 'Khu vực chưa tuyển dụng' },
    ],
  },
  interview: {
    label: 'Phỏng vấn',
    subgroups: {
      waiting: {
        label: 'Chờ phỏng vấn',
        statuses: [
          { value: 'WAITING_INTERVIEW', label: 'Chờ phỏng vấn' },
        ],
      },
      hr: {
        label: 'HR sơ vấn',
        statuses: [
          { value: 'HR_INTERVIEW_PASSED', label: 'HR sơ vấn đạt' },
          { value: 'HR_INTERVIEW_FAILED', label: 'HR sơ vấn loại' },
        ],
      },
      sm_am: {
        label: 'SM/AM PV',
        statuses: [
          { value: 'SM_AM_INTERVIEW_PASSED', label: 'SM/AM PV Đạt' },
          { value: 'SM_AM_INTERVIEW_FAILED', label: 'SM/AM PV Loại' },
          { value: 'SM_AM_INTERVIEW_NO_SHOW', label: 'SM/AM PV Không đến PV' },
        ],
      },
      om_pv: {
        label: 'OM PV',
        statuses: [
          { value: 'OM_PV_INTERVIEW_PASSED', label: 'OM PV Đạt' },
          { value: 'OM_PV_INTERVIEW_FAILED', label: 'OM PV Loại' },
          { value: 'OM_PV_INTERVIEW_NO_SHOW', label: 'OM PV Không đến PV' },
        ],
      },
    },
  },
  offer: {
    label: 'Thư mời',
    statuses: [
      { value: 'OFFER_SENT', label: 'Đã gửi offer letter' },
      { value: 'OFFER_ACCEPTED', label: 'Đồng ý offer letter' },
      { value: 'OFFER_REJECTED', label: 'Từ chối offer letter' },
    ],
  },
  onboarding: {
    label: 'Trúng tuyển',
    statuses: [
      { value: 'WAITING_ONBOARDING', label: 'Chờ nhận việc' },
      { value: 'ONBOARDING_ACCEPTED', label: 'Đồng ý nhận việc' },
      { value: 'ONBOARDING_REJECTED', label: 'Từ chối nhận việc' },
    ],
  },
}

interface CandidateContextMenuProps {
  candidate: Candidate | null
  position: { x: number; y: number } | null
  onClose: () => void
  onStatusChange?: (candidate: Candidate) => void
  onStatusSelect?: (candidate: Candidate, newStatus: string) => void
  onDelete?: (candidateId: string) => void
  onScheduleInterview?: (candidate: Candidate) => void
  allowedStatuses?: string[]
  statusOptions?: StatusOption[]
}

export default function CandidateContextMenu({
  candidate,
  position,
  onClose,
  onStatusChange,
  onStatusSelect,
  onDelete,
  onScheduleInterview,
  allowedStatuses = [],
  statusOptions = [],
}: CandidateContextMenuProps) {
  const [showStatusSubmenu, setShowStatusSubmenu] = useState(false)
  const [dynamicStatuses, setDynamicStatuses] = useState<DynamicStatus[]>([])
  const [loadingStatuses, setLoadingStatuses] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()
  const menuRef = useRef<HTMLDivElement>(null)
  const submenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (showStatusSubmenu && dynamicStatuses.length === 0) {
      loadStatuses()
    }
  }, [showStatusSubmenu])

  useEffect(() => {
    if (!candidate || !position) return

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node
      
      // If submenu is open, check if click is outside submenu
      if (showStatusSubmenu) {
        if (submenuRef.current && !submenuRef.current.contains(target)) {
          // Click outside submenu - close submenu first
          event.preventDefault()
          event.stopPropagation()
          setShowStatusSubmenu(false)
          setSearchQuery('')
        }
        return
      }
      
      // If main menu is open, check if click is outside menu
      if (menuRef.current && !menuRef.current.contains(target)) {
        // Click outside main menu - close everything
        event.preventDefault()
        event.stopPropagation()
        onClose()
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showStatusSubmenu) {
          setShowStatusSubmenu(false)
          setSearchQuery('')
        } else {
          onClose()
        }
      }
    }

    // Use a small delay to avoid immediate closing when opening
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside, true)
      document.addEventListener('touchstart', handleClickOutside, true)
      document.addEventListener('keydown', handleEscape)
    }, 0)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside, true)
      document.removeEventListener('touchstart', handleClickOutside, true)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [candidate, position, onClose, showStatusSubmenu])

  const loadStatuses = async () => {
    setLoadingStatuses(true)
    try {
      const res = await api.get('/types/by-category/CANDIDATE_STATUS')
      const statuses = res.data
        .filter((s: any) => s.isActive)
        .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
      setDynamicStatuses(statuses)
    } catch (err) {
      console.error('Error loading statuses:', err)
    } finally {
      setLoadingStatuses(false)
    }
  }

  // Group statuses by category based on code patterns
  const groupStatuses = (statuses: DynamicStatus[]) => {
    const groups: Record<string, DynamicStatus[]> = {
      application: [],
      interview: [],
      offer: [],
      onboarding: [],
    }

    statuses.forEach((status) => {
      const code = status.code
      if (code.startsWith('CV_') || code === 'BLACKLIST' || code === 'CANNOT_CONTACT' || code === 'AREA_NOT_RECRUITING') {
        groups.application.push(status)
      } else if (code.includes('INTERVIEW') || code === 'WAITING_INTERVIEW') {
        groups.interview.push(status)
      } else if (code.startsWith('OFFER_')) {
        groups.offer.push(status)
      } else if (code.includes('ONBOARDING') || code === 'WAITING_ONBOARDING') {
        groups.onboarding.push(status)
      } else {
        groups.application.push(status) // Default to application
      }
    })

    return groups
  }

  if (!candidate || !position) {
    return null
  }

  const menuItems: Array<{
    label: string
    icon: string
    action: () => void
    hasSubmenu?: boolean
    danger?: boolean
  }> = [
    {
      label: 'Xem chi tiết',
      icon: 'eye',
      action: () => {
        router.push(`/dashboard/recruitment/candidates/${candidate.id}`)
        onClose()
      },
    },
    {
      label: 'Chỉnh sửa',
      icon: 'edit',
      action: () => {
        router.push(`/dashboard/recruitment/candidates/${candidate.id}/edit`)
        onClose()
      },
    },
    ...(onStatusChange && allowedStatuses.length > 0
      ? [
          {
            label: 'Chuyển trạng thái',
            icon: 'clock',
            hasSubmenu: true,
            action: () => {
              setShowStatusSubmenu(true)
            },
          },
        ]
      : []),
    ...(onScheduleInterview
      ? [
          {
            label: 'Tạo lịch phỏng vấn',
            icon: 'calendar',
            action: () => {
              onScheduleInterview(candidate)
              onClose()
            },
          },
        ]
      : []),
    {
      label: 'Sao chép thông tin',
      icon: 'copy',
      action: () => {
        const statusText = typeof candidate.status === 'object' 
          ? candidate.status?.name || candidate.status?.code || 'Chưa có trạng thái'
          : candidate.status || 'Chưa có trạng thái'
        const info = `${candidate.fullName}\nID: ${candidate.id}\nTrạng thái: ${statusText}`
        navigator.clipboard.writeText(info)
        onClose()
      },
    },
    ...(onDelete
      ? [
          {
            label: 'Xóa ứng viên',
            icon: 'trash',
            action: () => {
              if (confirm(`Bạn có chắc chắn muốn xóa ứng viên ${candidate.fullName}?`)) {
                onDelete(candidate.id)
                onClose()
              }
            },
            danger: true,
          },
        ]
      : []),
  ]

  // Calculate menu position to avoid going off-screen
  const calculateMenuPosition = (isSubmenu: boolean = false) => {
    const menuWidth = isSubmenu ? 320 : 220
    const maxMenuHeight = isSubmenu ? 600 : 400
    const padding = 10
    
    let x = position.x
    let y = position.y

    // Get available viewport dimensions
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    // Adjust horizontal position - prioritize showing menu to the left of cursor if near right edge
    if (x + menuWidth > viewportWidth) {
      // Try to show menu to the left of cursor
      const leftPosition = x - menuWidth
      if (leftPosition >= padding) {
        x = leftPosition
      } else {
        // If not enough space on left, align to right edge
        x = viewportWidth - menuWidth - padding
      }
    }
    // Ensure menu doesn't go off left edge
    if (x < padding) {
      x = padding
    }

    // Adjust vertical position - prioritize showing menu above cursor if near bottom edge
    const estimatedHeight = isSubmenu ? Math.min(maxMenuHeight, viewportHeight - padding * 2) : 200
    if (y + estimatedHeight > viewportHeight) {
      // Try to show menu above cursor
      const topPosition = y - estimatedHeight
      if (topPosition >= padding) {
        y = topPosition
      } else {
        // If not enough space above, align to bottom edge
        y = viewportHeight - estimatedHeight - padding
      }
    }
    // Ensure menu doesn't go off top edge
    if (y < padding) {
      y = padding
    }

    return { x, y, maxHeight: Math.min(maxMenuHeight, viewportHeight - y - padding) }
  }

  if (showStatusSubmenu) {
    const currentStatusCode = typeof candidate?.status === 'object' 
      ? candidate?.status?.code 
      : candidate?.status

    const statusGroups = groupStatuses(dynamicStatuses)
    const filteredStatuses = dynamicStatuses.filter((status) => {
      if (allowedStatuses.length > 0 && !allowedStatuses.includes(status.code)) {
        return false
      }
      if (searchQuery) {
        return status.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
               status.code.toLowerCase().includes(searchQuery.toLowerCase())
      }
      return true
    })

    const groupLabels: Record<string, string> = {
      application: 'Ứng tuyển',
      interview: 'Phỏng vấn',
      offer: 'Thư mời',
      onboarding: 'Trúng tuyển',
    }

    const submenuPosition = position ? calculateMenuPosition(true) : { x: 0, y: 0, maxHeight: 600 }

    return (
      <>
        {/* Backdrop overlay */}
        <div
          className="fixed inset-0 z-40 bg-transparent"
          onClick={(e) => {
            e.stopPropagation()
            setShowStatusSubmenu(false)
            setSearchQuery('')
          }}
        />
        <div
          ref={submenuRef}
          className="fixed z-50 bg-white rounded-lg shadow-2xl border border-gray-200 min-w-[280px] max-w-[90vw] flex flex-col"
          style={{
            left: `${submenuPosition.x}px`,
            top: `${submenuPosition.y}px`,
            maxHeight: `${submenuPosition.maxHeight}px`,
            width: `min(400px, calc(100vw - ${submenuPosition.x + 20}px))`,
          }}
        >
        {/* Header with back button and search */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-3 space-y-2">
          <button
            onClick={() => {
              setShowStatusSubmenu(false)
              setSearchQuery('')
            }}
            className="w-full text-left px-2 py-1.5 text-sm flex items-center gap-2 hover:bg-gray-100 transition-colors text-gray-700 font-medium rounded"
          >
            <span>←</span>
            <span>Quay lại</span>
          </button>
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm trạng thái..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Status list */}
        <div className="flex-1 overflow-y-auto py-2">
          {loadingStatuses ? (
            <div className="px-4 py-8 text-center text-gray-500 text-sm">
              Đang tải trạng thái...
            </div>
          ) : filteredStatuses.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500 text-sm">
              {searchQuery ? 'Không tìm thấy trạng thái' : 'Không có trạng thái nào'}
            </div>
          ) : (
            <div className="px-2">
              {Object.entries(statusGroups).map(([groupKey, groupStatuses]) => {
                const visibleStatuses = groupStatuses.filter((status) =>
                  filteredStatuses.some((s) => s.id === status.id)
                )
                if (visibleStatuses.length === 0) return null

                return (
                  <div key={groupKey} className="mb-3">
                    <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase bg-gray-50 rounded">
                      {groupLabels[groupKey] || groupKey}
                    </div>
                    {visibleStatuses.map((status) => {
                      const isSelected = currentStatusCode === status.code
                      return (
                        <button
                          key={status.id}
                          onClick={() => {
                            if (onStatusSelect && candidate) {
                              onStatusSelect(candidate, status.code)
                            }
                            onClose()
                          }}
                          className={`
                            w-full text-left px-4 py-2.5 text-sm flex items-center gap-3
                            hover:bg-gray-50 transition-colors rounded mx-1
                            ${isSelected ? 'bg-yellow-50 text-yellow-700 font-medium' : 'text-gray-700'}
                          `}
                        >
                          <span className={`w-5 text-center ${isSelected ? 'text-yellow-600' : 'text-gray-400'}`}>
                            {isSelected ? '✓' : '○'}
                          </span>
                          <span className="flex-1">{status.name}</span>
                          {status.color && (
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: status.color }}
                            />
                          )}
                        </button>
                      )
                    })}
                  </div>
                )
              })}
              
              {/* Show ungrouped statuses if any */}
              {filteredStatuses.filter((status) => {
                const inAnyGroup = Object.values(statusGroups).some((group) =>
                  group.some((s) => s.id === status.id)
                )
                return !inAnyGroup
              }).length > 0 && (
                <div className="mb-3">
                  <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase bg-gray-50 rounded">
                    Khác
                  </div>
                  {filteredStatuses
                    .filter((status) => {
                      const inAnyGroup = Object.values(statusGroups).some((group) =>
                        group.some((s) => s.id === status.id)
                      )
                      return !inAnyGroup
                    })
                    .map((status) => {
                      const isSelected = currentStatusCode === status.code
                      return (
                        <button
                          key={status.id}
                          onClick={() => {
                            if (onStatusSelect && candidate) {
                              onStatusSelect(candidate, status.code)
                            }
                            onClose()
                          }}
                          className={`
                            w-full text-left px-4 py-2.5 text-sm flex items-center gap-3
                            hover:bg-gray-50 transition-colors rounded mx-1
                            ${isSelected ? 'bg-yellow-50 text-yellow-700 font-medium' : 'text-gray-700'}
                          `}
                        >
                          <span className={`w-5 text-center ${isSelected ? 'text-yellow-600' : 'text-gray-400'}`}>
                            {isSelected ? '✓' : '○'}
                          </span>
                          <span className="flex-1">{status.name}</span>
                          {status.color && (
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: status.color }}
                            />
                          )}
                        </button>
                      )
                    })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      </>
    )
  }

  const mainMenuPosition = position ? calculateMenuPosition(false) : { x: 0, y: 0, maxHeight: 400 }

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[200px] max-w-[90vw]"
      style={{
        left: `${mainMenuPosition.x}px`,
        top: `${mainMenuPosition.y}px`,
        maxHeight: `${mainMenuPosition.maxHeight}px`,
        width: `min(220px, calc(100vw - ${mainMenuPosition.x + 20}px))`,
      }}
    >
      {menuItems.map((item, index) => (
        <button
          key={index}
          onClick={item.action}
          className={`
            w-full text-left px-4 py-2.5 text-sm flex items-center gap-3
            hover:bg-gray-100 transition-colors rounded mx-1
            ${item.danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700'}
          `}
        >
                  <Icon name={item.icon} size={18} />
                  <span className="flex-1">{item.label}</span>
                  {item.hasSubmenu && (
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
        </button>
      ))}
    </div>
  )
}

