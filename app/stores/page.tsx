'use client'

import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import api from '@/lib/api'
import Icon from '@/components/icons/Icon'
import Layout from '@/components/Layout'

interface PersonRef {
  id: string
  fullName: string
  email: string
}

interface Store {
  id: string
  name: string
  code: string
  address?: string
  phone?: string
  district?: string
  city?: string
  amName?: string | null
  am?: string | PersonRef | null
  omName?: string | null
  om?: string | PersonRef | null
  odName?: string | null
  od?: string | PersonRef | null
  zone?: string
  area?: string
  icName?: string | null
  taIncharge?: string | PersonRef | null
  group?: string | null
  isActive: boolean
}

interface FormErrors {
  name?: string
  code?: string
}

interface ImportSummary {
  fileName: string
  successCount: number
  errorCount: number
}

const normalizeStoreGroup = (group?: string | null) => {
  if (!group) return ''

  const normalized = group
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_')

  if (normalized === 'OPS_SOUTH') return 'OPS_SOUTH'
  if (normalized === 'OPS_NORTH') return 'OPS_NORTH'

  return normalized
}

const getGroupBadge = (group?: string | null) => {
  const normalizedGroup = normalizeStoreGroup(group)

  if (!normalizedGroup) return '-'
  if (normalizedGroup === 'OPS_SOUTH') return <span className="px-2 py-1 bg-orange-50 text-orange-700 rounded text-xs">South</span>
  if (normalizedGroup === 'OPS_NORTH') return <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs">North</span>

  return group
}

