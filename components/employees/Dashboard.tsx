'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import api from '@/lib/api'

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

interface DashboardData {
  totalEmployees: number
  working: number
  newEmployees: number
  resigned: number
  byGender: Array<{ gender: string; count: number }>
  byDepartment: Array<{ departmentId: string | null; department: { name: string } | null; count: number }>
  byPosition: Array<{ positionId: string | null; position: { name: string } | null; count: number }>
  byContractType: Array<{ contractTypeId: string | null; count: number }>
  byEducation: Array<{ education: string; count: number }>
  newContracts: number
  expiringContracts: number
  insuranceDecreased: number
  insuranceIncreased: number
}

export default function EmployeesDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get('/employees/dashboard')
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="text-center py-4">Đang tải...</div>
  }

  if (!data) {
    return null
  }

  const getEducationLabel = (edu: string) => {
    const labels: Record<string, string> = {
      HIGH_SCHOOL: 'THPT',
      VOCATIONAL: 'Trung cấp',
      COLLEGE: 'Cao đẳng',
      UNIVERSITY: 'Đại học',
      POSTGRADUATE: 'Sau đại học',
    }
    return labels[edu] || edu
  }

  // Gender Chart (Pie)
  const genderChartOptions = {
    chart: {
      type: 'pie' as const,
      fontFamily: 'Lexend, sans-serif',
    },
    labels: data.byGender.map((g) =>
      g.gender === 'MALE' ? 'Nam' : g.gender === 'FEMALE' ? 'Nữ' : 'Khác'
    ),
    colors: ['#3B82F6', '#EC4899', '#8B5CF6'],
    legend: {
      position: 'bottom' as const,
      fontFamily: 'Lexend, sans-serif',
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val.toFixed(1)}%`,
      style: {
        fontFamily: 'Lexend, sans-serif',
      },
    },
  }
  const genderChartSeries = data.byGender.map((g) => g.count)

  // Department Chart (Horizontal Bar)
  const departmentData = data.byDepartment
    .filter((d) => d.department)
    .slice(0, 10)
    .sort((a, b) => b.count - a.count)

  const departmentChartOptions = {
    chart: {
      type: 'bar' as const,
      horizontal: true,
      fontFamily: 'Lexend, sans-serif',
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        horizontal: true,
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => val.toString(),
      style: {
        fontFamily: 'Lexend, sans-serif',
      },
    },
    xaxis: {
      categories: departmentData.map((d) => d.department?.name || 'N/A'),
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
  }
  const departmentChartSeries = [
    {
      name: 'Số lượng',
      data: departmentData.map((d) => d.count),
    },
  ]

  // Position Chart (Horizontal Bar)
  const positionData = data.byPosition
    .filter((p) => p.position)
    .slice(0, 10)
    .sort((a, b) => b.count - a.count)

  const positionChartOptions = {
    chart: {
      type: 'bar' as const,
      horizontal: true,
      fontFamily: 'Lexend, sans-serif',
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        horizontal: true,
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => val.toString(),
      style: {
        fontFamily: 'Lexend, sans-serif',
      },
    },
    xaxis: {
      categories: positionData.map((p) => p.position?.name || 'N/A'),
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
  }
  const positionChartSeries = [
    {
      name: 'Số lượng',
      data: positionData.map((p) => p.count),
    },
  ]

  // Education Chart (Donut)
  const educationChartOptions = {
    chart: {
      type: 'donut' as const,
      fontFamily: 'Lexend, sans-serif',
    },
    labels: data.byEducation.map((e) => getEducationLabel(e.education)),
    colors: ['#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'],
    legend: {
      position: 'bottom' as const,
      fontFamily: 'Lexend, sans-serif',
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val.toFixed(1)}%`,
      style: {
        fontFamily: 'Lexend, sans-serif',
      },
    },
  }
  const educationChartSeries = data.byEducation.map((e) => e.count)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tổng số nhân sự</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{data.totalEmployees}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Đang làm việc</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{data.working}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Nhân sự mới</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">{data.newEmployees}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Nghỉ việc</p>
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
              <p className="text-sm font-medium text-gray-600">Hợp đồng mới</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{data.newContracts}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Hợp đồng sắp hết hạn</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{data.expiringContracts}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
                  </div>
                </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">BHXH giảm</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{data.insuranceDecreased}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
                </div>
              </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">BHXH tăng</p>
              <p className="text-3xl font-bold text-teal-600 mt-2">{data.insuranceIncreased}</p>
            </div>
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gender Chart */}
        {data.byGender && data.byGender.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Nhân sự theo giới tính
            </h3>
            {typeof window !== 'undefined' && (
              <Chart
                options={genderChartOptions}
                series={genderChartSeries}
                type="pie"
                height={300}
              />
            )}
          </div>
        )}

        {/* Education Chart */}
        {data.byEducation && data.byEducation.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Nhân sự theo học vấn
            </h3>
            {typeof window !== 'undefined' && (
              <Chart
                options={educationChartOptions}
                series={educationChartSeries}
                type="donut"
                height={300}
              />
            )}
          </div>
        )}

        {/* Department Chart */}
        {departmentData.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Nhân sự theo phòng ban
            </h3>
            {typeof window !== 'undefined' && (
              <Chart
                options={departmentChartOptions}
                series={departmentChartSeries}
                type="bar"
                height={Math.max(300, departmentData.length * 40)}
              />
            )}
          </div>
        )}

        {/* Position Chart */}
        {positionData.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Nhân sự theo vị trí
            </h3>
            {typeof window !== 'undefined' && (
              <Chart
                options={positionChartOptions}
                series={positionChartSeries}
                type="bar"
                height={Math.max(300, positionData.length * 40)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
