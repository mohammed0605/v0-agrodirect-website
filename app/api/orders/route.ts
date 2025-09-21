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

    const userType = searchParams.get("type") // 'buyer' or 'farmer'

    let query = supabase.from("orders").select(`
        *,
        buyer:profiles!buyer_id(full_name, phone, city, state),
        farmer:profiles!farmer_id(full_name, phone, city, state, farmer_profiles(farm_name)),
        order_items(
          *,
          products(name, price_per_unit, unit, images)
        )
      `)

    if (userType === "buyer") {
      query = query.eq("buyer_id", user.id)
    } else if (userType === "farmer") {
      query = query.eq("farmer_id", user.id)
    } else {
      // Return orders where user is either buyer or farmer
      query = query.or(`buyer_id.eq.${user.id},farmer_id.eq.${user.id}`)
    }

    const { data: orders, error } = await query.order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ orders })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
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
    const { farmer_id, items, delivery_address, notes } = body

    // Calculate total amount
    let total_amount = 0
    for (const item of items) {
      total_amount += item.quantity * item.unit_price
    }

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        buyer_id: user.id,
        farmer_id,
        total_amount,
        delivery_address,
        notes,
      })
      .select()
      .single()

    if (orderError) throw orderError

    // Create order items
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.quantity * item.unit_price,
    }))

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

    if (itemsError) throw itemsError

    // Update product quantities
    for (const item of items) {
      const { error: updateError } = await supabase.rpc("update_product_quantity", {
        product_id: item.product_id,
        quantity_sold: item.quantity,
      })
      if (updateError) console.error("Failed to update product quantity:", updateError)
    }

    return NextResponse.json({ order })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
  }
}
