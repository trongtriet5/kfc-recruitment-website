'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
type Education = 'HIGH_SCHOOL' | 'VOCATIONAL' | 'COLLEGE' | 'UNIVERSITY' | 'POSTGRADUATE'
type Brand = 'MAYCHA' | 'TAM_HAO' | 'BOTH'
import { useClickOutside } from '@/hooks/useClickOutside'

interface Candidate {
  id: string
  fullName: string
  email: string | null
  phone: string
  gender: string | null
  dateOfBirth: string | null
  cccd: string | null
  currentCity: string | null
  currentDistrict: string | null
  currentWard: string | null
  currentStreet: string | null
  brand: Brand | null
  storeId: string | null
  position: string | null
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

interface Type {
  id: string
  name: string
  code: string
}

interface ConvertCandidateToEmployeeFormProps {
  candidate: Candidate
  onClose: () => void
  onSuccess: () => void
}

export default function ConvertCandidateToEmployeeForm({
  candidate,
  onClose,
  onSuccess,
}: ConvertCandidateToEmployeeFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    employeeCode: '',
    education: 'HIGH_SCHOOL' as Education,
    statusId: '',
    departmentId: '',
    positionId: '',
    storeId: candidate.storeId || '',
    brand: candidate.brand || '' as Brand | '',
    contractTypeId: '',
    startDate: '',
    endDate: '',
    salary: '',
    insuranceNumber: '',
    address: '',
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [statuses, setStatuses] = useState<Type[]>([])
  const [contractTypes, setContractTypes] = useState<Type[]>([])
  const formRef = React.useRef<HTMLDivElement>(null)

  useClickOutside(formRef, () => {
    if (!submitting) {
      onClose()
    }
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        const [
          departmentsRes,
          positionsRes,
          storesRes,
          statusesRes,
          contractTypesRes,
          codeRes,
        ] = await Promise.all([
          api.get('/organization/departments'),
          api.get('/organization/positions'),
          api.get('/organization/stores'),
          api.get('/types/by-category/EMPLOYEE_STATUS'),
          api.get('/types/by-category/CONTRACT_TYPE'),
          api.get('/employees/generate-code'),
        ])

        setDepartments(departmentsRes.data)
        setPositions(positionsRes.data)
        setStores(storesRes.data)
        setStatuses(statusesRes.data)
        setContractTypes(contractTypesRes.data)

        // Set default employee code
        setFormData((prev) => ({ ...prev, employeeCode: codeRes.data.employeeCode }))

        // Set default status to WORKING
        const workingStatus = statusesRes.data.find((s: Type) => s.code === 'WORKING')
        if (workingStatus) {
          setFormData((prev) => ({ ...prev, statusId: workingStatus.id }))
        }

        // Build address from candidate data
        if (candidate.currentCity) {
          const addressParts = [
            candidate.currentStreet,
            candidate.currentWard,
            candidate.currentDistrict,
            candidate.currentCity,
          ].filter(Boolean)
          setFormData((prev) => ({ ...prev, address: addressParts.join(', ') }))
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Không thể tải dữ liệu cần thiết')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [candidate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const payload = {
        candidateId: candidate.id,
        employeeCode: formData.employeeCode,
        education: formData.education,
        statusId: formData.statusId || undefined,
        departmentId: formData.departmentId || undefined,
        positionId: formData.positionId || undefined,
        storeId: formData.storeId || undefined,
        brand: formData.brand === '' ? undefined : formData.brand,
        contractTypeId: formData.contractTypeId || undefined,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        salary: formData.salary ? parseFloat(formData.salary) : undefined,
        insuranceNumber: formData.insuranceNumber || undefined,
        address: formData.address || undefined,
      }

      const response = await api.post('/employees/convert-from-candidate', payload)
      alert('Đã chuyển ứng viên thành nhân viên thành công!')
      onSuccess()
      router.push(`/dashboard/employees/${response.data.id}`)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi chuyển đổi ứng viên')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl p-6">
          <div className="text-center py-4">Đang tải...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div
        ref={formRef}
        className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Chuyển ứng viên thành nhân viên
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Ứng viên: <strong>{candidate.fullName}</strong>
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Employee Code */}
            <div>
              <label htmlFor="employeeCode" className="block text-sm font-medium text-gray-700 mb-1">
                Mã nhân viên <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="employeeCode"
                value={formData.employeeCode}
                onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                required
              />
            </div>

            {/* Education */}
            <div>
              <label htmlFor="education" className="block text-sm font-medium text-gray-700 mb-1">
                Học vấn <span className="text-red-500">*</span>
              </label>
              <select
                id="education"
                value={formData.education}
                onChange={(e) => setFormData({ ...formData, education: e.target.value as Education })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                required
              >
                <option value="HIGH_SCHOOL">THPT</option>
                <option value="VOCATIONAL">Trung cấp</option>
                <option value="COLLEGE">Cao đẳng</option>
                <option value="UNIVERSITY">Đại học</option>
                <option value="POSTGRADUATE">Sau đại học</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label htmlFor="statusId" className="block text-sm font-medium text-gray-700 mb-1">
                Trạng thái
              </label>
              <select
                id="statusId"
                value={formData.statusId}
                onChange={(e) => setFormData({ ...formData, statusId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="">Chọn trạng thái</option>
                {statuses.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Department */}
            <div>
              <label htmlFor="departmentId" className="block text-sm font-medium text-gray-700 mb-1">
                Phòng ban
              </label>
              <select
                id="departmentId"
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="">Chọn phòng ban</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Position */}
            <div>
              <label htmlFor="positionId" className="block text-sm font-medium text-gray-700 mb-1">
                Vị trí
              </label>
              <select
                id="positionId"
                value={formData.positionId}
                onChange={(e) => setFormData({ ...formData, positionId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="">Chọn vị trí</option>
                {positions.map((pos) => (
                  <option key={pos.id} value={pos.id}>
                    {pos.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Store */}
            <div>
              <label htmlFor="storeId" className="block text-sm font-medium text-gray-700 mb-1">
                Cửa hàng
              </label>
              <select
                id="storeId"
                value={formData.storeId}
                onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="">Chọn cửa hàng</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand */}
            <div>
              <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">
                Brand
              </label>
              <select
                id="brand"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value as Brand })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="">Chọn Brand</option>
                <option value="MAYCHA">Maycha</option>
                <option value="TAM_HAO">Tam Hảo</option>
                <option value="BOTH">Cả hai</option>
              </select>
            </div>

            {/* Contract Type */}
            <div>
              <label htmlFor="contractTypeId" className="block text-sm font-medium text-gray-700 mb-1">
                Loại hợp đồng
              </label>
              <select
                id="contractTypeId"
                value={formData.contractTypeId}
                onChange={(e) => setFormData({ ...formData, contractTypeId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
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
                Ngày bắt đầu
              </label>
              <input
                type="date"
                id="startDate"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
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
              />
            </div>

            {/* Salary */}
            <div>
              <label htmlFor="salary" className="block text-sm font-medium text-gray-700 mb-1">
                Lương
              </label>
              <input
                type="number"
                id="salary"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                min="0"
                step="1000"
              />
            </div>

            {/* Insurance Number */}
            <div>
              <label htmlFor="insuranceNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Số BHXH
              </label>
              <input
                type="text"
                id="insuranceNumber"
                value={formData.insuranceNumber}
                onChange={(e) => setFormData({ ...formData, insuranceNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>

            {/* Address */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Địa chỉ
              </label>
              <textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
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
                {submitting ? 'Đang xử lý...' : 'Chuyển đổi'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

