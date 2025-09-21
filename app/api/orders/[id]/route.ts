import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: order, error } = await supabase
      .from("orders")
      .select(`
        *,
        buyer:profiles!buyer_id(full_name, phone, address, city, state),
        farmer:profiles!farmer_id(full_name, phone, address, city, state, farmer_profiles(farm_name)),
        order_items(
          *,
          products(name, price_per_unit, unit, images, description)
        )
      `)
      .eq("id", params.id)
      .or(`buyer_id.eq.${user.id},farmer_id.eq.${user.id}`)
      .single()

    if (error) throw error

    return NextResponse.json({ order })
  } catch (error) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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
    const { status, payment_status, delivery_date } = body

    const { data: order, error } = await supabase
      .from("orders")
      .update({
        status,
        payment_status,
        delivery_date,
      })
      .eq("id", params.id)
      .or(`buyer_id.eq.${user.id},farmer_id.eq.${user.id}`)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ order })
  } catch (error) {
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 })
  }
}
