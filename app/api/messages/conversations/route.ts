import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all unique conversations for the user
    const { data: conversations, error } = await supabase.rpc("get_user_conversations", {
      user_id: user.id,
    })

    if (error) throw error

    return NextResponse.json({ conversations })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 })
  }
}
