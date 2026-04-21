'use client'

import { useEffect, useState, useRef } from 'react'
import api from '@/lib/api'

interface Store {
  id: string
  name: string
  code: string
  address?: string
  phone?: string
  district?: string
  city?: string
  am?: string
  om?: string
  od?: string
  zone?: string
  area?: string
  taIncharge?: string
  group?: string
  isActive: boolean
}

interface FormErrors {
  name?: string
  code?: string
}

const STORE_GROUPS = ['OPS_SOUTH', 'OPS_NORTH']

export default function StoresManagementPage() {
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingStore, setEditingStore] = useState<Store | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    phone: '',
    district: '',
    city: '',
    am: '',
    om: '',
    od: '',
    zone: '',
    area: '',
    taIncharge: '',
    group: '',
  })
  const [formErrors, setFormErrors] = useState<FormErrors>({})

  useEffect(() => {
    loadStores()
  }, [])

  const loadStores = async () => {
    try {
      const res = await api.get('/stores')
      setStores(res.data || [])
    } catch (err) {
      console.error('Error loading stores:', err)
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const errors: FormErrors = {}
    if (!formData.name.trim()) errors.name = 'Tên cửa hàng là bắt buộc'
    if (!formData.code.trim()) errors.code = 'Mã cửa hàng là bắt buộc'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      const payload = {
        ...formData,
        isActive: true,
      }
      if (editingStore) {
        await api.patch(`/stores/${editingStore.id}`, payload)
      } else {
        await api.post('/stores', payload)
      }
      setShowCreateModal(false)
      setEditingStore(null)
      resetFormData()
      loadStores()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra')
    }
  }

  const handleEdit = (store: Store) => {
    setEditingStore(store)
    setFormData({
      name: store.name,
      code: store.code,
      address: store.address || '',
      phone: store.phone || '',
      district: store.district || '',
      city: store.city || '',
      am: store.am || '',
      om: store.om || '',
      od: store.od || '',
      zone: store.zone || '',
      area: store.area || '',
      taIncharge: store.taIncharge || '',
      group: store.group || '',
    })
    setShowCreateModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa cửa hàng này?')) return
    try {
      await api.delete(`/stores/${id}`)
      loadStores()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra')
    }
  }

  const resetFormData = () => {
    setFormData({ name: '', code: '', address: '', phone: '', district: '', city: '', am: '', om: '', od: '', zone: '', area: '', taIncharge: '', group: '' })
    setFormErrors({})
  }

  const handleExport = () => {
    const headers = ['Mã', 'Tên cửa hàng', 'Địa chỉ', 'Quận/Huyện', 'Thành phố', 'AM', 'OM', 'OD', 'Zone', 'Area', 'TA IC', 'Group']
    const csvContent = [
      headers.join(','),
      ...filteredStores.map((s) =>
        [
          `"${s.code}"`,
          `"${s.name}"`,
          `"${s.address || ''}"`,
          `"${s.district || ''}"`,
          `"${s.city || ''}"`,
          `"${s.am || ''}"`,
          `"${s.om || ''}"`,
          `"${s.od || ''}"`,
          `"${s.zone || ''}"`,
          `"${s.area || ''}"`,
          `"${s.taIncharge || ''}"`,
          `"${s.group || ''}"`,
        ].join(',')
      ),
    ].join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `stores_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string
        const lines = content.split('\n').filter((l) => l.trim())
        const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''))

        const dataRows = lines.slice(1).map((line) => {
          const values = line.split(',').map((v) => v.trim().replace(/"/g, ''))
          const row: Record<string, string> = {}
          headers.forEach((h, i) => {
            row[h] = values[i] || ''
          })
          return row
        })

        let successCount = 0
        let errorCount = 0

        for (const row of dataRows) {
          if (!row['Mã'] || !row['Tên cửa hàng']) {
            errorCount++
            continue
          }

          try {
            await api.post('/stores/import', {
              code: row['Mã'],
              name: row['Tên cửa hàng'],
              address: row['Địa chỉ'] || '',
              district: row['Quận/Huyện'] || '',
              city: row['Thành phố'] || '',
              am: row['AM'] || '',
              om: row['OM'] || '',
              od: row['OD'] || '',
              zone: row['Zone'] || '',
              area: row['Area'] || '',
              taIncharge: row['TA IC'] || '',
              group: row['Group'] || '',
            })
            successCount++
          } catch {
            errorCount++
          }
        }

        alert(`Đã import: ${successCount} thành công, ${errorCount} lỗi`)
        loadStores()
      } catch (err) {
        alert('Lỗi khi đọc file')
      } finally {
        setImporting(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    }
    reader.readAsText(file)
  }

  const filteredStores = stores.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <div className="text-center py-8">Đang tải...</div>
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold">Quản lý cửa hàng</h2>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setEditingStore(null)
              resetFormData()
              setShowCreateModal(true)
            }}
            className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
          >
            + Thêm cửa hàng
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Export CSV
          </button>
          <label className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer">
            {importing ? 'Đang import...' : 'Import CSV'}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Tìm kiếm cửa hàng..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md"
        />
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">AM</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">OM</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">OD</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">City</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Zone</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Area</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">TA IC</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Group</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStores.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-gray-500">
                    Chưa có cửa hàng nào
                  </td>
                </tr>
              ) : (
                filteredStores.map((store) => (
                  <tr key={store.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3 text-sm font-medium text-gray-900">{store.code}</td>
                    <td className="px-3 py-3 text-sm text-gray-900">{store.name}</td>
                    <td className="px-3 py-3 text-sm text-gray-500">{store.am || '-'}</td>
                    <td className="px-3 py-3 text-sm text-gray-500">{store.om || '-'}</td>
                    <td className="px-3 py-3 text-sm text-gray-500">{store.od || '-'}</td>
                    <td className="px-3 py-3 text-sm text-gray-500">{store.city || '-'}</td>
                    <td className="px-3 py-3 text-sm text-gray-500">{store.zone || '-'}</td>
                    <td className="px-3 py-3 text-sm text-gray-500">{store.area || '-'}</td>
                    <td className="px-3 py-3 text-sm text-gray-500">{store.taIncharge || '-'}</td>
                    <td className="px-3 py-3 text-sm text-gray-500">{store.group || '-'}</td>
                    <td className="px-3 py-3 text-sm text-right space-x-2">
                      <button onClick={() => handleEdit(store)} className="text-yellow-600 hover:text-yellow-700">Sửa</button>
                      <button onClick={() => handleDelete(store.id)} className="text-red-600 hover:text-red-700">Xóa</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-lg font-semibold">{editingStore ? 'Sửa cửa hàng' : 'Thêm cửa hàng mới'}</h3>
              <button onClick={() => { setShowCreateModal(false); setEditingStore(null); resetFormData() }}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Mã cửa hàng <span className="text-red-500">*</span></label>
                  <input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className={`w-full px-3 py-2 border rounded-md ${formErrors.code ? 'border-red-500' : ''}`} />
                  {formErrors.code && <p className="text-red-500 text-sm mt-1">{formErrors.code}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tên cửa hàng <span className="text-red-500">*</span></label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={`w-full px-3 py-2 border rounded-md ${formErrors.name ? 'border-red-500' : ''}`} />
                  {formErrors.name && <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Địa chỉ</label>
                <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Quận/Huyện</label>
                  <input type="text" value={formData.district} onChange={(e) => setFormData({ ...formData, district: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Thành phố</label>
                  <input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">AM</label>
                  <input type="text" value={formData.am} onChange={(e) => setFormData({ ...formData, am: e.target.value })} className="w-full px-3 py-2 border rounded-md" placeholder="Area Manager" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">OM</label>
                  <input type="text" value={formData.om} onChange={(e) => setFormData({ ...formData, om: e.target.value })} className="w-full px-3 py-2 border rounded-md" placeholder="Operation Manager" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">OD</label>
                  <input type="text" value={formData.od} onChange={(e) => setFormData({ ...formData, od: e.target.value })} className="w-full px-3 py-2 border rounded-md" placeholder="Operation Director" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Zone</label>
                  <input type="text" value={formData.zone} onChange={(e) => setFormData({ ...formData, zone: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Area</label>
                  <input type="text" value={formData.area} onChange={(e) => setFormData({ ...formData, area: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">TA IC</label>
                  <input type="text" value={formData.taIncharge} onChange={(e) => setFormData({ ...formData, taIncharge: e.target.value })} className="w-full px-3 py-2 border rounded-md" placeholder="TA Incharge" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Group</label>
                <select value={formData.group} onChange={(e) => setFormData({ ...formData, group: e.target.value })} className="w-full px-3 py-2 border rounded-md">
                  <option value="">Chọn Group</option>
                  <option value="OPS_SOUTH">OPS-South</option>
                  <option value="OPS_NORTH">OPS-North</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => { setShowCreateModal(false); setEditingStore(null); resetFormData() }} className="px-4 py-2 border rounded-md hover:bg-gray-50">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700">{editingStore ? 'Cập nhật' : 'Tạo'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}