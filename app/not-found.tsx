import Link from 'next/link';
import { Home, AlertTriangle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-red-600" />
          </div>
        </div>
        <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Trang không tồn tại</h2>
        <p className="text-gray-600 mb-8">
          Rất tiếc, trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển. 
          Vui lòng kiểm tra lại URL hoặc quay về trang chủ.
        </p>
        <Link 
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#E31837] text-white font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-md"
        >
          <Home className="w-5 h-5" />
          Quay về trang chủ
        </Link>
      </div>
      
      {/* Decorative elements */}
      <div className="mt-12 flex gap-4 opacity-20 grayscale">
        <img src="https://www.kfc.com.vn/assets/img/kfc-logo.svg" alt="KFC Logo" className="h-8" />
      </div>
    </div>
  );
}