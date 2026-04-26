'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import api from '@/lib/api'
import { Filter, Calendar, X } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Calendar as CalendarPicker } from '@/components/ui/calendar'
import Icon from '@/components/icons/Icon'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

interface DashboardData {
  totalCandidates: number
  newCandidatesThisMonth: number
  newCandidatesLastMonth: number
  activeCampaigns: number
  totalCampaigns: number
  totalForms: number
  candidatesByStatus: Array<{
    statusId: string
    statusCode: string
    statusName: string
    statusColor: string | null
    count: number
  }>
  candidatesByCampaign: Array<{
    campaignId: string
    campaignName: string
    formName: string
    count: number
  }>
  monthlyData: Array<{
    month: string
    count: number
  }>
  candidatesByStore: Array<{
    storeId: string
    storeName: string
    storeCode: string
    count: number
  }>
  funnelData: Array<{
    type: 'group' | 'status'
    groupKey?: string
    groupLabel?: string
    statusId?: string
    statusCode?: string
    statusName?: string
    statusColor?: string | null
    count?: number
    previousCount?: number
    conversionRate?: number
  }>
  taPerformance: Array<{
    taId: string
    taName: string
    taEmail: string
    taRole: string
    totalCandidates: number
    passedCandidates: number
    onboardedCandidates: number
  }>
}

// Helper function to adjust color brightness
function adjustColor(color: string | null, amount: number): string {
  if (!color || color.length < 7) return color || '#6B7280'
  const usePound = color[0] === '#'
  const col = usePound ? color.slice(1) : color
  const num = parseInt(col, 16)
  if (isNaN(num)) return color
  let r = (num >> 16) + amount
  let g = ((num >> 8) & 0x00FF) + amount
  let b = (num & 0x0000FF) + amount
  r = r > 255 ? 255 : r < 0 ? 0 : r
  g = g > 255 ? 255 : g < 0 ? 0 : g
  b = b > 255 ? 255 : b < 0 ? 0 : b
  const result = (r << 16 | g << 8 | b).toString(16).padStart(6, '0')
  return (usePound ? '#' : '') + result
}

