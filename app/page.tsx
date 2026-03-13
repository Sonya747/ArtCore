"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "@/store/theme"

export default function Page() {
    const router = useRouter()
    const { theme } = useTheme()

    useEffect(() => {
        router.replace("/image-gen")
    }, [router])

    useEffect(() => {
        console.log("theme", theme)
    }, [theme])


    return <div>home</div>
}