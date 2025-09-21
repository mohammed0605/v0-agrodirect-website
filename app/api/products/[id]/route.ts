import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()

  try {
    const { data: product, error } = await supabase
      .from("products")
      .select(`
        *,
        categories(name),
        profiles!farmer_id(full_name, phone, city, state, farmer_profiles(farm_name, farm_size_acres, organic_certified))
      `)
      .eq("id", params.id)
      .single()

    if (error) throw error

    return NextResponse.json({ product })
  } catch (error) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 })
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

    const { data: product, error } = await supabase
      .from("products")
      .update(body)
      .eq("id", params.id)
      .eq("farmer_id", user.id) // Ensure farmer can only update their own products
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ product })
  } catch (error) {
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { error } = await supabase.from("products").delete().eq("id", params.id).eq("farmer_id", user.id) // Ensure farmer can only delete their own products

    if (error) throw error

    return NextResponse.json({ message: "Product deleted successfully" })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 })
  }
}
