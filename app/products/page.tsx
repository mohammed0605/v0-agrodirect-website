import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Image from "next/image"

export default async function ProductsPage() {
  const supabase = await createClient()

  const { data: products } = await supabase
    .from("products")
    .select(`
      *,
      categories(name),
      profiles!farmer_id(full_name, city, state, farmer_profiles(farm_name))
    `)
    .eq("status", "available")
    .order("created_at", { ascending: false })

  const { data: categories } = await supabase.from("categories").select("*").order("name")

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="text-2xl font-bold text-primary">
            AgroDirect
          </Link>
          <Button asChild>
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Fresh Produce Marketplace</h1>
          <p className="text-muted-foreground">Discover fresh, quality produce directly from local farmers</p>
        </div>

        {/* Categories */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Categories</h2>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="cursor-pointer">
              All Products
            </Badge>
            {categories?.map((category) => (
              <Badge key={category.id} variant="outline" className="cursor-pointer">
                {category.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products?.map((product) => (
            <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-square relative bg-muted">
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
                {product.is_organic && <Badge className="absolute top-2 right-2 bg-green-500">Organic</Badge>}
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{product.name}</CardTitle>
                <CardDescription className="text-sm">
                  by {product.profiles?.farmer_profiles?.farm_name || product.profiles?.full_name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-primary">
                      ₹{product.price_per_unit}/{product.unit}
                    </span>
                    <Badge variant="secondary">{product.categories?.name}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Available: {product.quantity_available} {product.unit}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    📍 {product.profiles?.city}, {product.profiles?.state}
                  </p>
                  <Button asChild className="w-full">
                    <Link href={`/products/${product.id}`}>View Details</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {!products ||
          (products.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No products available at the moment.</p>
            </div>
          ))}
      </main>
    </div>
  )
}
