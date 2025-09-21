import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const category = searchParams.get("category")
  const search = searchParams.get("search")
  const farmerId = searchParams.get("farmer_id")

  try {
    let query = supabase
      .from("products")
      .select(`
        *,
        categories(name),
        profiles!farmer_id(full_name, farmer_profiles(farm_name))
      `)
      .eq("status", "available")

    if (category) {
      query = query.eq("category_id", category)
    }

    if (search) {
      query = query.ilike("name", `%${search}%`)
    }

    if (farmerId) {
      query = query.eq("farmer_id", farmerId)
    }

    const { data: products, error } = await query.order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ products })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
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
    const {
      name,
      description,
      price_per_unit,
      unit,
      quantity_available,
      category_id,
      harvest_date,
      expiry_date,
      is_organic,
      images,
      location,
    } = body

    const { data: product, error } = await supabase
      .from("products")
      .insert({
        farmer_id: user.id,
        name,
        description,
        price_per_unit,
        unit,
        quantity_available,
        category_id,
        harvest_date,
        expiry_date,
        is_organic,
        images,
        location,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ product })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 })
  }
}
