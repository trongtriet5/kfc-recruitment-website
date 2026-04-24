'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import api from '@/lib/api'
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

  useEffect(() => {
    api
      .get('/recruitment/dashboard')
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="text-center py-8">Đang tải dữ liệu...</div>
  }

  if (!data) {
    return <div className="text-center py-8 text-red-600">Không thể tải dữ liệu dashboard</div>
  }

  // Using getBrandLabel from brand-utils

  // Prepare chart data
  const candidatesByStatus = data.candidatesByStatus || []
  const monthlyData = data.monthlyData || []
  const candidatesByCampaign = data.candidatesByCampaign || []
  const candidatesByStore = data.candidatesByStore || []
  const funnelData = data.funnelData || []
  
  const cvPassedCount = candidatesByStatus
    .filter((s) => [
      'SM_AM_INTERVIEW_PASSED',
      'OM_PV_INTERVIEW_PASSED',
      'OFFER_SENT',
      'OFFER_ACCEPTED',
      'OFFER_REJECTED',
      'WAITING_ONBOARDING',
      'ONBOARDING_ACCEPTED',
      'ONBOARDING_REJECTED'
    ].includes(s.statusCode))
    .reduce((sum, s) => sum + (s.count || 0), 0);

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
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map((c) => c.campaignName),
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
        .map((s) => s.storeName),
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
        formatter: (val: number) => `${val} ứng viên`,
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
    <div className="pt-6 space-y-12">
      {/* Page Header */}
      <div className="pb-2">
        <h1 className="text-2xl font-bold text-gray-900">Bảng điều khiển tuyển dụng</h1>
        <p className="text-gray-600 mt-2">Tổng quan về quy trình tuyển dụng và thống kê ứng viên</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tổng ứng viên</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{data.totalCandidates}</p>
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
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ứng viên mới</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{data.newCandidatesThisMonth}</p>
              {data.newCandidatesLastMonth > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  Tháng trước: {data.newCandidatesLastMonth}
                </p>
              )}
            </div>
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
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
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ứng viên đạt</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {cvPassedCount}
              </p>
            </div>
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Trúng tuyển</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {candidatesByStatus.find((s) => s.statusCode === 'ONBOARDING_ACCEPTED')?.count || 0}
              </p>
            </div>
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
