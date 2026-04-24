'use client'

import React, { useEffect, useState, useRef } from 'react'
import api from '@/lib/api'
import { useClickOutside } from '@/hooks/useClickOutside'

interface Headcount {
  id: string
  code: string
  name: string
  period: 'MONTH' | 'QUARTER' | 'HALF_YEAR' | 'YEAR'
  current: number
  target: number
  year: number
  month: number | null
  department: { id: string; name: string; code: string } | null
  store: { id: string; name: string } | null
  positions: Array<{ position: { id: string; name: string } }>
}

interface Department {
  id: string
  name: string
  code: string
}

interface Position {
  id: string
  name: string
  code: string
}

interface Employee {
  id: string
  departmentId: string | null
  positionId: string | null
  createdAt?: string
}

export default function HeadcountList() {
  const [headcounts, setHeadcounts] = useState<Headcount[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    period: 'MONTH' as 'MONTH' | 'QUARTER' | 'HALF_YEAR' | 'YEAR',
    departmentId: '',
    positionIds: [] as string[],
    current: 0,
    target: 1,
    year: new Date().getFullYear(),
    month: null as number | null,
  })
  const createFormRef = useRef<HTMLDivElement>(null)

  useClickOutside(createFormRef, () => {
    if (showCreateForm) {
      setShowCreateForm(false)
      setFormData({
        name: '',
        period: 'MONTH' as 'MONTH' | 'QUARTER' | 'HALF_YEAR' | 'YEAR',
        departmentId: '',
        positionIds: [],
        current: 0,
        target: 1,
        year: new Date().getFullYear(),
        month: null,
      })
    }
  }, showCreateForm)

  useEffect(() => {
    loadData()
  }, [selectedYear])

  const loadData = async () => {
    try {
      const [headcountsRes, deptsRes, positionsRes, employeesRes] = await Promise.all([
        api.get(`/recruitment/headcounts?year=${selectedYear}`),
        api.get('/departments'),
        api.get('/positions'),
        api.get('/employees'),
      ])
      setHeadcounts(headcountsRes.data)
      setDepartments(deptsRes.data)
      setPositions(positionsRes.data)
      setEmployees(employeesRes.data)
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.positionIds.length === 0) {
      alert('Vui lòng chọn ít nhất một vị trí')
      return
    }
    try {
      await api.post('/recruitment/headcounts', formData)
      setShowCreateForm(false)
      setFormData({
        name: '',
        period: 'MONTH',
        departmentId: '',
        positionIds: [],
        current: 0,
        target: 1,
        year: new Date().getFullYear(),
        month: null,
      })
      loadData()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra')
    }
  }

  // Calculate current employees for a department/position combination
  const getCurrentCount = (departmentId: string | null, positionIds: string[]) => {
    if (!departmentId || positionIds.length === 0) return 0
    return employees.filter(
      (emp) => emp.departmentId === departmentId && positionIds.includes(emp.positionId || '')
    ).length
  }

  // Get headcount data for a department and month
  const getHeadcountData = (departmentId: string, month: number | null) => {
    return headcounts.find(
      (h) => h.department?.id === departmentId && h.month === month && h.year === selectedYear
    )
  }

  // Calculate need to recruit
  const getNeedToRecruit = (current: number, target: number) => {
    const need = target - current
    return need > 0 ? need : '--'
  }

  // Group headcounts by department
  const headcountsByDept = departments.reduce((acc, dept) => {
    const deptHeadcounts = headcounts.filter((h) => h.department?.id === dept.id)
    if (deptHeadcounts.length > 0) {
      acc[dept.id] = deptHeadcounts
    }
    return acc
  }, {} as Record<string, Headcount[]>)

  // Get year summary
  const getYearSummary = () => {
    const yearHeadcounts = headcounts.filter((h) => h.month === null && h.year === selectedYear)
    const totalCurrent = employees.length
    const totalTarget = yearHeadcounts.reduce((sum, h) => sum + h.target, 0)
    return { current: totalCurrent, target: totalTarget }
  }

  const yearSummary = getYearSummary()

  // Filter departments by search
  const filteredDepartments = departments.filter((dept) =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <div className="text-center py-4">Đang tải...</div>
  }

  return (
    <div className="pt-6 space-y-8">
      {/* Page Header */}
      <div className="pb-2">
        <h1 className="text-2xl font-bold text-gray-900">Bảng định biên</h1>
        <p className="text-gray-600 mt-2">Quản lý kế hoạch nhân sự theo vị trí và cửa hàng</p>
      </div>

      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium shadow-sm"
        >
          + Tạo định biên
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-4 items-center">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Tìm kiếm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <div>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        <button className="px-4 py-2 border border-gray-300 rounded-md">Lọc nhanh</button>
        <button className="px-4 py-2 border border-gray-300 rounded-md">Xem theo</button>
        <button className="px-4 py-2 border border-gray-300 rounded-md">Thời gian</button>
        <button className="px-4 py-2 border border-gray-300 rounded-md">Export</button>
      </div>

      {/* Table */}
      <div className="bg-white shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                Phòng ban
              </th>
              <th colSpan={3} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-l">
                Năm {selectedYear}
              </th>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                <th key={month} colSpan={3} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-l">
                  Tháng {month}
                </th>
              ))}
            </tr>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10"></th>
              <th className="px-2 py-2 text-xs font-medium text-gray-500">Hiện có</th>
              <th className="px-2 py-2 text-xs font-medium text-gray-500">Định biên</th>
              <th className="px-2 py-2 text-xs font-medium text-gray-500 border-l">Cần tuyển</th>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                <React.Fragment key={month}>
                  <th className="px-2 py-2 text-xs font-medium text-gray-500">Hiện có</th>
                  <th className="px-2 py-2 text-xs font-medium text-gray-500">Định biên</th>
                  <th className="px-2 py-2 text-xs font-medium text-gray-500 border-l">Cần tuyển</th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/* Company Total */}
            <tr className="bg-gray-50">
              <td className="px-4 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-gray-50 z-10">
                A. KFC Việt Nam
              </td>
              <td className="px-2 py-3 text-sm text-gray-900 text-center">{yearSummary.current}</td>
              <td className="px-2 py-3 text-sm text-gray-900 text-center">{yearSummary.target}</td>
              <td className="px-2 py-3 text-sm text-gray-500 text-center border-l">--</td>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
                const monthHeadcount = headcounts.find(
                  (h) => h.month === month && h.year === selectedYear && !h.department
                )
                const monthCurrent = employees.filter((emp) => {
                  const empDate = new Date(emp.createdAt || '')
                  return empDate.getMonth() + 1 <= month && empDate.getFullYear() === selectedYear
                }).length
                return (
                  <React.Fragment key={month}>
                    <td className="px-2 py-3 text-sm text-gray-900 text-center">{monthCurrent || '--'}</td>
                    <td className="px-2 py-3 text-sm text-gray-900 text-center">{monthHeadcount?.target || 0}</td>
                    <td className="px-2 py-3 text-sm text-gray-500 text-center border-l">--</td>
                  </React.Fragment>
                )
              })}
            </tr>

            {/* Departments */}
            {filteredDepartments.map((dept) => {
              const deptHeadcounts = headcountsByDept[dept.id] || []
              const deptEmployees = employees.filter((emp) => emp.departmentId === dept.id)
              const yearHeadcount = deptHeadcounts.find((h) => h.month === null)
              const deptCurrent = deptEmployees.length
              const deptTarget = yearHeadcount?.target || 0

              return (
                <tr key={dept.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900 sticky left-0 bg-white z-10">
                    {dept.name}
                  </td>
                  <td className="px-2 py-3 text-sm text-gray-900 text-center">{deptCurrent}</td>
                  <td className="px-2 py-3 text-sm text-gray-900 text-center">{deptTarget}</td>
                  <td className="px-2 py-3 text-sm text-gray-500 text-center border-l">
                    {getNeedToRecruit(deptCurrent, deptTarget)}
                  </td>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
                    const monthHeadcount = getHeadcountData(dept.id, month)
                    const monthCurrent = deptEmployees.filter((emp) => {
                      const empDate = new Date((emp as any).createdAt || '')
                      return empDate.getMonth() + 1 <= month && empDate.getFullYear() === selectedYear
                    }).length
                    const monthTarget = monthHeadcount?.target || 0
                    return (
                      <React.Fragment key={month}>
                        <td className="px-2 py-3 text-sm text-gray-900 text-center">{monthCurrent || '--'}</td>
                        <td className="px-2 py-3 text-sm text-gray-900 text-center">{monthTarget}</td>
                        <td className="px-2 py-3 text-sm text-gray-500 text-center border-l">
                          {getNeedToRecruit(monthCurrent, monthTarget)}
                        </td>
                      </React.Fragment>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div ref={createFormRef} className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Tạo định biên mới</h3>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên định biên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kỳ định biên <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.period}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        period: e.target.value as any,
                        month: e.target.value === 'MONTH' ? formData.month : null,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="MONTH">Tháng</option>
                    <option value="QUARTER">Quý</option>
                    <option value="HALF_YEAR">Nửa năm</option>
                    <option value="YEAR">Năm</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Năm <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                {formData.period === 'MONTH' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tháng <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.month || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          month: e.target.value ? parseInt(e.target.value) : null,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    >
                      <option value="">Chọn tháng</option>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <option key={m} value={m}>
                          Tháng {m}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phòng ban <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.departmentId}
                  onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Chọn phòng ban</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vị trí <span className="text-red-500">*</span> (có thể chọn nhiều)
                </label>
                <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md p-2">
                  {positions
                    .filter((pos) => {
                      // Filter positions by selected department if needed
                      return true
                    })
                    .map((position) => (
                      <label key={position.id} className="flex items-center py-1">
                        <input
                          type="checkbox"
                          checked={formData.positionIds.includes(position.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                positionIds: [...formData.positionIds, position.id],
                              })
                            } else {
                              setFormData({
                                ...formData,
                                positionIds: formData.positionIds.filter((id) => id !== position.id),
                              })
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm">{position.name}</span>
                      </label>
                    ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hiện tại <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.current}
                    onChange={(e) => setFormData({ ...formData, current: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Định biên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.target}
                    onChange={(e) => setFormData({ ...formData, target: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                >
                  Tạo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
