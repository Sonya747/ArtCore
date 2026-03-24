import Providers from "./providers"
import Sidebar from "@/components/sidebar"
import { initDatabaseConnection } from '@/service/db/init'
import './globals.css'
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

      <body className="">
        <Providers>

          <div className="min-h-screen min-w-screen flex flex-row overflow-hidden">
            <Sidebar />
            <div className="overflow-hidden grow min-w-0">
              {children}
            </div>
          </div>        </Providers>

      </body>
    </html>
  )
}
