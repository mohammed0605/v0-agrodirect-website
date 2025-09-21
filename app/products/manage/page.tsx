import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Image from "next/image"

export default async function ManageProductsPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect("/auth/login")
  }

  // Check if user is a farmer
  const { data: profile } = await supabase.from("profiles").select("user_type").eq("id", user.id).single()

  if (profile?.user_type !== "farmer") {
    redirect("/dashboard")
  }

  const { data: products } = await supabase
    .from("products")
    .select(`
      *,
      categories(name)
    `)
    .eq("farmer_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="text-2xl font-bold text-primary">
            AgroDirect
          </Link>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/products/manage/new">Add New Product</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Manage Products</h1>
          <p className="text-muted-foreground">Add, edit, and manage your product listings</p>
        </div>

        {products && products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                <div className="aspect-video relative bg-muted">
                  {product.images && product.images[0] ? (
                    <Image
                      src={product.images[0] || "/placeholder.svg"}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <span className="text-muted-foreground">No image</span>
                    </div>
                  )}
                  <Badge
                    className={`absolute top-2 right-2 ${
                      product.status === "available"
                        ? "bg-green-500"
                        : product.status === "sold_out"
                          ? "bg-red-500"
                          : "bg-gray-500"
                    }`}
                  >
                    {product.status.replace("_", " ").toUpperCase()}
                  </Badge>
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  <CardDescription>{product.categories?.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-primary">
                        ₹{product.price_per_unit}/{product.unit}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {product.quantity_available} {product.unit} left
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button asChild size="sm" className="flex-1">
                        <Link href={`/products/manage/${product.id}/edit`}>Edit</Link>
                      </Button>
                      <Button asChild size="sm" variant="outline" className="flex-1 bg-transparent">
                        <Link href={`/products/${product.id}`}>View</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <h3 className="text-xl font-semibold mb-2">No products yet</h3>
              <p className="text-muted-foreground mb-4">Start by adding your first product to the marketplace</p>
              <Button asChild>
                <Link href="/products/manage/new">Add Your First Product</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