export default function StoresManagementPage() {
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingStore, setEditingStore] = useState<Store | null>(null)
  const [storeToDelete, setStoreToDelete] = useState<Store | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterGroup, setFilterGroup] = useState('')
  const [importing, setImporting] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null)
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

  const getPersonDisplayName = (person?: string | PersonRef | null) => {
    if (!person) return ''
    if (typeof person === 'object' && 'fullName' in person) return person.fullName || person.email || ''
    return person
  }

  const resetFormData = () => {
    setFormData({
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
    setFormErrors({})
  }

  const closeStoreModal = () => {
    setShowCreateModal(false)
    setEditingStore(null)
    resetFormData()
  }

  const normalizeStoreResponse = (store: Store): Store => ({
    ...store,
    am: store.am ?? store.amName ?? '',
    om: store.om ?? store.omName ?? '',
    od: store.od ?? store.odName ?? '',
    taIncharge: store.taIncharge ?? store.icName ?? '',
  })

  const loadStores = async (showRefreshToast = false) => {
    if (showRefreshToast) setRefreshing(true)

    try {
      const res = await api.get('/stores')
      setStores((res.data || []).map((store: Store) => normalizeStoreResponse(store)))
      if (showRefreshToast) toast.success('Đã tải lại danh sách cửa hàng')
    } catch (err) {
      console.error('Error loading stores:', err)
      toast.error('Không thể tải danh sách cửa hàng')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const validateForm = () => {
    const errors: FormErrors = {}

    if (!formData.name.trim()) errors.name = 'Tên cửa hàng là bắt buộc'
    if (!formData.code.trim()) errors.code = 'Mã cửa hàng là bắt buộc'

    setFormErrors(errors)

    if (Object.keys(errors).length > 0) {
      toast.error('Vui lòng nhập đầy đủ các trường bắt buộc')
    }

    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setSubmitting(true)
    try {
      const payload = { ...formData, isActive: true }

      if (editingStore) {
        await api.patch(`/stores/${editingStore.id}`, payload)
        toast.success(`Đã cập nhật cửa hàng ${formData.code}`)
      } else {
        await api.post('/stores', payload)
        toast.success(`Đã tạo cửa hàng ${formData.code}`)
      }

      closeStoreModal()
      loadStores()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setSubmitting(false)
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
      am: getPersonDisplayName(store.am),
      om: getPersonDisplayName(store.om),
      od: getPersonDisplayName(store.od),
      zone: store.zone || '',
      area: store.area || '',
      taIncharge: getPersonDisplayName(store.taIncharge),
      group: store.group || '',
    })
    setShowCreateModal(true)
  }

  const confirmDeleteStore = async () => {
    if (!storeToDelete) return

    setDeleting(true)
    try {
      await api.delete(`/stores/${storeToDelete.id}`)
      toast.success(`Đã xóa cửa hàng ${storeToDelete.code}`)
      setStoreToDelete(null)
      loadStores()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setDeleting(false)
    }
  }

  const filteredStores = stores
    .filter(
      (s) =>
        (s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.code.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (filterGroup === '' || normalizeStoreGroup(s.group) === filterGroup)
    )
    .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true, sensitivity: 'base' }))

  const handleExport = () => {
    try {
      const headers = ['Mã', 'Tên cửa hàng', 'Địa chỉ', 'Quận/Huyện', 'Thành phố', 'AM', 'OM', 'OD', 'Zone', 'Area', 'TA IC', 'Group']
      const data = filteredStores.map((s) => [
        s.code,
        s.name,
        s.address || '',
        s.district || '',
        s.city || '',
        getPersonDisplayName(s.am),
        getPersonDisplayName(s.om),
        getPersonDisplayName(s.od),
        s.zone || '',
        s.area || '',
        getPersonDisplayName(s.taIncharge),
        s.group || '',
      ])

      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data])
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Stores')

      const maxWidth = data.reduce((w, r) => Math.max(w, (r[1] as string)?.length || 10), 20)
      worksheet['!cols'] = [
        { wch: 10 },
        { wch: maxWidth },
        { wch: 30 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 10 },
        { wch: 10 },
        { wch: 15 },
        { wch: 15 },
      ]

      XLSX.writeFile(workbook, `stores_${new Date().toISOString().split('T')[0]}.xlsx`)
      toast.success(`Đã export ${filteredStores.length} cửa hàng`)
    } catch (err) {
      console.error('Export error:', err)
      toast.error('Không thể export file Excel')
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    setImportSummary(null)

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const bstr = event.target?.result
        const workbook = XLSX.read(bstr, { type: 'binary' })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        const dataRows = XLSX.utils.sheet_to_json(worksheet) as any[]

        let successCount = 0
        let errorCount = 0

        for (const row of dataRows) {
          const code = row['Mã'] || row['MÃ£'] || row['code'] || row['Code']
          const name = row['Tên cửa hàng'] || row['TÃªn cá»­a hÃ ng'] || row['name'] || row['Store Name']

          if (!code || !name) {
            errorCount++
            continue
          }

          try {
            await api.post('/stores/import', {
              code: String(code).trim(),
              name: String(name).trim(),
              address: row['Địa chỉ'] || row['Äá»‹a chá»‰'] || row['address'] || '',
              district: row['Quận/Huyện'] || row['Quáº­n/Huyá»‡n'] || row['district'] || '',
              city: row['Thành phố'] || row['ThÃ nh phá»‘'] || row['city'] || '',
              am: row['AM'] || row['am'] || '',
              om: row['OM'] || row['om'] || '',
              od: row['OD'] || row['od'] || '',
              zone: row['Zone'] || row['zone'] || '',
              area: row['Area'] || row['area'] || '',
              taIncharge: row['TA IC'] || row['ta_incharge'] || '',
              group: row['Group'] || row['group'] || '',
            })
            successCount++
          } catch {
            errorCount++
          }
        }

        setImportSummary({
          fileName: file.name,
          successCount,
          errorCount,
        })

        if (successCount > 0) {
          toast.success(`Import thành công ${successCount} cửa hàng`)
        } else {
          toast.error('Không có dòng nào import thành công')
        }

        loadStores()
      } catch (err) {
        console.error('Import error:', err)
        toast.error('Lỗi khi đọc file Excel')
      } finally {
        setImporting(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    }

    reader.readAsBinaryString(file)
  }

  const totalStores = stores.length
  const activeStores = stores.filter((s) => s.isActive).length
  const opsSouthCount = stores.filter((s) => normalizeStoreGroup(s.group) === 'OPS_SOUTH').length
  const opsNorthCount = stores.filter((s) => normalizeStoreGroup(s.group) === 'OPS_NORTH').length

  return (
    <Layout>
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kfc-red"></div>
          <span className="ml-3 text-gray-600">Đang tải dữ liệu cửa hàng...</span>
        </div>
      ) : (
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
              <button
                onClick={() => {
                  setEditingStore(null)
                  resetFormData()
                  setShowCreateModal(true)
                }}
                className="flex items-center gap-2 px-4 py-2 bg-kfc-red text-white rounded-md hover:bg-red-700 text-sm font-medium"
              >
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
              <input
                type="text"
                placeholder="Tìm theo mã hoặc tên cửa hàng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-kfc-red focus:border-kfc-red outline-none sm:text-sm"
              />
            </div>
            <select value={filterGroup} onChange={(e) => setFilterGroup(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md sm:text-sm">
              <option value="">Tất cả vùng miền</option>
              <option value="OPS_SOUTH">OPS-South</option>
              <option value="OPS_NORTH">OPS-North</option>
            </select>
            <button onClick={() => loadStores(true)} disabled={refreshing} className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-60" title="Tải lại">
              <Icon name="refresh" size={18} />
            </button>
          </div>

          <div className="bg-white shadow rounded-lg border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase w-48 min-w-[8rem] sticky left-0 bg-gray-50 z-10">Mã</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase border-l">Tên cửa hàng</th>
                    <th className="px-3 py-4 text-left text-xs font-bold text-gray-500 uppercase border-l">AM</th>
                    <th className="px-3 py-4 text-left text-xs font-bold text-gray-500 uppercase">OM</th>
                    <th className="px-3 py-4 text-left text-xs font-bold text-gray-500 uppercase">OD</th>
                    <th className="px-3 py-4 text-left text-xs font-bold text-gray-500 uppercase border-l">Thành phố</th>
                    <th className="px-3 py-4 text-left text-xs font-bold text-gray-500 uppercase">Quận/Huyện</th>
                    <th className="px-3 py-4 text-left text-xs font-bold text-gray-500 uppercase border-l">Vùng miền</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase border-l w-24">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredStores.length === 0 ? (
                    <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-400"><Icon name="store" size={48} className="mb-2 opacity-20" /><p>Không tìm thấy cửa hàng nào</p></td></tr>
                  ) : (
                    filteredStores.map((store) => (
                      <tr key={store.id} className="hover:bg-gray-50 group">
                        <td className="px-4 py-3 text-sm font-bold text-kfc-red sticky left-0 bg-white group-hover:bg-gray-50 z-10 min-w-[8rem]">{store.code}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 border-l font-medium">
                          {store.name}
                          {store.isActive === false && <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px] font-bold">INACTIVE</span>}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-600 border-l">{getPersonDisplayName(store.am) || '-'}</td>
                        <td className="px-3 py-3 text-sm text-gray-600">{getPersonDisplayName(store.om) || '-'}</td>
                        <td className="px-3 py-3 text-sm text-gray-600">{getPersonDisplayName(store.od) || '-'}</td>
                        <td className="px-3 py-3 text-sm text-gray-600 border-l">{store.city || '-'}</td>
                        <td className="px-3 py-3 text-sm text-gray-600">{store.district || '-'}</td>
                        <td className="px-3 py-3 text-sm text-gray-600 border-l">{getGroupBadge(store.group)}</td>
                        <td className="px-4 py-3 text-sm text-right space-x-3 border-l">
                          <button onClick={() => handleEdit(store)} className="text-gray-400 hover:text-blue-600 p-1 hover:bg-blue-50 rounded" title="Chỉnh sửa"><Icon name="pencil" size={16} /></button>
                          <button onClick={() => setStoreToDelete(store)} className="text-gray-400 hover:text-kfc-red p-1 hover:bg-red-50 rounded" title="Xóa"><Icon name="trash" size={16} /></button>
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
                  <button onClick={closeStoreModal} className="p-2 hover:bg-gray-100 rounded-full"><Icon name="x" size={20} /></button>
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
                    <button type="button" onClick={closeStoreModal} className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50">Hủy bỏ</button>
                    <button type="submit" disabled={submitting} className="px-8 py-2.5 bg-kfc-red text-white rounded-lg hover:bg-red-700 font-bold disabled:opacity-60">
                      {submitting ? 'Đang xử lý...' : editingStore ? 'Cập nhật' : 'Thêm mới'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {storeToDelete && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
                <div className="px-6 py-4 border-b flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">Xác nhận xóa cửa hàng</h3>
                  <button onClick={() => setStoreToDelete(null)} className="p-2 hover:bg-gray-100 rounded-full">
                    <Icon name="x" size={18} />
                  </button>
                </div>
                <div className="px-6 py-5">
                  <p className="text-sm text-gray-600">
                    Bạn có chắc muốn xóa cửa hàng <span className="font-semibold text-gray-900">{storeToDelete.code}</span> - <span className="font-semibold text-gray-900">{storeToDelete.name}</span>?
                  </p>
                  <p className="mt-2 text-xs text-gray-500">Thao tác này sẽ ẩn cửa hàng khỏi danh sách đang hoạt động.</p>
                </div>
                <div className="px-6 py-4 border-t flex justify-end gap-3">
                  <button type="button" onClick={() => setStoreToDelete(null)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                    Hủy
                  </button>
                  <button type="button" onClick={confirmDeleteStore} disabled={deleting} className="px-4 py-2 bg-kfc-red text-white rounded-lg hover:bg-red-700 disabled:opacity-60">
                    {deleting ? 'Đang xóa...' : 'Xóa cửa hàng'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {importSummary && (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
                <div className="px-6 py-4 border-b flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">Kết quả import</h3>
                  <button onClick={() => setImportSummary(null)} className="p-2 hover:bg-gray-100 rounded-full">
                    <Icon name="x" size={18} />
                  </button>
                </div>
                <div className="px-6 py-5 space-y-3">
                  <p className="text-sm text-gray-600">File: <span className="font-medium text-gray-900">{importSummary.fileName}</span></p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-green-50 px-4 py-3">
                      <div className="text-xs uppercase font-semibold text-green-700">Thành công</div>
                      <div className="mt-1 text-2xl font-bold text-green-800">{importSummary.successCount}</div>
                    </div>
                    <div className="rounded-lg bg-red-50 px-4 py-3">
                      <div className="text-xs uppercase font-semibold text-red-700">Lỗi</div>
                      <div className="mt-1 text-2xl font-bold text-red-800">{importSummary.errorCount}</div>
                    </div>
                  </div>
                </div>
                <div className="px-6 py-4 border-t flex justify-end">
                  <button type="button" onClick={() => setImportSummary(null)} className="px-4 py-2 bg-kfc-red text-white rounded-lg hover:bg-red-700">
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Layout>
  )
}
