import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { getAssetsPrisma } from "@/lib/prisma-assets-db"

export async function GET() {
  try {
    const authUser = await getAuthUser()
    if (!authUser?.userId) {
      return NextResponse.json({ error: "未登录" }, { status: 401 })
    }

    const prisma = getAssetsPrisma()
    const rows = await prisma.generationTask.findMany({
      where: {
        user_id: authUser.userId,
        status: "success",
      },
      include: {
        generated_images: {
          orderBy: [{ sort_order: "asc" }, { created_at: "asc" }],
        },
      },
      orderBy: { created_at: "desc" },
    })

    const results = rows.map((task) => ({
      id: task.id,
      prompt: task.final_prompt || task.raw_prompt,
      created_at: task.created_at.toISOString(),
      images: task.generated_images.map((img) => img.image_url),
    }))

    return NextResponse.json({ results })
  } catch (error) {
    console.error("[api/production GET]", error)
    const message = error instanceof Error ? error.message : "查询作品失败"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
