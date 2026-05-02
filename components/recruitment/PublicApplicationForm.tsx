'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import api from '@/lib/api'
import Icon from '@/components/icons/Icon'
import { SearchableSelect } from '@/components/ui/select-searchable'
import { 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  User
} from 'lucide-react'


const REFERRERS = [
  'Nhân viên công ty',
  'Cộng tác viên',
  'Không có',
]

interface FormData {
  fullName: string
  gender: 'MALE' | 'FEMALE'
  phone: string
  dateOfBirth: string
  email: string
  cccd: string
  currentCity: string
  currentWard: string
  currentStreet: string
  permanentSameAsCurrent: boolean
  permanentCity: string
  permanentWard: string
  permanentStreet: string
  appliedPosition: string
  appliedPositionOther: string
  availableStartDate: string
  preferredLocations: string[]
  workExperience: string
  canWorkTet?: string
  referrer?: string
  referrerName?: string
}

interface Province {
  id: string
  name: string
  code: string
}

interface Ward {
  id: string
  name: string
  code: string
}

interface PositionOption {
  id: string
  name: string
}

export default function PublicApplicationForm() {
  const searchParams = useSearchParams()
  const campaignLink = searchParams.get('campaignId') || ''
  const legacyLink = searchParams.get('link') || searchParams.get('formId') || ''
  const sourceFromUrl = searchParams.get('source') || ''

  const [formInfo, setFormInfo] = useState<any>(null)
  const [campaignInfo, setCampaignInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [provinces, setProvinces] = useState<Province[]>([])
  const [currentWards, setCurrentWards] = useState<Ward[]>([])
  const [permanentWards, setPermanentWards] = useState<Ward[]>([])

  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    gender: 'MALE',
    phone: '',
    dateOfBirth: '',
    email: '',
    cccd: '',
    currentCity: '',
    currentWard: '',
    currentStreet: '',
    permanentSameAsCurrent: false,
    permanentCity: '',
    permanentWard: '',
    permanentStreet: '',
    appliedPosition: '',
    appliedPositionOther: '',
    availableStartDate: '',
    canWorkTet: 'Không',
    referrer: 'Không có',
    referrerName: '',
    preferredLocations: [],
    workExperience: '',
  })
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [stores, setStores] = useState<any[]>([])
  const [availableStores, setAvailableStores] = useState<any[]>([])
  const [storeSearch, setStoreSearch] = useState('')
  const [positions, setPositions] = useState<PositionOption[]>([])

  const filteredStores = storeSearch
    ? availableStores.filter(s => 
        s.name?.toLowerCase().includes(storeSearch.toLowerCase()) ||
        s.address?.toLowerCase().includes(storeSearch.toLowerCase())
      )
    : availableStores

  useEffect(() => {
    loadProvinces()
    loadPublicStores()
    loadPositions()
    if (campaignLink) {
      loadCampaignInfo()
    } else if (legacyLink) {
      loadFormInfo()
    } else {
      setError('Thiếu link chiến dịch tuyển dụng')
      setLoading(false)
    }
  }, [campaignLink, legacyLink])

  const loadPublicStores = async () => {
    try {
      const res = await api.get('/recruitment/public/stores')
      setStores(res.data || [])
      setAvailableStores(res.data || [])
    } catch (err) {
      console.error('Error loading stores:', err)
    }
  }

  const loadPositions = async () => {
    try {
      const res = await api.get('/recruitment/public/positions')
      setPositions(res.data || [])
    } catch (err) {
      console.error('Error loading positions:', err)
      setPositions([])
    }
  }

  const loadProvinces = async () => {
    try {
      const res = await api.get('/locations/provinces')
      setProvinces((res.data || []).map((p: any) => ({ ...p, name: p.fullName || p.name })))
    } catch (err) {
      console.error('Error loading provinces:', err)
    }
  }

  const loadAllLocations = async () => {
    // This function is unused - stores are loaded via loadPublicStores instead
  }

  const loadCurrentWards = async (provinceId: string) => {
    try {
      const res = await api.get(`/locations/provinces/${provinceId}/wards`)
      setCurrentWards((res.data || []).map((w: any) => ({ ...w, name: w.fullName || w.name })))
    } catch (err) {
      console.error('Error loading wards:', err)
      setCurrentWards([])
    }
  }

  // Filter stores whenever currentCity or stores change
  useEffect(() => {
    if (!formData.currentCity) {
      setAvailableStores([])
      return
    }

    const selectedProvince = provinces.find((p) => p.id === formData.currentCity)
    if (selectedProvince) {
      const filtered = stores.filter((s) => {
        return s.provinceCode === selectedProvince.code
      })
      setAvailableStores(filtered)
    } else {
      setAvailableStores(stores)
    }
  }, [formData.currentCity, stores, provinces])

  const loadPermanentWards = async (provinceId: string) => {
    try {
      const res = await api.get(`/locations/provinces/${provinceId}/wards`)
      setPermanentWards((res.data || []).map((w: any) => ({ ...w, name: w.fullName || w.name })))
    } catch (err) {
      console.error('Error loading wards:', err)
      setPermanentWards([])
    }
  }

  const loadCampaignInfo = async () => {
    try {
      const res = await api.get(`/recruitment/campaigns/link/${encodeURIComponent(campaignLink)}`)
      setCampaignInfo(res.data)
      setFormInfo(res.data.form)
    } catch (err: any) {
      console.error('Error loading campaign:', err)
      setError(err.response?.data?.message || 'Không tìm thấy chiến dịch tuyển dụng')
    } finally {
      setLoading(false)
    }
  }

  const loadFormInfo = async () => {
    try {
      const res = await api.get(`/recruitment/forms/link/${encodeURIComponent(legacyLink)}`)
      setFormInfo(res.data)
    } catch (err: any) {
      console.error('Error loading form:', err)
      setError(err.response?.data?.message || 'Không tìm thấy form tuyển dụng')
    } finally {
      setLoading(false)
    }
  }

  const normalizeCityName = (name: string) => {
    if (!name) return ''
    let normalized = name.toLowerCase().normalize('NFC')
      .replace(/tỉnh/g, '')
      .replace(/thành phố/g, '')
      .replace(/tp\./g, '')
      .replace(/tp/g, '')
      .replace(/-/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    
    // Handle common abbreviations
    if (normalized === 'hcm' || normalized === 'tphcm') return 'hồ chí minh'
    if (normalized === 'hn') return 'hà nội'
    
    return normalized
  }

  const formatPhone = (value: string) => {
    // Chỉ cho phép số
    const numbers = value.replace(/\D/g, '')
    // Giới hạn 10-11 số
    if (numbers.length > 11) return numbers.slice(0, 11)
    return numbers
  }

  const formatDateOfBirth = (value: string) => {
    // Chỉ cho phép số và dấu /
    let formatted = value.replace(/[^\d/]/g, '')
    // Tự động thêm dấu /
    if (formatted.length === 2 && !formatted.includes('/')) {
      formatted = formatted + '/'
    } else if (formatted.length === 5 && formatted.split('/').length === 2) {
      formatted = formatted + '/'
    }
    // Giới hạn độ dài
    if (formatted.length > 10) return formatted.slice(0, 10)
    return formatted
  }

  const formatAvailableStartDate = (value: string) => {
    // Chỉ cho phép số và dấu /
    let formatted = value.replace(/[^\d/]/g, '')
    // Tự động thêm dấu /
    if (formatted.length === 2 && !formatted.includes('/')) {
      formatted = formatted + '/'
    } else if (formatted.length === 5 && formatted.split('/').length === 2) {
      formatted = formatted + '/'
    }
    // Giới hạn độ dài
    if (formatted.length > 10) return formatted.slice(0, 10)
    return formatted
  }

  const formatCCCD = (value: string) => {
    // Chỉ cho phép số, giới hạn 12 số
    const numbers = value.replace(/\D/g, '')
    return numbers.slice(0, 12)
  }

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  const validatePhone = (phone: string) => {
    // Số điện thoại Việt Nam: 10-11 số, bắt đầu bằng 0
    const re = /^0\d{9,10}$/
    return re.test(phone)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!formData.fullName.trim()) {
      setError('Vui lòng nhập họ và tên')
      return
    }
    if (!formData.phone || !validatePhone(formData.phone)) {
      setError('Vui lòng nhập số điện thoại hợp lệ (10-11 số, bắt đầu bằng 0)')
      return
    }
    if (!formData.dateOfBirth) {
      setError('Vui lòng nhập ngày sinh')
      return
    }
    if (formData.email && !validateEmail(formData.email)) {
      setError('Vui lòng nhập email hợp lệ')
      return
    }
    if (!formData.cccd || formData.cccd.length !== 12) {
      setError('Vui lòng nhập CCCD (12 số)')
      return
    }
    if (!formData.currentCity || !formData.currentWard) {
      setError('Vui lòng điền đầy đủ địa chỉ nơi ở hiện tại')
      return
    }
    if (!formData.permanentSameAsCurrent) {
      if (!formData.permanentCity || !formData.permanentWard) {
        setError('Vui lòng điền đầy đủ địa chỉ thường trú')
        return
      }
    }
    if (!formData.appliedPosition) {
      setError('Vui lòng chọn vị trí ứng tuyển')
      return
    }
    if (formData.appliedPosition === 'Other' && !formData.appliedPositionOther.trim()) {
      setError('Vui lòng nhập tên vị trí ứng tuyển')
      return
    }
    const [startDay, startMonth, startYear] = formData.availableStartDate.split('/')
    if (!startDay || !startMonth || !startYear || startYear.length !== 4) {
      setError('Ngày bắt đầu công việc không hợp lệ (DD/MM/YYYY)')
      return
    }
    const startDate = new Date(parseInt(startYear), parseInt(startMonth) - 1, parseInt(startDay))
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (startDate <= today) {
      setError('Ngày bắt đầu công việc phải lớn hơn ngày hiện tại')
      return
    }

    if (!formData.canWorkTet) {
      setError('Vui lòng chọn có thể làm việc Tết hay không')
      return
    }
    if (!formData.referrer) {
      setError('Vui lòng chọn người giới thiệu')
      return
    }
    if ((formData.referrer === 'Nhân viên công ty' || formData.referrer === 'Cộng tác viên') && !formData.referrerName?.trim()) {
      setError('Vui lòng nhập tên người giới thiệu')
      return
    }
    if (formData.preferredLocations.length === 0) {
      setError('Vui lòng chọn ít nhất một địa điểm mong muốn làm việc')
      return
    }

    setSubmitting(true)
    try {
      // Convert dateOfBirth from DD/MM/YYYY or YYYY-MM-DD to YYYY-MM-DD
      let dateOfBirthISO: string
      if (formData.dateOfBirth.includes('/')) {
        const [day, month, year] = formData.dateOfBirth.split('/')
        dateOfBirthISO = `${year}-${month}-${day}`
      } else {
        // Already YYYY-MM-DD from input type="date"
        dateOfBirthISO = formData.dateOfBirth
      }

      // Convert city and ward IDs to names
      const selectedProvince = provinces.find(p => p.id === formData.currentCity)
      const cityName = selectedProvince?.name || formData.currentCity
      
      const selectedWard = currentWards.find(w => w.id === formData.currentWard)
      const wardName = selectedWard?.name || formData.currentWard

      const selectedPermProvince = provinces.find(p => p.id === formData.permanentCity)
      const permCityName = selectedPermProvince?.name || formData.permanentCity

      const selectedPermWard = permanentWards.find(w => w.id === formData.permanentWard)
      const permWardName = selectedPermWard?.name || formData.permanentWard

      // Convert availableStartDate from DD/MM/YYYY to YYYY-MM-DD
      const [sDay, sMonth, sYear] = formData.availableStartDate.split('/')
      const availableStartDateISO = `${sYear}-${sMonth}-${sDay}`

      await api.post('/recruitment/apply', {
        ...formData,
        currentCity: cityName,
        currentWard: wardName,
        permanentCity: permCityName,
        permanentWard: permWardName,
        appliedPosition:
          formData.appliedPosition === 'Other'
            ? formData.appliedPositionOther
            : formData.appliedPosition,
        dateOfBirth: dateOfBirthISO,
        availableStartDate: availableStartDateISO,
        formId: formInfo?.id || '',
        campaignId: campaignInfo?.id || undefined,
        sourceCode: sourceFromUrl || undefined,
      })

      setSuccess(true)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi gửi đơn ứng tuyển')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-lg text-gray-600">Đang tải form...</div>
        </div>
      </div>
    )
  }

  if (error && !formInfo && (campaignLink || legacyLink)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-red-600 text-lg mb-4">{error}</div>
          <p className="text-gray-600 text-sm">
            Vui lòng kiểm tra lại link chiến dịch tuyển dụng hoặc liên hệ với người quản lý.
          </p>
        </div>
      </div>
    )
  }

  // Nếu không có link, hiển thị form mặc định (để test)
  if (!campaignLink && !legacyLink) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-slate-600 text-lg mb-4">Thiếu thông tin chiến dịch</div>
          <p className="text-gray-600 text-sm">
            Vui lòng truy cập form qua link chiến dịch được cung cấp.
          </p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Icon name="check" size={32} className="text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Gửi đơn thành công!</h2>
          <p className="text-gray-600">
            Cảm ơn bạn đã ứng tuyển. Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất.
          </p>
        </div>
      </div>
    )
  }

  // Real-time validation functions
  const validateField = (name: string, value: any) => {
    const errors: Record<string, string> = {}
    
    switch (name) {
      case 'fullName':
        if (!value || !value.trim()) {
          errors.fullName = 'Vui lòng nhập họ và tên'
        } else if (value.trim().length < 2) {
          errors.fullName = 'Họ và tên phải có ít nhất 2 ký tự'
        } else if (value.trim().length > 100) {
          errors.fullName = 'Họ và tên không được vượt quá 100 ký tự'
        }
        break
      case 'phone':
        if (!value) {
          errors.phone = 'Vui lòng nhập số điện thoại'
        } else if (!validatePhone(value)) {
          errors.phone = 'Số điện thoại không hợp lệ (10-11 số, bắt đầu bằng 0)'
        }
        break
      case 'email':
        if (value && !validateEmail(value)) {
          errors.email = 'Email không hợp lệ'
        }
        break
      case 'cccd':
        if (!value) {
          errors.cccd = 'Vui lòng nhập CCCD'
        } else if (value.length !== 12) {
          errors.cccd = 'CCCD phải có đúng 12 số'
        } else if (!/^\d+$/.test(value)) {
          errors.cccd = 'CCCD chỉ được chứa số'
        }
        break
      case 'dateOfBirth':
        if (!value) {
          errors.dateOfBirth = 'Vui lòng nhập ngày sinh'
        } else if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value) && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          errors.dateOfBirth = 'Ngày sinh phải có định dạng DD/MM/YYYY hoặc YYYY-MM-DD'
        } else {
          let day: number, month: number, year: number
          if (value.includes('/')) {
            [day, month, year] = value.split('/').map(Number)
          } else {
            [year, month, day] = value.split('-').map(Number)
          }
          const birthDate = new Date(year, month - 1, day)
          const today = new Date()
          const age = today.getFullYear() - year
          if (birthDate > today || age < 16) {
            errors.dateOfBirth = 'Bạn phải từ 16 tuổi trở lên'
          } else if (age > 100) {
            errors.dateOfBirth = 'Ngày sinh không hợp lệ'
          }
        }
        break
      case 'currentCity':
        if (!value) {
          errors.currentCity = 'Vui lòng chọn tỉnh/thành phố'
        }
        break
      case 'currentWard':
        if (!value) {
          errors.currentWard = 'Vui lòng chọn phường/xã'
        }
        break
      case 'currentStreet':
        if (!value || !value.trim()) {
          errors.currentStreet = 'Vui lòng nhập số nhà, tên đường'
        } else if (value.trim().length < 5) {
          errors.currentStreet = 'Địa chỉ phải có ít nhất 5 ký tự'
        }
        break
      case 'permanentCity':
        if (!formData.permanentSameAsCurrent && !value) {
          errors.permanentCity = 'Vui lòng chọn tỉnh/thành phố'
        }
        break
      case 'permanentWard':
        if (!formData.permanentSameAsCurrent && !value) {
          errors.permanentWard = 'Vui lòng chọn phường/xã'
        }
        break
      case 'permanentStreet':
        if (!formData.permanentSameAsCurrent && (!value || !value.trim())) {
          errors.permanentStreet = 'Vui lòng nhập số nhà, tên đường'
        } else if (!formData.permanentSameAsCurrent && value.trim().length < 5) {
          errors.permanentStreet = 'Địa chỉ phải có ít nhất 5 ký tự'
        }
        break
      case 'appliedPosition':
        if (!value) {
          errors.appliedPosition = 'Vui lòng chọn vị trí ứng tuyển'
        }
        break
      case 'appliedPositionOther':
        if (formData.appliedPosition === 'Other' && (!value || !value.trim())) {
          errors.appliedPositionOther = 'Vui lòng nhập tên vị trí ứng tuyển'
        } else if (formData.appliedPosition === 'Other' && value.trim().length < 3) {
          errors.appliedPositionOther = 'Tên vị trí phải có ít nhất 3 ký tự'
        }
        break
      case 'availableStartDate':
        if (!value) {
          errors.availableStartDate = 'Vui lòng nhập ngày có thể bắt đầu công việc'
        } else if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
          errors.availableStartDate = 'Ngày bắt đầu phải có định dạng DD/MM/YYYY'
        } else {
          const [day, month, year] = value.split('/').map(Number)
          const startDate = new Date(year, month - 1, day)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          if (startDate <= today) {
            errors.availableStartDate = 'Ngày bắt đầu công việc phải lớn hơn ngày hiện tại'
          }
        }
        break
      case 'canWorkTet':
        if (!value) {
          errors.canWorkTet = 'Vui lòng chọn có thể làm việc Tết hay không'
        }
        break
      case 'referrer':
        if (!value) {
          errors.referrer = 'Vui lòng chọn người giới thiệu'
        }
        break
      case 'referrerName':
        if ((formData.referrer === 'Nhân viên công ty' || formData.referrer === 'Cộng tác viên') && (!value || !value.trim())) {
          errors.referrerName = 'Vui lòng nhập tên người giới thiệu'
        } else if ((formData.referrer === 'Nhân viên công ty' || formData.referrer === 'Cộng tác viên') && value.trim().length < 2) {
          errors.referrerName = 'Tên người giới thiệu phải có ít nhất 2 ký tự'
        }
        break
      case 'preferredLocations':
        if (!value || value.length === 0) {
          errors.preferredLocations = 'Vui lòng chọn ít nhất một địa điểm mong muốn làm việc'
        }
        break
      case 'workExperience':
        if (value && value.trim().length > 1000) {
          errors.workExperience = 'Kinh nghiệm làm việc không được vượt quá 1000 ký tự'
        }
        break
    }
    
    setValidationErrors((prev) => {
      const newErrors = { ...prev }
      if (errors[name]) {
        newErrors[name] = errors[name]
      } else {
        delete newErrors[name]
      }
      return newErrors
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Banner */}
          {formInfo?.bannerUrl && (
            <div className="mb-6">
              <img
                src={formInfo.bannerUrl}
                alt="Banner"
                className="w-full h-auto max-h-64 object-contain rounded-lg bg-gray-50"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
          )}
          
          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {formInfo?.formTitle || formInfo?.title || 'Đơn ứng tuyển'}
          </h1>
          
          {/* Content */}
          {formInfo?.formContent && (
            <div
              className="text-gray-600 mb-6 prose prose-sm max-w-none whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: formInfo.formContent }}
            />
          )}
          {!formInfo?.formContent && formInfo?.description && (
            <p className="text-gray-600 mb-6 whitespace-pre-wrap">{formInfo.description}</p>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Thông tin cá nhân */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Thông tin cá nhân</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => {
                      const value = e.target.value
                      setFormData({ ...formData, fullName: value })
                      validateField('fullName', value)
                    }}
                    onBlur={() => validateField('fullName', formData.fullName)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      validationErrors.fullName
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-yellow-500'
                    }`}
                    required
                  />
                  {validationErrors.fullName && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.fullName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giới tính <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'MALE' | 'FEMALE' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    required
                  >
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => {
                      const value = formatPhone(e.target.value)
                      setFormData({ ...formData, phone: value })
                      validateField('phone', value)
                    }}
                    onBlur={() => validateField('phone', formData.phone)}
                    placeholder="0123456789"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      validationErrors.phone
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-yellow-500'
                    }`}
                    required
                  />
                  {validationErrors.phone && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày sinh <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.dateOfBirth}
                    onChange={(e) => {
                      const value = formatDateOfBirth(e.target.value)
                      setFormData({ ...formData, dateOfBirth: value })
                      validateField('dateOfBirth', value)
                    }}
                    onBlur={() => validateField('dateOfBirth', formData.dateOfBirth)}
                    placeholder="DD/MM/YYYY"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      validationErrors.dateOfBirth
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-yellow-500'
                    }`}
                    required
                  />
                  {validationErrors.dateOfBirth && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.dateOfBirth}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      const value = e.target.value
                      setFormData({ ...formData, email: value })
                      validateField('email', value)
                    }}
                    onBlur={() => validateField('email', formData.email)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      validationErrors.email
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-yellow-500'
                    }`}
                  />
                  {validationErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CCCD <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.cccd}
                    onChange={(e) => {
                      const value = formatCCCD(e.target.value)
                      setFormData({ ...formData, cccd: value })
                      validateField('cccd', value)
                    }}
                    onBlur={() => validateField('cccd', formData.cccd)}
                    placeholder="12 số"
                    maxLength={12}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      validationErrors.cccd
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-yellow-500'
                    }`}
                    required
                  />
                  {validationErrors.cccd && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.cccd}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Nơi ở hiện tại */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Nơi ở hiện tại</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thành phố/Tỉnh <span className="text-red-500">*</span>
                  </label>
                  <SearchableSelect
                    options={provinces}
                    value={formData.currentCity}
                    onChange={(value) => {
                      setFormData({ ...formData, currentCity: value, currentWard: '' })
                      loadCurrentWards(value)
                      validateField('currentCity', value)
                    }}
                    placeholder="Chọn tỉnh/thành phố"
                    error={validationErrors.currentCity}
                  />
                  {validationErrors.currentCity && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.currentCity}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phường/Xã <span className="text-red-500">*</span>
                  </label>
                  <SearchableSelect
                    options={currentWards}
                    value={formData.currentWard}
                    onChange={(value) => {
                      setFormData({ ...formData, currentWard: value })
                      validateField('currentWard', value)
                    }}
                    placeholder="Chọn phường/xã"
                    error={validationErrors.currentWard}
                    disabled={!formData.currentCity}
                  />
                  {validationErrors.currentWard && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.currentWard}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số nhà, tên đường <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.currentStreet}
                    onChange={(e) => {
                      const value = e.target.value
                      setFormData({ ...formData, currentStreet: value })
                      validateField('currentStreet', value)
                    }}
                    onBlur={() => validateField('currentStreet', formData.currentStreet)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      validationErrors.currentStreet
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-yellow-500'
                    }`}
                    required
                  />
                  {validationErrors.currentStreet && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.currentStreet}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Địa chỉ thường trú */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Địa chỉ thường trú</h2>
              
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.permanentSameAsCurrent}
                    onChange={(e) => {
                      const checked = e.target.checked
                      setFormData({ ...formData, permanentSameAsCurrent: checked })
                      // Clear validation errors for permanent address fields when checked
                      if (checked) {
                        setValidationErrors((prev) => {
                          const newErrors = { ...prev }
                          delete newErrors.permanentCity
                          delete newErrors.permanentDistrict
                          delete newErrors.permanentWard
                          delete newErrors.permanentStreet
                          return newErrors
                        })
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Địa chỉ thường trú giống nơi ở hiện tại</span>
                </label>
              </div>

              {!formData.permanentSameAsCurrent && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Thành phố/Tỉnh <span className="text-red-500">*</span>
                    </label>
                    <SearchableSelect
                      options={provinces}
                      value={formData.permanentCity}
                      onChange={(value) => {
                        setFormData({ ...formData, permanentCity: value, permanentWard: '' })
                        loadPermanentWards(value)
                        validateField('permanentCity', value)
                      }}
                      placeholder="Chọn tỉnh/thành phố"
                      error={validationErrors.permanentCity}
                    />
                    {validationErrors.permanentCity && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.permanentCity}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phường/Xã <span className="text-red-500">*</span>
                    </label>
                    <SearchableSelect
                      options={permanentWards}
                      value={formData.permanentWard}
                      onChange={(value) => {
                        setFormData({ ...formData, permanentWard: value })
                        validateField('permanentWard', value)
                      }}
                      placeholder="Chọn phường/xã"
                      error={validationErrors.permanentWard}
                      disabled={!formData.permanentCity}
                    />
                    {validationErrors.permanentWard && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.permanentWard}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số nhà, tên đường <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.permanentStreet}
                      onChange={(e) => {
                        const value = e.target.value
                        setFormData({ ...formData, permanentStreet: value })
                        validateField('permanentStreet', value)
                      }}
                      onBlur={() => validateField('permanentStreet', formData.permanentStreet)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                        validationErrors.permanentStreet
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-yellow-500'
                      }`}
                      required
                    />
                    {validationErrors.permanentStreet && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.permanentStreet}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Vị trí ứng tuyển */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Thông tin ứng tuyển</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vị trí ứng tuyển <span className="text-red-500">*</span>
                  </label>
                  <SearchableSelect
                    options={(
                      positions && positions.length > 0
                        ? positions.map(p => ({ id: p.name, name: p.name }))
                        : []
                    ).concat([{ id: 'Other', name: 'Khác' }])}
                    value={formData.appliedPosition}
                    onChange={(value) => {
                      setFormData({ ...formData, appliedPosition: value, appliedPositionOther: '' })
                      validateField('appliedPosition', value)
                    }}
                    placeholder="Chọn vị trí"
                    error={validationErrors.appliedPosition}
                  />
                  {validationErrors.appliedPosition && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.appliedPosition}</p>
                  )}
                </div>

                {formData.appliedPosition === 'Other' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tên vị trí ứng tuyển <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.appliedPositionOther}
                      onChange={(e) => {
                        const value = e.target.value
                        setFormData({ ...formData, appliedPositionOther: value })
                        validateField('appliedPositionOther', value)
                      }}
                      onBlur={() => validateField('appliedPositionOther', formData.appliedPositionOther)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                        validationErrors.appliedPositionOther
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-yellow-500'
                      }`}
                      required
                    />
                    {validationErrors.appliedPositionOther && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.appliedPositionOther}</p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày có thể bắt đầu công việc <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.availableStartDate}
                    onChange={(e) => {
                      const value = formatAvailableStartDate(e.target.value)
                      setFormData({ ...formData, availableStartDate: value })
                      validateField('availableStartDate', value)
                    }}
                    onBlur={() => validateField('availableStartDate', formData.availableStartDate)}
                    placeholder="DD/MM/YYYY"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      validationErrors.availableStartDate
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-yellow-500'
                    }`}
                    required
                  />
                  {validationErrors.availableStartDate && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.availableStartDate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bạn có thể làm việc Tết không? <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.canWorkTet}
                    onChange={(e) => {
                      const value = e.target.value as 'Có' | 'Không'
                      setFormData({ ...formData, canWorkTet: value })
                      validateField('canWorkTet', value)
                    }}
                    onBlur={() => validateField('canWorkTet', formData.canWorkTet)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      validationErrors.canWorkTet
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-yellow-500'
                    }`}
                    required
                  >
                    <option value="Không">Không</option>
                    <option value="Có">Có</option>
                  </select>
                  {validationErrors.canWorkTet && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.canWorkTet}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Người giới thiệu <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.referrer}
                    onChange={(e) => {
                      const value = e.target.value
                      setFormData({ ...formData, referrer: value, referrerName: '' })
                      validateField('referrer', value)
                    }}
                    onBlur={() => validateField('referrer', formData.referrer)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      validationErrors.referrer
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-yellow-500'
                    }`}
                    required
                  >
                    {REFERRERS.map((ref) => (
                      <option key={ref} value={ref}>
                        {ref}
                      </option>
                    ))}
                  </select>
                  {validationErrors.referrer && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.referrer}</p>
                  )}
                </div>

                {(formData.referrer === 'Nhân viên công ty' || formData.referrer === 'Cộng tác viên') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tên người giới thiệu <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.referrerName}
                      onChange={(e) => {
                        const value = e.target.value
                        setFormData({ ...formData, referrerName: value })
                        validateField('referrerName', value)
                      }}
                      onBlur={() => validateField('referrerName', formData.referrerName)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                        validationErrors.referrerName
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-yellow-500'
                      }`}
                      required
                    />
                    {validationErrors.referrerName && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.referrerName}</p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Địa điểm mong muốn làm việc <span className="text-red-500">*</span>
                  </label>
                  <div className="mb-2">
                    <input
                      type="text"
                      placeholder="Tìm kiếm cửa hàng..."
                      value={storeSearch}
                      onChange={(e) => setStoreSearch(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                  </div>
                  <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto border rounded-md p-3 ${
                    validationErrors.preferredLocations
                      ? 'border-red-500'
                      : 'border-gray-300'
                  }`}>
                    {filteredStores.length > 0 ? (
                      filteredStores.map((store) => (
                        <label key={store.id} className="flex items-start space-x-2 p-2 hover:bg-gray-50 rounded-md cursor-pointer border border-transparent hover:border-gray-200 transition-colors">
                          <input
                            type="checkbox"
                            checked={formData.preferredLocations.includes(store.id)}
                            onChange={(e) => {
                              let newLocations: string[]
                              if (e.target.checked) {
                                newLocations = [...formData.preferredLocations, store.id]
                              } else {
                                newLocations = formData.preferredLocations.filter((loc) => loc !== store.id)
                              }
                              setFormData({
                                ...formData,
                                preferredLocations: newLocations,
                              })
                              validateField('preferredLocations', newLocations)
                            }}
                            className="mt-1 h-4 w-4 text-slate-600 border-gray-300 rounded focus:ring-yellow-500"
                          />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900">{store.name}</span>
                            <span className="text-xs text-gray-500">{store.address}</span>
                          </div>
                        </label>
                      ))
                    ) : (
                      <div className="col-span-full py-4 text-center text-gray-500 text-sm italic">
                        {formData.currentCity ? 'Không tìm thấy cửa hàng KFC tại khu vực này.' : 'Vui lòng chọn Tỉnh/Thành phố để xem các cửa hàng gần bạn.'}
                      </div>
                    )}
                  </div>
                  {validationErrors.preferredLocations && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.preferredLocations}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kinh nghiệm làm việc trước đó
                  </label>
                  <textarea
                    value={formData.workExperience}
                    onChange={(e) => {
                      const value = e.target.value
                      setFormData({ ...formData, workExperience: value })
                      validateField('workExperience', value)
                    }}
                    onBlur={() => validateField('workExperience', formData.workExperience)}
                    rows={4}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      validationErrors.workExperience
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-yellow-500'
                    }`}
                    placeholder="Mô tả kinh nghiệm làm việc của bạn..."
                  />
                  {validationErrors.workExperience && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.workExperience}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Đang gửi...' : 'Gửi đơn ứng tuyển'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

