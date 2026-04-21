'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { useClickOutside } from '@/hooks/useClickOutside'

interface Employee {
  id: string
  employeeCode: string
  fullName: string
  department: { name: string } | null
  position: { name: string } | null
}

interface Type {
  id: string
  name: string
  code: string
}

export default function CreateContractForm() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    employeeId: '',
    typeId: '',
    startDate: '',
    endDate: '',
    salary: '',
    position: '',
    department: '',
    fileUrl: '',
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [contractTypes, setContractTypes] = useState<Type[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const formRef = React.useRef<HTMLFormElement>(null)

  useClickOutside(formRef, () => {
    if (!submitting) {
      router.back()
    }
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        const [employeesRes, typesRes] = await Promise.all([
          api.get('/employees'),
          api.get('/types/by-category/CONTRACT_TYPE'),
        ])

        setEmployees(employeesRes.data)
        setContractTypes(typesRes.data)
      } catch (err: any) {
        setError(err.response?.data?.message || 'Không thể tải dữ liệu cần thiết')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  useEffect(() => {
    if (formData.employeeId) {
      const employee = employees.find((e) => e.id === formData.employeeId)
      setSelectedEmployee(employee || null)
      if (employee) {
        setFormData((prev) => ({
          ...prev,
          position: employee.position?.name || '',
          department: employee.department?.name || '',
        }))
      }
    } else {
      setSelectedEmployee(null)
    }
  }, [formData.employeeId, employees])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const payload = {
        employeeId: formData.employeeId,
        typeId: formData.typeId,
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
        salary: parseFloat(formData.salary),
        position: formData.position || undefined,
        department: formData.department || undefined,
        fileUrl: formData.fileUrl || undefined,
      }

      const response = await api.post('/contracts', payload)
      alert('Đã tạo hợp đồng thành công!')
      router.push(`/dashboard/employees/contracts/${response.data.id}`)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi tạo hợp đồng')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-4">Đang tải...</div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Tạo hợp đồng mới</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6" ref={formRef}>
        {/* Employee */}
        <div>
          <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700 mb-1">
            Nhân viên <span className="text-red-500">*</span>
          </label>
          <select
            id="employeeId"
            value={formData.employeeId}
            onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            required
          >
            <option value="">Chọn nhân viên</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.fullName} ({employee.employeeCode})
              </option>
            ))}
          </select>
          {selectedEmployee && (
            <p className="mt-1 text-sm text-gray-500">
              {selectedEmployee.department && `Phòng ban: ${selectedEmployee.department.name}`}
              {selectedEmployee.position && ` - Vị trí: ${selectedEmployee.position.name}`}
            </p>
          )}
        </div>

        {/* Contract Type */}
        <div>
          <label htmlFor="typeId" className="block text-sm font-medium text-gray-700 mb-1">
            Loại hợp đồng <span className="text-red-500">*</span>
          </label>
          <select
            id="typeId"
            value={formData.typeId}
            onChange={(e) => setFormData({ ...formData, typeId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            required
          >
            <option value="">Chọn loại hợp đồng</option>
            {contractTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>

        {/* Start Date */}
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
            Ngày bắt đầu <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="startDate"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            required
          />
        </div>

        {/* End Date */}
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
            Ngày kết thúc
          </label>
          <input
            type="date"
            id="endDate"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            min={formData.startDate}
          />
          <p className="mt-1 text-xs text-gray-500">Để trống nếu hợp đồng vô thời hạn</p>
        </div>

        {/* Salary */}
        <div>
          <label htmlFor="salary" className="block text-sm font-medium text-gray-700 mb-1">
            Lương <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="salary"
            value={formData.salary}
            onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            min="0"
            step="1000"
            required
          />
        </div>

        {/* Position */}
        <div>
          <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
            Vị trí công việc
          </label>
          <input
            type="text"
            id="position"
            value={formData.position}
            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            placeholder="Tự động điền từ thông tin nhân viên"
          />
        </div>

        {/* Department */}
        <div>
          <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
            Phòng ban
          </label>
          <input
            type="text"
            id="department"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            placeholder="Tự động điền từ thông tin nhân viên"
          />
        </div>

        {/* File URL */}
        <div>
          <label htmlFor="fileUrl" className="block text-sm font-medium text-gray-700 mb-1">
            Link file hợp đồng
          </label>
          <input
            type="url"
            id="fileUrl"
            value={formData.fileUrl}
            onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            placeholder="https://..."
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            disabled={submitting}
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Đang tạo...' : 'Tạo hợp đồng'}
          </button>
        </div>
      </form>
    </div>
  )
}

