import Providers from "./providers"
import Sidebar from "@/components/sidebar"
import AppHeader from "@/components/app-header"
import { initDatabaseConnection } from '@/service/db/init'
import './globals.css'

// const displayCnFont = Ma_Shan_Zheng({
//   weight: "400",
//   variable: "--font-display-cn",
//   preload: false,
// })

const themeScript = `
(function() {
  try {
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const theme = systemDark ? 'dark' : 'light'
    document.documentElement.dataset.theme = theme
    document.documentElement.classList.toggle('dark', theme === 'dark')
  } catch (e) {}
})();
`
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await initDatabaseConnection()

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script
          id="theme-script"
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />
      </head>

      <body>
        <Providers>
          <div className="min-h-screen min-w-screen overflow-hidden bg-[#f7f8fa]">
            <AppHeader />
            <div className="flex h-screen flex-row overflow-hidden pt-16">
              <Sidebar />
              <div className="overflow-hidden grow min-w-0">
                {children}
              </div>
            </div>
          </div>
        </Providers>

      </body>
    </html>
  )
}
