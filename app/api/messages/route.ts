import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const conversationWith = searchParams.get("with")
    const orderId = searchParams.get("order_id")

    let query = supabase
      .from("messages")
      .select(`
        *,
        sender:profiles!sender_id(full_name, user_type, farmer_profiles(farm_name)),
        receiver:profiles!receiver_id(full_name, user_type, farmer_profiles(farm_name))
      `)
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)

    if (conversationWith) {
      query = query.or(`sender_id.eq.${conversationWith},receiver_id.eq.${conversationWith}`)
    }

    if (orderId) {
      query = query.eq("order_id", orderId)
    }

    const { data: messages, error } = await query.order("created_at", { ascending: true })

    if (error) throw error

    return NextResponse.json({ messages })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { receiver_id, message, order_id } = body

    const { data: newMessage, error } = await supabase
      .from("messages")
      .insert({
        sender_id: user.id,
        receiver_id,
        message,
        order_id,
      })
      .select(`
        *,
        sender:profiles!sender_id(full_name, user_type, farmer_profiles(farm_name)),
        receiver:profiles!receiver_id(full_name, user_type, farmer_profiles(farm_name))
      `)
      .single()

    if (error) throw error

    return NextResponse.json({ message: newMessage })
  } catch (error) {
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}
