'use client'

import { useEffect, useState, useRef } from 'react'
import api from '@/lib/api'
import Icon from '@/components/icons/Icon'
import Layout from '@/components/Layout'
import * as XLSX from 'xlsx'

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

export default function StoresManagementPage() {
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingStore, setEditingStore] = useState<Store | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterGroup, setFilterGroup] = useState('')
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    name: '', code: '', address: '', phone: '', district: '', city: '', am: '', om: '', od: '', zone: '', area: '', taIncharge: '', group: '',
  })
  const [formErrors, setFormErrors] = useState<FormErrors>({})

  useEffect(() => { loadStores() }, [])

  const loadStores = async () => {
    try {
      const res = await api.get('/stores')
      setStores(res.data || [])
    } catch (err) { console.error('Error loading stores:', err) }
    finally { setLoading(false) }
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
      const payload = { ...formData, isActive: true }
      if (editingStore) { await api.patch(`/stores/${editingStore.id}`, payload) }
      else { await api.post('/stores', payload) }
      setShowCreateModal(false)
      setEditingStore(null)
      resetFormData()
      loadStores()
    } catch (err: any) { alert(err.response?.data?.message || 'Có lỗi xảy ra') }
  }

  const handleEdit = (store: Store) => {
    setEditingStore(store)
    setFormData({
      name: store.name, code: store.code, address: store.address || '', phone: store.phone || '',
      district: store.district || '', city: store.city || '', am: store.am || '', om: store.om || '',
      od: store.od || '', zone: store.zone || '', area: store.area || '', taIncharge: store.taIncharge || '', group: store.group || '',
    })
    setShowCreateModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa cửa hàng này?')) return
    try {
      await api.delete(`/stores/${id}`)
      loadStores()
    } catch (err: any) { alert(err.response?.data?.message || 'Có lỗi xảy ra') }
  }

  const resetFormData = () => {
    setFormData({ name: '', code: '', address: '', phone: '', district: '', city: '', am: '', om: '', od: '', zone: '', area: '', taIncharge: '', group: '' })
    setFormErrors({})
  }

  const handleExport = () => {
    const headers = ['Mã', 'Tên cửa hàng', 'Địa chỉ', 'Quận/Huyện', 'Thành phố', 'AM', 'OM', 'OD', 'Zone', 'Area', 'TA IC', 'Group']
    const data = filteredStores.map(s => [s.code, s.name, s.address || '', s.district || '', s.city || '', s.am || '', s.om || '', s.od || '', s.zone || '', s.area || '', s.taIncharge || '', s.group || ''])
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data])
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Stores')
    const max_width = data.reduce((w, r) => Math.max(w, r[1]?.length || 10), 20)
    worksheet['!cols'] = [{ wch: 10 }, { wch: max_width }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 15 }]
    XLSX.writeFile(workbook, `stores_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const bstr = event.target?.result
        const workbook = XLSX.read(bstr, { type: 'binary' })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        const dataRows = XLSX.utils.sheet_to_json(worksheet) as any[]
        let successCount = 0, errorCount = 0
        for (const row of dataRows) {
          const code = row['Mã'] || row['code'] || row['Code']
          const name = row['Tên cửa hàng'] || row['name'] || row['Store Name']
          if (!code || !name) { errorCount++; continue }
          try {
            await api.post('/stores/import', {
              code: String(code).trim(), name: String(name).trim(),
              address: row['Địa chỉ'] || row['address'] || '',
              district: row['Quận/Huyện'] || row['district'] || '',
              city: row['Thành phố'] || row['city'] || '',
              am: row['AM'] || row['am'] || '',
              om: row['OM'] || row['om'] || '',
              od: row['OD'] || row['od'] || '',
              zone: row['Zone'] || row['zone'] || '',
              area: row['Area'] || row['area'] || '',
              taIncharge: row['TA IC'] || row['ta_incharge'] || '',
              group: row['Group'] || row['group'] || '',
            })
            successCount++
          } catch { errorCount++ }
        }
        alert(`Đã import: ${successCount} thành công, ${errorCount} lỗi`)
        loadStores()
      } catch (err) { console.error('Import error:', err); alert('Lỗi khi đọc file Excel.') }
      finally { setImporting(false); if (fileInputRef.current) fileInputRef.current.value = '' }
    }
    reader.readAsBinaryString(file)
  }

  const filteredStores = stores.filter((s) =>
    (s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.code.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterGroup === '' || s.group === filterGroup)
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kfc-red"></div>
        <span className="ml-3 text-gray-600">Đang tải dữ liệu cửa hàng...</span>
      </div>
    )
  }

  const totalStores = stores.length, activeStores = stores.filter(s => s.isActive).length
  const opsSouthCount = stores.filter(s => s.group === 'OPS_SOUTH').length
  const opsNorthCount = stores.filter(s => s.group === 'OPS_NORTH').length

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quản lý cửa hàng</h2>
          <p className="text-sm text-gray-500 mt-1">Quản lý danh sách hệ thống nhà hàng KFC Việt Nam</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium">
            <Icon name="download" size={18} /> Export Excel
          </button>
          <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer text-sm font-medium">
            <Icon name="upload" size={18} /> {importing ? 'Đang import...' : 'Import Excel'}
            <input ref={fileInputRef} type="file" accept=".xlsx, .xls" onChange={handleImport} className="hidden" />
          </label>
          <button onClick={() => { setEditingStore(null); resetFormData(); setShowCreateModal(true) }} className="flex items-center gap-2 px-4 py-2 bg-kfc-red text-white rounded-md hover:bg-red-700 text-sm font-medium">
            <Icon name="plus" size={18} /> Thêm cửa hàng
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500 flex items-center justify-between">
          <div><p className="text-xs font-semibold text-gray-500 uppercase">Tổng cửa hàng</p><p className="text-2xl font-bold mt-1">{totalStores}</p></div>
          <div className="bg-blue-50 p-2 rounded-full text-blue-600"><Icon name="store" size={24} /></div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500 flex items-center justify-between">
          <div><p className="text-xs font-semibold text-gray-500 uppercase">Đang hoạt động</p><p className="text-2xl font-bold text-green-600 mt-1">{activeStores}</p></div>
          <div className="bg-green-50 p-2 rounded-full text-green-600"><Icon name="check-circle" size={24} /></div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-orange-500 flex items-center justify-between">
          <div><p className="text-xs font-semibold text-gray-500 uppercase">OPS South</p><p className="text-2xl font-bold text-orange-600 mt-1">{opsSouthCount}</p></div>
          <div className="bg-orange-50 p-2 rounded-full text-orange-600"><Icon name="map-pin" size={24} /></div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-purple-500 flex items-center justify-between">
          <div><p className="text-xs font-semibold text-gray-500 uppercase">OPS North</p><p className="text-2xl font-bold text-purple-600 mt-1">{opsNorthCount}</p></div>
          <div className="bg-purple-50 p-2 rounded-full text-purple-600"><Icon name="map-pin" size={24} /></div>
        </div>
      </div>

      <div className="flex gap-4 items-center bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Icon name="search" size={18} className="text-gray-400" /></div>
          <input type="text" placeholder="Tìm theo mã hoặc tên cửa hàng..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-kfc-red focus:border-kfc-red outline-none sm:text-sm" />
        </div>
        <select value={filterGroup} onChange={(e) => setFilterGroup(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md sm:text-sm">
          <option value="">Tất cả vùng miền</option>
          <option value="OPS_SOUTH">OPS-South</option>
          <option value="OPS_NORTH">OPS-North</option>
        </select>
        <button onClick={loadStores} className="p-2 border border-gray-300 rounded-md hover:bg-gray-50" title="Tải lại"><Icon name="refresh" size={18} /></button>
      </div>

      <div className="bg-white shadow rounded-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase w-24 sticky left-0 bg-gray-50 z-10">Mã</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase border-l">Tên cửa hàng</th>
                <th className="px-3 py-4 text-left text-xs font-bold text-gray-500 uppercase border-l">AM</th>
                <th className="px-3 py-4 text-left text-xs font-bold text-gray-500 uppercase">OM</th>
                <th className="px-3 py-4 text-left text-xs font-bold text-gray-500 uppercase">OD</th>
                <th className="px-3 py-4 text-left text-xs font-bold text-gray-500 uppercase border-l">Thành phố</th>
                <th className="px-3 py-4 text-left text-xs font-bold text-gray-500 uppercase">Quận/Huyện</th>
                <th className="px-3 py-4 text-left text-xs font-bold text-gray-500 uppercase border-l">Vùng miền</th>
                <th className="px-3 py-4 text-left text-xs font-bold text-gray-500 uppercase">TA Incharge</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase border-l w-24">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredStores.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-12 text-center text-gray-400"><Icon name="store" size={48} className="mb-2 opacity-20" /><p>Không tìm thấy cửa hàng nào</p></td></tr>
              ) : (
                filteredStores.map((store) => (
                  <tr key={store.id} className="hover:bg-gray-50 group">
                    <td className="px-4 py-3 text-sm font-bold text-kfc-red sticky left-0 bg-white group-hover:bg-gray-50 z-10">{store.code}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-l font-medium">{store.name}{store.isActive === false && <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px] font-bold">INACTIVE</span>}</td>
                    <td className="px-3 py-3 text-sm text-gray-600 border-l">{store.am || '-'}</td>
                    <td className="px-3 py-3 text-sm text-gray-600">{store.om || '-'}</td>
                    <td className="px-3 py-3 text-sm text-gray-600">{store.od || '-'}</td>
                    <td className="px-3 py-3 text-sm text-gray-600 border-l">{store.city || '-'}</td>
                    <td className="px-3 py-3 text-sm text-gray-600">{store.district || '-'}</td>
                    <td className="px-3 py-3 text-sm text-gray-600 border-l">{store.group === 'OPS_SOUTH' ? <span className="px-2 py-1 bg-orange-50 text-orange-700 rounded text-xs">South</span> : store.group === 'OPS_NORTH' ? <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs">North</span> : '-'}</td>
                    <td className="px-3 py-3 text-sm text-gray-600">{store.taIncharge || '-'}</td>
                    <td className="px-4 py-3 text-sm text-right space-x-3 border-l">
                      <button onClick={() => handleEdit(store)} className="text-gray-400 hover:text-blue-600 p-1 hover:bg-blue-50 rounded" title="Chỉnh sửa"><Icon name="pencil" size={16} /></button>
                      <button onClick={() => handleDelete(store.id)} className="text-gray-400 hover:text-kfc-red p-1 hover:bg-red-50 rounded" title="Xóa"><Icon name="trash" size={16} /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="bg-kfc-red/10 p-2 rounded-lg text-kfc-red"><Icon name={editingStore ? 'pencil' : 'plus'} size={20} /></div>
                <h3 className="text-xl font-bold">{editingStore ? 'Chỉnh sửa cửa hàng' : 'Thêm cửa hàng mới'}</h3>
              </div>
              <button onClick={() => { setShowCreateModal(false); setEditingStore(null); resetFormData() }} className="p-2 hover:bg-gray-100 rounded-full"><Icon name="x" size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Mã cửa hàng <span className="text-red-500">*</span></label>
                  <input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} placeholder="VD: SG001" className={`w-full px-3 py-2 border rounded-md ${formErrors.code ? 'border-red-500' : 'border-gray-300 focus:border-kfc-red'}`} />
                  {formErrors.code && <p className="text-red-500 text-[11px] mt-1">{formErrors.code}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Tên cửa hàng <span className="text-red-500">*</span></label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="VD: KFC Lê Văn Sỹ" className={`w-full px-3 py-2 border rounded-md ${formErrors.name ? 'border-red-500' : 'border-gray-300 focus:border-kfc-red'}`} />
                  {formErrors.name && <p className="text-red-500 text-[11px] mt-1">{formErrors.name}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 border-l-4 border-kfc-red pl-2">Thông tin địa chỉ</label>
                <div className="grid grid-cols-1 gap-4 mt-3">
                  <div><label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Địa chỉ cụ thể</label><input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Quận/Huyện</label><input type="text" value={formData.district} onChange={(e) => setFormData({ ...formData, district: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" /></div>
                    <div><label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Thành phố</label><input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" /></div>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 border-l-4 border-blue-500 pl-2">Thông tin quản lý</label>
                <div className="grid grid-cols-3 gap-4 mt-3">
                  <div><label className="block text-xs font-bold text-gray-500 mb-1 uppercase">AM</label><input type="text" value={formData.am} onChange={(e) => setFormData({ ...formData, am: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" /></div>
                  <div><label className="block text-xs font-bold text-gray-500 mb-1 uppercase">OM</label><input type="text" value={formData.om} onChange={(e) => setFormData({ ...formData, om: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" /></div>
                  <div><label className="block text-xs font-bold text-gray-500 mb-1 uppercase">OD</label><input type="text" value={formData.od} onChange={(e) => setFormData({ ...formData, od: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" /></div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Vùng miền</label>
                  <select value={formData.group} onChange={(e) => setFormData({ ...formData, group: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                    <option value="">Chọn Group</option>
                    <option value="OPS_SOUTH">OPS-South (Miền Nam)</option>
                    <option value="OPS_NORTH">OPS-North (Miền Bắc)</option>
                  </select>
                </div>
                <div><label className="block text-xs font-bold text-gray-500 mb-1 uppercase">TA Incharge</label><input type="text" value={formData.taIncharge} onChange={(e) => setFormData({ ...formData, taIncharge: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" /></div>
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t">
                <button type="button" onClick={() => { setShowCreateModal(false); setEditingStore(null); resetFormData() }} className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50">Hủy bỏ</button>
                <button type="submit" className="px-8 py-2.5 bg-kfc-red text-white rounded-lg hover:bg-red-700 font-bold">{editingStore ? 'Cập nhật' : 'Thêm mới'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}