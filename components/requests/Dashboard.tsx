'use client'

import { useEffect, useState, useImperativeHandle, forwardRef } from 'react'
import dynamic from 'next/dynamic'
import api from '@/lib/api'

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

interface DashboardData {
  totalOnLeave: number
  paidLeave: number
  unpaidLeave: number
  resigned: number
  overtimeCount: number
  absenceCount: number
  businessTripCount: number
  checkinCount: number
  resignationReasons: Array<{
    reason: string
    count: number
  }>
  leaveByDepartment: Array<{
    departmentId: string | null
    departmentName: string
    count: number
  }>
  overtimeByDepartment: Array<{
    departmentId: string | null
    departmentName: string
    totalHours: number
  }>
  monthlyData: Array<{
    month: string
    count: number
  }>
  requestsByType: Array<{
    typeId: string
    typeName: string
    count: number
  }>
}

export interface RequestsDashboardRef {
  refresh: () => void
}

const RequestsDashboard = forwardRef<RequestsDashboardRef>((props, ref) => {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const loadDashboard = () => {
    setLoading(true)
    api
      .get('/requests/dashboard')
      .then((res) => {
        console.log('Dashboard data:', res.data)
        setData(res.data)
      })
      .catch((err) => {
        console.error('Error loading dashboard:', err)
        if (err.response?.data) {
          console.error('Error details:', err.response.data)
        }
      })
      .finally(() => setLoading(false))
  }

  useImperativeHandle(ref, () => ({
    refresh: loadDashboard,
  }))

  useEffect(() => {
    loadDashboard()
  }, [])

  if (loading) {
    return <div className="text-center py-8">Đang tải dữ liệu...</div>
  }

  if (!data) {
    return <div className="text-center py-8 text-red-600">Không thể tải dữ liệu dashboard</div>
  }

  // Prepare chart data
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
      categories: data.monthlyData.map((d) => d.month),
      labels: {
        style: {
          fontFamily: 'Lexend, sans-serif',
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          fontFamily: 'Lexend, sans-serif',
        },
      },
    },
    colors: ['#3B82F6'],
    tooltip: {
      y: {
        formatter: (val: number) => `${val} đơn từ`,
      },
      style: {
        fontFamily: 'Lexend, sans-serif',
      },
    },
  }

  const monthlyChartSeries = [
    {
      name: 'Đơn từ mới',
      data: data.monthlyData.map((d) => d.count),
    },
  ]

  const requestsByTypeChartOptions = {
    chart: {
      type: 'donut' as const,
      height: 350,
      fontFamily: 'Lexend, sans-serif',
    },
    labels: data.requestsByType.map((t) => t.typeName),
    colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'],
    legend: {
      position: 'bottom' as const,
      fontFamily: 'Lexend, sans-serif',
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number | string) => `${Number(val || 0).toFixed(1)}%`,
      style: {
        fontFamily: 'Lexend, sans-serif',
      },
    },
    tooltip: {
      y: {
        formatter: (val: number) => `${val} đơn từ`,
      },
      style: {
        fontFamily: 'Lexend, sans-serif',
      },
    },
  }

  const requestsByTypeChartSeries = data.requestsByType.map((t) => t.count)

  const leaveByDepartmentChartOptions = {
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
      categories: data.leaveByDepartment
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map((d) => d.departmentName),
      labels: {
        style: {
          fontFamily: 'Lexend, sans-serif',
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          fontFamily: 'Lexend, sans-serif',
        },
      },
    },
    colors: ['#10B981'],
    tooltip: {
      y: {
        formatter: (val: number) => `${val} đơn từ`,
      },
      style: {
        fontFamily: 'Lexend, sans-serif',
      },
    },
  }

  const leaveByDepartmentChartSeries = [
    {
      name: 'Đơn nghỉ phép',
      data: data.leaveByDepartment
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map((d) => d.count),
    },
  ]

  const overtimeByDepartmentChartOptions = {
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
      formatter: (val: number | string) => `${Number(val || 0).toFixed(1)}h`,
      offsetX: -10,
      style: {
        fontSize: '12px',
        colors: ['#fff'],
        fontFamily: 'Lexend, sans-serif',
      },
    },
    xaxis: {
      categories: data.overtimeByDepartment
        .sort((a, b) => b.totalHours - a.totalHours)
        .slice(0, 10)
        .map((d) => d.departmentName),
      labels: {
        style: {
          fontFamily: 'Lexend, sans-serif',
        },
      },
    },
    yaxis: {
      title: { 
        text: 'Tổng giờ tăng ca',
        style: {
          fontFamily: 'Lexend, sans-serif',
        },
      },
      labels: {
        style: {
          fontFamily: 'Lexend, sans-serif',
        },
        formatter: (val: number | string) => `${Number(val || 0).toFixed(1)}h`,
      },
    },
    colors: ['#8B5CF6'],
    tooltip: {
      y: {
        formatter: (val: number | string) => `${Number(val || 0).toFixed(1)} giờ`,
      },
      style: {
        fontFamily: 'Lexend, sans-serif',
      },
    },
  }

  const overtimeByDepartmentChartSeries = [
    {
      name: 'Giờ tăng ca',
      data: data.overtimeByDepartment
        .sort((a, b) => b.totalHours - a.totalHours)
        .slice(0, 10)
        .map((d) => d.totalHours),
    },
  ]

  const resignationReasonsChartOptions = {
    chart: {
      type: 'pie' as const,
      height: 350,
      fontFamily: 'Lexend, sans-serif',
    },
    labels: data.resignationReasons.map((r) => r.reason || 'Không có lý do'),
    colors: ['#EF4444', '#F59E0B', '#8B5CF6', '#3B82F6', '#10B981', '#EC4899', '#06B6D4'],
    legend: {
      position: 'bottom' as const,
      fontFamily: 'Lexend, sans-serif',
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number | string) => `${Number(val || 0).toFixed(1)}%`,
      style: {
        fontFamily: 'Lexend, sans-serif',
      },
    },
    tooltip: {
      y: {
        formatter: (val: number) => `${val} đơn từ`,
      },
      style: {
        fontFamily: 'Lexend, sans-serif',
      },
    },
  }

  const resignationReasonsChartSeries = data.resignationReasons.map((r) => r.count)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tổng nhân sự nghỉ</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{data.totalOnLeave}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Nghỉ phép</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{data.paidLeave}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Nghỉ không lương</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{data.unpaidLeave}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Thôi việc</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{data.resigned}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tăng ca</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">{data.overtimeCount}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Vắng mặt</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{data.absenceCount}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Công tác</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{data.businessTripCount}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Check-in/out</p>
              <p className="text-3xl font-bold text-pink-600 mt-2">{data.checkinCount}</p>
            </div>
            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1: Monthly Trend and Request Types */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Xu hướng đơn từ (6 tháng gần đây)</h3>
          {typeof window !== 'undefined' && (
            <Chart
              options={monthlyChartOptions}
              series={monthlyChartSeries}
              type="area"
              height={350}
            />
          )}
        </div>

        {/* Request Types Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Phân bố theo loại đơn từ</h3>
          {typeof window !== 'undefined' && (
            <Chart
              options={requestsByTypeChartOptions}
              series={requestsByTypeChartSeries}
              type="donut"
              height={350}
            />
          )}
        </div>
      </div>

      {/* Charts Row 2: Leave by Department and Overtime by Department */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leave by Department */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Nghỉ phép theo phòng ban (Top 10)</h3>
          {typeof window !== 'undefined' && data.leaveByDepartment.length > 0 ? (
            <Chart
              options={leaveByDepartmentChartOptions}
              series={leaveByDepartmentChartSeries}
              type="bar"
              height={350}
            />
          ) : (
            <div className="text-center py-8 text-gray-500">Chưa có dữ liệu</div>
          )}
        </div>

        {/* Overtime by Department */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tăng ca theo phòng ban (Top 10)</h3>
          {typeof window !== 'undefined' && data.overtimeByDepartment.length > 0 ? (
            <Chart
              options={overtimeByDepartmentChartOptions}
              series={overtimeByDepartmentChartSeries}
              type="bar"
              height={350}
            />
          ) : (
            <div className="text-center py-8 text-gray-500">Chưa có dữ liệu</div>
          )}
        </div>
      </div>

      {/* Charts Row 3: Resignation Reasons */}
      {data.resignationReasons.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Lý do thôi việc</h3>
          {typeof window !== 'undefined' && (
            <Chart
              options={resignationReasonsChartOptions}
              series={resignationReasonsChartSeries}
              type="pie"
              height={350}
            />
          )}
        </div>
      )}
    </div>
  )
})

RequestsDashboard.displayName = 'RequestsDashboard'

export default RequestsDashboard
