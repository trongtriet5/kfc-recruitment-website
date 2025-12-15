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

export default function CreateDecisionForm() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    employeeId: '',
    typeId: '',
    title: '',
    content: '',
    effectiveDate: '',
    fileUrl: '',
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [decisionTypes, setDecisionTypes] = useState<Type[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const formRef = React.useRef<HTMLDivElement>(null)

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
          api.get('/types/by-category/DECISION_TYPE'),
        ])

        setEmployees(employeesRes.data)
        setDecisionTypes(typesRes.data)
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
        title: formData.title,
        content: formData.content,
        effectiveDate: formData.effectiveDate,
        fileUrl: formData.fileUrl || undefined,
      }

      const response = await api.post('/decisions', payload)
      alert('Đã tạo quyết định thành công!')
      router.push(`/dashboard/employees/decisions/${response.data.id}`)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi tạo quyết định')
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Tạo quyết định mới</h1>

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

        {/* Decision Type */}
        <div>
          <label htmlFor="typeId" className="block text-sm font-medium text-gray-700 mb-1">
            Loại quyết định <span className="text-red-500">*</span>
          </label>
          <select
            id="typeId"
            value={formData.typeId}
            onChange={(e) => setFormData({ ...formData, typeId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            required
          >
            <option value="">Chọn loại quyết định</option>
            {decisionTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Tiêu đề <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            required
          />
        </div>

        {/* Content */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            Nội dung <span className="text-red-500">*</span>
          </label>
          <textarea
            id="content"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            required
          />
        </div>

        {/* Effective Date */}
        <div>
          <label htmlFor="effectiveDate" className="block text-sm font-medium text-gray-700 mb-1">
            Ngày hiệu lực <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="effectiveDate"
            value={formData.effectiveDate}
            onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            required
          />
        </div>

        {/* File URL */}
        <div>
          <label htmlFor="fileUrl" className="block text-sm font-medium text-gray-700 mb-1">
            Link file quyết định
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
            {submitting ? 'Đang tạo...' : 'Tạo quyết định'}
          </button>
        </div>
      </form>
    </div>
  )
}

