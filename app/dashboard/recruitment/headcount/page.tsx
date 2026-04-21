'use client'

import React, { useEffect, useState } from 'react'
import api from '@/lib/api'

interface Store {
  id: string
  name: string
  code: string
}

interface Position {
  id: string
  name: string
}

interface Headcount {
  id: string
  code: string
  name: string
  storeId: string | null
  store: Store | null
  current: number
  target: number
  year: number
  month: number | null
}

interface HeadcountPosition {
  positionId: string
  position: Position
}

export default function HeadcountPage() {
  const [headcounts, setHeadcounts] = useState<Headcount[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedStore, setSelectedStore] = useState<string>('')
  const [formData, setFormData] = useState({
    name: '',
    storeId: '',
    target: 0,
    current: 0,
    year: new Date().getFullYear(),
    month: null as number | null,
    period: 'YEAR' as 'MONTH' | 'QUARTER' | 'HALF_YEAR' | 'YEAR',
  })

  useEffect(() => {
    loadData()
  }, [selectedYear])

  const loadData = async () => {
    try {
      const [headcountsRes, storesRes, positionsRes] = await Promise.all([
        api.get(`/recruitment/headcounts?year=${selectedYear}`),
        api.get('/stores'),
        api.get('/positions'),
      ])
      setHeadcounts(headcountsRes.data)
      setStores(storesRes.data)
      setPositions(positionsRes.data)
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/recruitment/headcounts', formData)
      setShowCreateModal(false)
      loadData()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra')
    }
  }

  const filteredHeadcounts = selectedStore
    ? headcounts.filter((h) => h.storeId === selectedStore)
    : headcounts

  const groupedByStore = filteredHeadcounts.reduce((acc, h) => {
    const storeId = h.storeId || 'null'
    if (!acc[storeId]) {
      acc[storeId] = []
    }
    acc[storeId].push(h)
    return acc
  }, {} as Record<string, Headcount[]>)

  if (loading) {
    return <div className="text-center py-8">Đang tải...</div>
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold">Định biên theo cửa hàng</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
        >
          Tạo định biên
        </button>
      </div>

      <div className="mb-4 flex gap-4">
        <select
          value={selectedStore}
          onChange={(e) => setSelectedStore(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">Tất cả cửa hàng</option>
          {stores.map((store) => (
            <option key={store.id} value={store.id}>
              {store.name}
            </option>
          ))}
        </select>
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

      <div className="bg-white shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Cửa hàng
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Hiện có
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Định biên
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Cần tuyển
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Tháng
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Object.entries(groupedByStore).map(([storeId, storeHeadcounts]) => (
              <React.Fragment key={storeId}>
                {storeHeadcounts.map((h, idx) => (
                  <tr key={h.id} className="hover:bg-gray-50">
                    {idx === 0 && (
                      <td
                        className="px-4 py-3 text-sm font-medium text-gray-900"
                        rowSpan={storeHeadcounts.length}
                      >
                        {h.store?.name || 'Chưa phân bổ'}
                      </td>
                    )}
                    <td className="px-4 py-3 text-sm text-gray-900 text-center">
                      {h.current}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-center">
                      {h.target}
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          h.target - h.current > 0
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {h.target - h.current > 0
                          ? `Cần ${h.target - h.current}`
                          : 'Đủ'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 text-center">
                      {h.month ? `Tháng ${h.month}` : 'Cả năm'}
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">Tạo định biên mới</h3>
              <button onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Tên định biên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Cửa hàng <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.storeId}
                  onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                >
                  <option value="">Chọn cửa hàng</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Hiện tại</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.current}
                    onChange={(e) =>
                      setFormData({ ...formData, current: parseInt(e.target.value) })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Định biên</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.target}
                    onChange={(e) =>
                      setFormData({ ...formData, target: parseInt(e.target.value) })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border rounded-md"
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