export default function RecruitmentDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  // Filter states
  const [campaignId, setCampaignId] = useState<string>('ALL')
  const [storeId, setStoreId] = useState<string>('ALL')
  const [taId, setTaId] = useState<string>('ALL')
  const [statusId, setStatusId] = useState<string>('ALL')
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined })
  const [showFilters, setShowFilters] = useState(false)

  // Filter options
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [stores, setStores] = useState<any[]>([])
  const [statuses, setStatuses] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])

  const fetchFilters = async () => {
    const [campaignsRes, storesRes, statusesRes, usersRes] = await Promise.all([
      api.get('/recruitment/campaigns').catch(() => ({ data: [] })),
      api.get('/stores').catch(() => ({ data: [] })),
      api.get('/types/by-category/CANDIDATE_STATUS').catch(() => ({ data: [] })),
      api.get('/users/select').catch(() => ({ data: [] })),
    ])
    setCampaigns(campaignsRes.data || [])
    setStores(storesRes.data || [])
    setStatuses(statusesRes.data || [])
    setUsers(usersRes.data || [])
  }

  const buildFilterParams = () => {
    const params = new URLSearchParams()
    if (campaignId && campaignId !== 'ALL') params.append('campaignId', campaignId)
    if (storeId && storeId !== 'ALL') params.append('storeId', storeId)
    if (taId && taId !== 'ALL') params.append('taId', taId)
    if (statusId && statusId !== 'ALL') params.append('statusId', statusId)
    if (dateRange.from) params.append('dateFrom', dateRange.from.toISOString())
    if (dateRange.to) params.append('dateTo', dateRange.to.toISOString())
    return params.toString()
  }

  const fetchDashboard = () => {
    const params = buildFilterParams()
    api
      .get(`/recruitment/dashboard${params ? `?${params}` : ''}`)
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  const clearFilters = () => {
    setCampaignId('ALL')
    setStoreId('ALL')
    setTaId('ALL')
    setStatusId('ALL')
    setDateRange({ from: undefined, to: undefined })
  }

  const hasFilters = (campaignId !== 'ALL') || (storeId !== 'ALL') || (taId !== 'ALL') || dateRange.from || dateRange.to

  useEffect(() => {
    fetchFilters()
  }, [])

  useEffect(() => {
    setLoading(true)
    fetchDashboard()
  }, [campaignId, storeId, taId, statusId, dateRange])



  // Skeleton loading UI
  if (loading && !data) {
    return (
      <div className="pt-6 space-y-8 animate-pulse">
        <div className="pb-2">
          <div className="h-8 bg-gray-200 rounded w-72 mb-2" />
          <div className="h-4 bg-gray-100 rounded w-96" />
        </div>
        {/* Filter skeleton */}
        <div className="flex gap-3 pb-6 border-b border-gray-100">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-10 bg-gray-200 rounded-md w-[220px]" />)}
        </div>
        {/* KPI cards skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-3 bg-gray-200 rounded w-28 mb-3" />
                  <div className="h-8 bg-gray-200 rounded w-16" />
                </div>
                <div className="w-10 h-10 bg-gray-100 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
        {/* Chart skeleton */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="h-5 bg-gray-200 rounded w-48" />
          </div>
          <div className="p-6">
            <div className="h-[300px] bg-gray-100 rounded" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <div key={i} className="bg-white shadow rounded-lg p-6">
              <div className="h-5 bg-gray-200 rounded w-40 mb-4" />
              <div className="h-[280px] bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return <div className="text-center py-8 text-red-600">Không thể tải dữ liệu dashboard</div>
  }

  // Prepare chart data
  const candidatesByStatus = data?.candidatesByStatus || []
  const monthlyData = data?.monthlyData || []
  const candidatesByCampaign = data?.candidatesByCampaign || []
  const candidatesByStore = data?.candidatesByStore || []
  const funnelData = data?.funnelData || []
  const taPerformance = data?.taPerformance || []

  // KPI: Đã xử lý = status khác CV_FILTERING (status đầu tiên)
  const processedCount = candidatesByStatus
    ?.filter((s: any) => s.statusCode !== 'CV_FILTERING')
    .reduce((sum: number, s: any) => sum + (s.count || 0), 0);

  // KPI: Ứng viên đạt = các status: HR_INTERVIEW_PASSED, SM_AM_INTERVIEW_PASSED,
  //   OM_PV_INTERVIEW_PASSED, OFFER_SENT, OFFER_ACCEPTED, WAITING_ONBOARDING,
  //   ONBOARDING_ACCEPTED, ONBOARDING_REJECTED (status_id tương ứng 10,12,15,16,17,18,19,20)
  const PASSED_STATUS_CODES = [
    'HR_INTERVIEW_PASSED',
    'SM_AM_INTERVIEW_PASSED',
    'OM_PV_INTERVIEW_PASSED',
    'OFFER_SENT',
    'OFFER_ACCEPTED',
    'WAITING_ONBOARDING',
    'ONBOARDING_ACCEPTED',
    'ONBOARDING_REJECTED',
  ];
  const cvPassedCount = candidatesByStatus
    ?.filter((s: any) => PASSED_STATUS_CODES.includes(s.statusCode))
    .reduce((sum: number, s: any) => sum + (s.count || 0), 0);

  // KPI: Đồng ý nhận việc = ONBOARDING_ACCEPTED (status_id 20)
  const acceptedCount = candidatesByStatus
    ?.find((s: any) => s.statusCode === 'ONBOARDING_ACCEPTED')?.count || 0;

  const statusChartData = {
    series: candidatesByStatus
      .filter((s) => s.count > 0)
      .map((s) => s.count),
    labels: candidatesByStatus
      .filter((s) => s.count > 0)
      .map((s) => s.statusName),
    colors: candidatesByStatus
      .filter((s) => s.count > 0)
      .map((s) => s.statusColor || '#6B7280'),
  }

  const monthlyChartOptions = {
    chart: {
      type: 'area' as const,
      height: 350,
      toolbar: { show: false },
      zoom: { enabled: false },
      fontFamily: 'Lexend, sans-serif',
    },
    dataLabels: { enabled: false },
    stroke: {
      curve: 'smooth' as const,
      width: 3,
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.3,
        stops: [0, 100],
      },
    },
    xaxis: {
      categories: monthlyData.map((d) => d.month),
      labels: {
        style: {
          fontFamily: 'Lexend, sans-serif',
        },
      },
    },
    yaxis: {
      title: {
        text: 'Số lượng ứng viên',
        style: {
          fontFamily: 'Lexend, sans-serif',
        },
      },
      labels: {
        style: {
          fontFamily: 'Lexend, sans-serif',
        },
      },
    },
    colors: ['#E31837'],
    tooltip: {
      y: {
        formatter: (val: number) => `${val} ứng viên`,
      },
      style: {
        fontFamily: 'Lexend, sans-serif',
      },
    },
  }

  const monthlyChartSeries = [
    {
      name: 'Ứng viên mới',
      data: monthlyData.map((d) => d.count),
    },
  ]

  const campaignChartOptions = {
    chart: {
      type: 'bar' as const,
      height: 350,
      toolbar: { show: false },
      fontFamily: 'Lexend, sans-serif',
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 4,
        dataLabels: {
          position: 'top' as const,
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => val.toString(),
      offsetX: -10,
      style: {
        fontSize: '12px',
        colors: ['#fff'],
        fontFamily: 'Lexend, sans-serif',
      },
    },
    xaxis: {
      categories: candidatesByCampaign
        ?.sort((a: any, b: any) => b.count - a.count)
        ?.slice(0, 10)
        ?.map((c: any) => c.campaignName) || [],
      labels: {
        style: {
          fontFamily: 'Lexend, sans-serif',
        },
      },
    },
    yaxis: {
      title: {
        text: 'Số lượng ứng viên',
        style: {
          fontFamily: 'Lexend, sans-serif',
        },
      },
      labels: {
        style: {
          fontFamily: 'Lexend, sans-serif',
        },
      },
    },
    colors: ['#3B82F6'],
    tooltip: {
      y: {
        formatter: (val: number) => `${val} ứng viên`,
      },
      style: {
        fontFamily: 'Lexend, sans-serif',
      },
    },
  }

  const campaignChartSeries = [
    {
      name: 'Ứng viên',
      data: candidatesByCampaign
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map((c) => c.count),
    },
  ]

  const storeChartOptions = {
    chart: {
      type: 'bar' as const,
      height: 400,
      toolbar: { show: false },
      fontFamily: 'Lexend, sans-serif',
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 4,
        dataLabels: {
          position: 'top' as const,
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => val.toString(),
      offsetX: -10,
      style: {
        fontSize: '12px',
        colors: ['#fff'],
        fontFamily: 'Lexend, sans-serif',
      },
    },
    xaxis: {
      categories: candidatesByStore
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map((s) => s.storeCode),
      labels: {
        style: {
          fontFamily: 'Lexend, sans-serif',
        },
      },
    },
    yaxis: {
      title: {
        text: 'Số lượng ứng viên',
        style: {
          fontFamily: 'Lexend, sans-serif',
        },
      },
      labels: {
        style: {
          fontFamily: 'Lexend, sans-serif',
        },
      },
    },
    colors: ['#10B981'],
    tooltip: {
      y: {
        formatter: (val: number, opts?: any) => {
          const store = candidatesByStore.find(s => s.storeCode === opts?.w?.globals?.categoryLabel?.[opts?.dataPointIndex])
          return `${val} ứng viên - ${store?.storeName || ''}`
        },
      },
      style: {
        fontFamily: 'Lexend, sans-serif',
      },
    },
  }

  const storeChartSeries = [
    {
      name: 'Ứng viên',
      data: candidatesByStore
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map((s) => s.count),
    },
  ]
  return (
    <div className="pt-6 space-y-12 relative">
      {loading && (
        <div className="absolute inset-x-0 top-0 h-0.5 z-50 bg-red-600 animate-pulse"></div>
      )}
      {/* Page Header */}
      <div className="pb-2">
        <h1 className="text-2xl font-bold text-gray-900">Bảng điều khiển tuyển dụng</h1>
        <p className="text-gray-600 mt-2">Tổng quan về quy trình tuyển dụng và thống kê ứng viên</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 pb-6 border-b border-gray-100">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Chiến dịch */}
          <div className="w-[220px]">
            <Select value={campaignId} onValueChange={setCampaignId}>
              <SelectTrigger className="h-auto min-h-[40px] bg-white [&>span]:line-clamp-none py-2">
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-gray-400" />
                  <SelectValue placeholder="Chiến dịch" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả chiến dịch</SelectItem>
                {campaigns.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cửa hàng */}
          <div className="w-[220px]">
            <Select value={storeId} onValueChange={setStoreId}>
              <SelectTrigger className="h-auto min-h-[40px] bg-white [&>span]:line-clamp-none py-2">
                <div className="flex items-center gap-2">
                  <Icon name="store" size={14} className="text-gray-400" />
                  <SelectValue placeholder="Cửa hàng" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả cửa hàng</SelectItem>
                {Object.entries(
                  stores.reduce((acc: any, store: any) => {
                    const city = store.city || 'Khác';
                    if (!acc[city]) acc[city] = [];
                    acc[city].push(store);
                    return acc;
                  }, {})
                ).sort(([cityA], [cityB]) => cityA.localeCompare(cityB)).map(([city, cityStores]: [string, any]) => (
                  <SelectGroup key={city}>
                    <SelectItem value={`CITY:${city}`} className="font-bold text-gray-900 bg-gray-100 focus:bg-gray-200 focus:text-gray-900 py-2">
                      {city.toUpperCase()}
                    </SelectItem>
                    {[...cityStores].sort((a, b) => a.code.localeCompare(b.code)).map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.code} - {s.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>



          {/* TA phụ trách */}
          <div className="w-[220px]">
            <Select value={taId} onValueChange={setTaId}>
              <SelectTrigger className="h-auto min-h-[40px] bg-white [&>span]:line-clamp-none py-2">
                <div className="flex items-center gap-2">
                  <Icon name="user" size={14} className="text-gray-400" />
                  <SelectValue placeholder="Người phụ trách" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả người phụ trách</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.fullName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-md px-2 h-10 shadow-sm">
            <Popover>
              <PopoverTrigger asChild>
                <button className="text-xs font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1.5 px-1">
                  {dateRange.from ? dateRange.from.toLocaleDateString('vi-VN') : 'Từ ngày'}
                  <Calendar className="w-3.5 h-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarPicker
                  mode="single"
                  selected={dateRange.from}
                  onSelect={(date) => setDateRange({ ...dateRange, from: date })}
                />
              </PopoverContent>
            </Popover>
            <span className="text-gray-300">-</span>
            <Popover>
              <PopoverTrigger asChild>
                <button className="text-xs font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1.5 px-1">
                  {dateRange.to ? dateRange.to.toLocaleDateString('vi-VN') : 'Đến ngày'}
                  <Calendar className="w-3.5 h-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarPicker
                  mode="single"
                  selected={dateRange.to}
                  onSelect={(date) => setDateRange({ ...dateRange, to: date })}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tổng ứng viên</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{data?.totalCandidates || 0}</p>
            </div>
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Chiến dịch hoạt động</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{data.activeCampaigns}</p>
              <p className="text-xs text-gray-400 mt-1">Tổng: {data.totalCampaigns}</p>
            </div>
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Form tuyển dụng</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{data.totalForms}</p>
            </div>
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Đã xử lý</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{processedCount}</p>
              <p className="text-xs text-gray-400 mt-1 italic">* Khác trạng thái Lọc CV</p>
            </div>
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ứng viên đạt</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{cvPassedCount}</p>
              <p className="text-xs text-gray-400 mt-1 italic">* Quản lý trả kết quả đạt</p>

            </div>
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Đồng ý nhận việc</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{acceptedCount}</p>
              <p className="text-xs text-gray-400 mt-1 italic">* Trạng thái Đồng ý nhận việc</p>
            </div>
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1: Funnel Details Table */}
      <div className="bg-white shadow overflow-x-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Chi tiết quá trình tuyển dụng</h3>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                Trạng thái
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-l">
                Số lượng
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-l">
                Chuyển đổi (%)
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {(() => {
              // Lấy số lượng thực tế của ứng viên (tổng số CV nhận vào)
              // Ưu tiên: trạng thái đầu tiên "Lọc CV" (CV_FILTERING) trong group "application"
              // Nếu không có, dùng totalCandidates
              const applicationGroupIndex = funnelData.findIndex(
                (x) => x.type === 'group' && x.groupKey === 'application'
              )
              let applicationTotal = 0
              if (applicationGroupIndex !== -1) {
                // Tìm trạng thái đầu tiên trong group "application" (CV_FILTERING - "Lọc CV")
                const nextGroupIndex = funnelData.findIndex(
                  (x, idx) => idx > applicationGroupIndex && x.type === 'group'
                )
                const endIndex = nextGroupIndex === -1 ? funnelData.length : nextGroupIndex
                const firstApplicationStatus = funnelData
                  .slice(applicationGroupIndex + 1, endIndex)
                  .find((i) => i.type === 'status' && i.statusCode === 'CV_FILTERING')

                // Số lượng thực tế = số lượng của trạng thái "Lọc CV" (tổng số CV nhận vào)
                applicationTotal = firstApplicationStatus?.count || 0
              }
              // Nếu không tìm thấy, dùng totalCandidates (tổng số ứng viên thực tế)
              const totalForConversion = applicationTotal > 0 ? applicationTotal : data.totalCandidates

              return funnelData.map((item, index) => {
                if (item.type === 'group') {
                  // Nếu là group "Ứng tuyển", hiển thị số lượng thực tế (tổng số CV nhận vào)
                  // Các group khác: tính tổng các status trong group (cumulative count)
                  let groupTotal = 0
                  if (item.groupKey === 'application') {
                    // Group "Ứng tuyển": dùng số lượng thực tế (tổng số CV nhận vào)
                    groupTotal = totalForConversion
                  } else {
                    // Các group khác: tính tổng các status trong group
                    const nextGroupIndex = funnelData.findIndex(
                      (x, idx) => idx > index && x.type === 'group'
                    )
                    const endIndex = nextGroupIndex === -1 ? funnelData.length : nextGroupIndex
                    const groupItems = funnelData
                      .slice(index + 1, endIndex)
                      .filter((i) => i.type === 'status')

                    // Lấy số lượng của trạng thái đầu tiên trong group (cumulative count)
                    // Vì đây là cumulative, nên trạng thái đầu tiên đã bao gồm tất cả các trạng thái sau
                    const firstStatus = groupItems[0]
                    groupTotal = firstStatus?.count || 0
                  }

                  // Nếu là group "Ứng tuyển", chuyển đổi = 100%
                  // Các group khác: chuyển đổi = groupTotal / totalForConversion
                  const groupConversionRate = item.groupKey === 'application'
                    ? '100.0'
                    : totalForConversion > 0
                      ? ((groupTotal / totalForConversion) * 100).toFixed(1)
                      : '0.0'

                  return (
                    <tr key={`group-${item.groupKey}`} className="bg-gray-100 hover:bg-gray-100">
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900 sticky left-0 bg-gray-100 z-10">
                        <span className="font-bold">{item.groupLabel}</span>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-center border-l">
                        {groupTotal.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-500 text-center border-l">
                        {groupConversionRate}%
                      </td>
                    </tr>
                  )
                } else {
                  // Status row
                  // Lấy số lượng thực tế của trạng thái từ candidatesByStatus (không phải cumulative)
                  const actualStatusCount = candidatesByStatus.find(
                    (s) => s.statusId === item.statusId
                  )?.count || 0

                  // Chuyển đổi (%) = số lượng thực tế / số lượng "Ứng tuyển"
                  const conversionRate = totalForConversion > 0 && actualStatusCount
                    ? ((actualStatusCount / totalForConversion) * 100).toFixed(1)
                    : '0.0'

                  return (
                    <tr key={item.statusId} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-gray-700 sticky left-0 bg-white z-10">
                        <div className="flex items-center gap-2 pl-6">
                          {item.statusColor && (
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: item.statusColor }}
                            />
                          )}
                          <span>{item.statusName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900 text-center border-l">
                        {actualStatusCount.toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500 text-center border-l">
                        {conversionRate}%
                      </td>
                    </tr>
                  )
                }
              })
            })()}
          </tbody>
          <tfoot className="bg-gray-50">
            {(() => {
              // Lấy số lượng thực tế của ứng viên để hiển thị trong footer
              // Ưu tiên: trạng thái đầu tiên "Lọc CV" (CV_FILTERING) trong group "application"
              const applicationGroupIndex = funnelData.findIndex(
                (x) => x.type === 'group' && x.groupKey === 'application'
              )
              let applicationTotal = 0
              if (applicationGroupIndex !== -1) {
                const nextGroupIndex = funnelData.findIndex(
                  (x, idx) => idx > applicationGroupIndex && x.type === 'group'
                )
                const endIndex = nextGroupIndex === -1 ? funnelData.length : nextGroupIndex
                const firstApplicationStatus = funnelData
                  .slice(applicationGroupIndex + 1, endIndex)
                  .find((i) => i.type === 'status' && i.statusCode === 'CV_FILTERING')

                // Số lượng thực tế = số lượng của trạng thái "Lọc CV"
                applicationTotal = firstApplicationStatus?.count || 0
              }
              const totalForDisplay = applicationTotal > 0 ? applicationTotal : data.totalCandidates

              return (
                <tr>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 sticky left-0 bg-gray-50 z-10">
                    Tổng cộng
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-center border-l">
                    {totalForDisplay.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-500 text-center border-l">
                    100%
                  </td>
                </tr>
              )
            })()}
          </tfoot>
        </table>
      </div>
      {/* TA Performance Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Hiệu suất Người phụ trách (TA)</h3>
        {typeof window !== 'undefined' && (
          <Chart
            options={{
              chart: {
                type: 'bar',
                height: 400,
                stacked: false,
                toolbar: { show: false },
                fontFamily: 'Lexend, sans-serif',
              },
              plotOptions: {
                bar: {
                  horizontal: false,
                  columnWidth: '55%',
                  borderRadius: 4,
                },
              },
              dataLabels: {
                enabled: false
              },
              stroke: {
                show: true,
                width: 2,
                colors: ['transparent']
              },
              xaxis: {
                categories: data.taPerformance.map(ta => ta.taName),
                labels: {
                  style: {
                    fontFamily: 'Lexend, sans-serif',
                  }
                }
              },
              yaxis: {
                title: {
                  text: 'Số lượng ứng viên',
                  style: {
                    fontFamily: 'Lexend, sans-serif',
                  }
                },
                labels: {
                  style: {
                    fontFamily: 'Lexend, sans-serif',
                  }
                }
              },
              fill: {
                opacity: 1
              },
              tooltip: {
                y: {
                  formatter: (val) => `${val} ứng viên`
                },
                style: {
                  fontFamily: 'Lexend, sans-serif',
                }
              },
              colors: ['#10B981', '#F59E0B'],
              legend: {
                position: 'top',
                fontFamily: 'Lexend, sans-serif',
              }
            }}
            series={[
              {
                name: 'Đã xử lý',
                data: data.taPerformance.map((ta: any) => ta.processedCandidates ?? ta.totalCandidates)
              },
              {
                name: 'Ứng viên đạt',
                data: data.taPerformance.map((ta: any) => ta.passedCandidates)
              },
              {
                name: 'Đồng ý nhận việc',
                data: data.taPerformance.map((ta: any) => ta.onboardedCandidates)
              }
            ]}
            type="bar"
            height={400}
          />
        )}
      </div>

      {/* TA Performance Table */}
      {data.taPerformance && data.taPerformance.length > 0 && (
        <div className="mt-6">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Hiệu suất của TA (Người phụ trách)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TA</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vai trò</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng UV</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Đã xử lý</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ứng viên đạt</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Đồng ý nhận việc</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Tỷ lệ đạt</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.taPerformance.map((ta: any) => {
                    const processed = ta.processedCandidates ?? ta.totalCandidates
                    const passedRate = ta.totalCandidates > 0 ? ((ta.passedCandidates / ta.totalCandidates) * 100).toFixed(1) : '0.0'
                    const onboardedRate = ta.totalCandidates > 0 ? ((ta.onboardedCandidates / ta.totalCandidates) * 100).toFixed(1) : '0.0'
                    return (
                      <tr key={ta.taId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{ta.taName}</div>
                          <div className="text-sm text-gray-500">{ta.taEmail}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {ta.taRole === 'USER' ? 'SM' : ta.taRole === 'MANAGER' ? 'AM' : ta.taRole === 'RECRUITER' ? 'Recruiter' : ta.taRole}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 font-medium">
                          {ta.totalCandidates}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-indigo-600 font-medium">
                          {processed}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-blue-600 font-medium">
                          {ta.passedCandidates} ({passedRate}%)
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-green-600 font-medium">
                          {ta.onboardedCandidates} ({onboardedRate}%)
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${parseFloat(onboardedRate) >= 50 ? 'bg-green-100 text-green-800' :
                            parseFloat(onboardedRate) >= 20 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                            {onboardedRate}%
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}


      {/* Charts Row 2: Status Distribution and Monthly Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution Pie Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Phân bố theo trạng thái</h3>
          {typeof window !== 'undefined' && (
            <Chart
              options={{
                chart: {
                  type: 'pie',
                  height: 350,
                },
                labels: statusChartData.labels,
                colors: statusChartData.colors,
                legend: {
                  position: 'bottom',
                },
                dataLabels: {
                  enabled: true,
                  formatter: (val: number) => `${val.toFixed(1)}%`,
                },
                tooltip: {
                  y: {
                    formatter: (val: number) => `${val} ứng viên`,
                  },
                },
              }}
              series={statusChartData.series}
              type="pie"
              height={350}
            />
          )}
        </div>

        {/* Monthly Trend */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Xu hướng tuyển dụng (6 tháng gần đây)</h3>
          {typeof window !== 'undefined' && (
            <Chart
              options={monthlyChartOptions}
              series={monthlyChartSeries}
              type="area"
              height={350}
            />
          )}
        </div>
      </div>

      {/* Charts Row 3: Campaign Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Campaign Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ứng viên theo chiến dịch (Top 10)</h3>
          {typeof window !== 'undefined' && (
            <Chart
              options={campaignChartOptions}
              series={campaignChartSeries}
              type="bar"
              height={350}
            />
          )}
        </div>

        {/* Charts Row 4: Store Distribution */}
        <div className="grid grid-cols-1 gap-6">
          {/* Store Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ứng viên theo cửa hàng (Top 10)</h3>
            {typeof window !== 'undefined' && (
              <Chart
                options={storeChartOptions}
                series={storeChartSeries}
                type="bar"
                height={400}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

