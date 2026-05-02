import Layout from '@/components/Layout'
import SettingsTabs from '@/components/settings/SettingsTabs'

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <Layout>
      <SettingsTabs />
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mt-6 p-6 sm:p-8">
        {children}
      </div>
    </Layout>
  )
}
