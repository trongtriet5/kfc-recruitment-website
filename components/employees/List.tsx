'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import Link from 'next/link'

interface Employee {
  id: string
  employeeCode: string
  fullName: string
  email: string | null
  phone: string
  status: string | { id: string; name: string; code: string } | null
  contractType: { id: string; name: string; code: string } | null
  department: { name: string } | null
  position: { name: string } | null
  store: { name: string } | null
}

interface User {
  role: string
}

interface Department {
  id: string
  name: string
}

interface Position {
  id: string
  name: string
}

interface Store {
  id: string
  name: string
}

export default function EmployeesList() {
  const router = useRouter()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [positionFilter, setPositionFilter] = useState('')
  const [storeFilter, setStoreFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusOptions, setStatusOptions] = useState<{ value: string; label: string }[]>([
    { value: '', label: 'Tất cả trạng thái' },
  ])
  const [departments, setDepartments] = useState<Department[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [stores, setStores] = useState<Store[]>([])

  useEffect(() => {
    loadUser()
    loadStatusOptions()
    loadOrganizations()
    loadEmployees()
  }, [statusFilter, departmentFilter, positionFilter, storeFilter])

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      loadEmployees()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const loadStatusOptions = async () => {
    try {
      const res = await api.get('/types/by-category/EmployeeStatus')
      setStatusOptions([
        { value: '', label: 'Tất cả trạng thái' },
        ...res.data.map((s: any) => ({ value: s.id, label: s.name })),
      ])
    } catch (err) {
      console.error('Failed to load status options:', err)
    }
  }

  const loadOrganizations = async () => {
    try {
      const [deptsRes, posRes, storesRes] = await Promise.all([
        api.get('/organization/departments'),
        api.get('/organization/positions'),
        api.get('/organization/stores'),
      ])
      setDepartments(deptsRes.data)
      setPositions(posRes.data)
      setStores(storesRes.data)
    } catch (err) {
      console.error('Failed to load organizations:', err)
    }
  }

  const loadUser = () => {
    api
      .get('/auth/me')
      .then((res) => setUser(res.data))
      .catch(console.error)
  }

  const loadEmployees = () => {
    const params = new URLSearchParams()
    if (statusFilter) params.append('statusId', statusFilter)
    if (departmentFilter) params.append('departmentId', departmentFilter)
    if (positionFilter) params.append('positionId', positionFilter)
    if (storeFilter) params.append('storeId', storeFilter)

    const url = `/employees${params.toString() ? '?' + params.toString() : ''}`
    api
      .get(url)
      .then((res) => {
        let filtered = res.data
        if (searchQuery) {
          const query = searchQuery.toLowerCase()
          filtered = filtered.filter(
            (emp: Employee) =>
              emp.fullName.toLowerCase().includes(query) ||
              emp.employeeCode.toLowerCase().includes(query) ||
              emp.email?.toLowerCase().includes(query) ||
              emp.phone.includes(query)
          )
        }
        setEmployees(filtered)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  const getStatusLabel = (status: string | { id: string; name: string; code: string } | null | undefined) => {
    if (!status) return 'Chưa có trạng thái'
    if (typeof status === 'object') return status.name
    return status
  }

  const getStatusColor = (status: string | { id: string; name: string; code: string } | null | undefined) => {
    const statusCode = typeof status === 'object' ? status?.code : status
    if (!statusCode) return 'bg-gray-100 text-gray-800'
    switch (statusCode) {
      case 'WORKING':
        return 'bg-green-100 text-green-800'
      case 'PROBATION':
        return 'bg-yellow-100 text-yellow-800'
      case 'RESIGNED':
        return 'bg-red-100 text-red-800'
      case 'TEMPORARY_LEAVE':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const canCreate = user && (user.role === 'ADMIN' || user.role === 'HEAD_OF_DEPARTMENT')

  if (loading) {
    return <div className="text-center py-4">Đang tải...</div>
  }

  return (
    <div>
      <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-semibold">Danh sách nhân sự</h2>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm flex-1 sm:flex-none sm:w-48"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">Tất cả phòng ban</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
          <select
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">Tất cả vị trí</option>
            {positions.map((pos) => (
              <option key={pos.id} value={pos.id}>
                {pos.name}
              </option>
            ))}
          </select>
          <select
            value={storeFilter}
            onChange={(e) => setStoreFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">Tất cả cửa hàng</option>
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
          {canCreate && (
            <Link
              href="/dashboard/employees/new"
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm whitespace-nowrap"
            >
              Tạo hồ sơ mới
            </Link>
          )}
        </div>
      </div>

      {employees.length === 0 ? (
        <div className="bg-white shadow rounded-md p-8 text-center text-gray-500">
          {searchQuery || statusFilter || departmentFilter || positionFilter || storeFilter
            ? 'Không tìm thấy nhân sự phù hợp với bộ lọc'
            : 'Chưa có nhân sự nào'}
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {employees.map((employee) => (
              <li key={employee.id}>
                <Link
                  href={`/dashboard/employees/${employee.id}`}
                  className="block hover:bg-gray-50"
                >
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-yellow-600 truncate">
                            {employee.fullName}
                          </p>
                          <span
                            className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                              employee.status
                            )}`}
                          >
                            {getStatusLabel(employee.status)}
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-gray-500">
                          <span>Mã NV: {employee.employeeCode}</span>
                          {employee.email && <span className="ml-4">{employee.email}</span>}
                          <span className="ml-4">{employee.phone}</span>
                        </div>
                        <div className="mt-1 text-sm text-gray-500">
                          {employee.department && (
                            <span>Phòng ban: {employee.department.name}</span>
                          )}
                          {employee.position && (
                            <span className="ml-4">Vị trí: {employee.position.name}</span>
                          )}
                          {employee.store && (
                            <span className="ml-4">Cửa hàng: {employee.store.name}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
