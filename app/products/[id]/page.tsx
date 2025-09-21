import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: product, error } = await supabase
    .from("products")
    .select(`
      *,
      categories(name),
      profiles!farmer_id(id, full_name, phone, city, state, farmer_profiles(farm_name, farm_size_acres, organic_certified))
    `)
    .eq("id", params.id)
    .single()

  if (error || !product) {
    notFound()
  }

  const farmer = product.profiles
  const farmProfile = farmer?.farmer_profiles

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/products" className="text-2xl font-bold text-primary">
            AgroDirect
          </Link>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/products">Back to Products</Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square relative bg-muted rounded-lg overflow-hidden">
              {product.images && product.images[0] ? (
                <Image src={product.images[0] || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <span className="text-muted-foreground">No image available</span>
                </div>
              )}
              {product.is_organic && <Badge className="absolute top-4 right-4 bg-green-500">Organic Certified</Badge>}
            </div>
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.slice(1, 5).map((image, index) => (
                  <div key={index} className="aspect-square relative bg-muted rounded overflow-hidden">
                    <Image
                      src={image || "/placeholder.svg"}
                      alt={`${product.name} ${index + 2}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="secondary">{product.categories?.name}</Badge>
                {product.is_organic && <Badge className="bg-green-500">Organic</Badge>}
              </div>
              <p className="text-4xl font-bold text-primary mb-4">
                ₹{product.price_per_unit} <span className="text-lg font-normal">per {product.unit}</span>
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground">{product.description || "No description available."}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium">Available Quantity</h4>
                  <p className="text-muted-foreground">
                    {product.quantity_available} {product.unit}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">Location</h4>
                  <p className="text-muted-foreground">{product.location || `${farmer?.city}, ${farmer?.state}`}</p>
                </div>
                {product.harvest_date && (
                  <div>
                    <h4 className="font-medium">Harvest Date</h4>
                    <p className="text-muted-foreground">{new Date(product.harvest_date).toLocaleDateString()}</p>
                  </div>
                )}
                {product.expiry_date && (
                  <div>
                    <h4 className="font-medium">Best Before</h4>
                    <p className="text-muted-foreground">{new Date(product.expiry_date).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Farmer Information */}
            <Card>
              <CardHeader>
                <CardTitle>About the Farmer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p>
                    <strong>Farm:</strong> {farmProfile?.farm_name}
                  </p>
                  <p>
                    <strong>Farmer:</strong> {farmer?.full_name}
                  </p>
                  <p>
                    <strong>Location:</strong> {farmer?.city}, {farmer?.state}
                  </p>
                  {farmProfile?.farm_size_acres && (
                    <p>
                      <strong>Farm Size:</strong> {farmProfile.farm_size_acres} acres
                    </p>
                  )}
                  {farmProfile?.organic_certified && <Badge className="bg-green-500">Organic Certified Farm</Badge>}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              {user && user.id !== farmer?.id && (
                <Button size="lg" className="w-full" asChild>
                  <Link href={`/messages?contact=${farmer?.id}&product=${product.id}`}>Contact Farmer</Link>
                </Button>
              )}
              <Button size="lg" variant="outline" className="w-full bg-transparent">
                Add to Cart
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
