import { useState, useCallback } from 'react'
import api from './api'

interface UseApiOptions {
  transform?: (data: any) => any
  onSuccess?: (data: any) => void
  onError?: (error: any) => void
}

interface UseApiReturn<T> {
  data: T | null
  loading: boolean
  error: string | null
  execute: () => Promise<void>
  reset: () => void
}

export function useApi<T = any>(
  url: string,
  method: 'get' | 'post' | 'put' | 'patch' | 'delete' = 'get',
  options: UseApiOptions = {}
): UseApiReturn<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(async (body?: any) => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.request({
        url,
        method,
        data: body,
      })
      const result = options.transform ? options.transform(res.data) : res.data
      setData(result)
      options.onSuccess?.(result)
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Lỗi không xác định'
      setError(message)
      options.onError?.(err)
    } finally {
      setLoading(false)
    }
  }, [url, method, options])

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  return { data, loading, error, execute, reset }
}

// Convenience hooks
export const useGet = <T = any>(url: string, options?: UseApiOptions) => 
  useApi<T>(url, 'get', options)

export const usePost = <T = any>(url: string, options?: UseApiOptions) => 
  useApi<T>(url, 'post', options)

export const usePut = <T = any>(url: string, options?: UseApiOptions) => 
  useApi<T>(url, 'put', options)

export const useDelete = <T = any>(url: string, options?: UseApiOptions) => 
  useApi<T>(url, 'delete', options)