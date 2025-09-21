import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import Image from "next/image"

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect("/auth/login")
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

  if (error || !order) {
    notFound()
  }

  const isBuyer = order.buyer_id === user.id
  const isFarmer = order.farmer_id === user.id

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500"
      case "confirmed":
        return "bg-blue-500"
      case "shipped":
        return "bg-purple-500"
      case "delivered":
        return "bg-green-500"
      case "cancelled":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/orders" className="text-2xl font-bold text-primary">
            AgroDirect
          </Link>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/orders">Back to Orders</Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl">Order #{order.id.slice(0, 8)}</CardTitle>
                    <CardDescription>Placed on {new Date(order.created_at).toLocaleDateString()}</CardDescription>
                  </div>
                  <Badge className={getStatusColor(order.status)}>{order.status.toUpperCase()}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">{isBuyer ? "Farmer" : "Buyer"} Information</h4>
                    {isBuyer ? (
                      <div className="space-y-1">
                        <p className="font-medium">{order.farmer?.farmer_profiles?.farm_name}</p>
                        <p>{order.farmer?.full_name}</p>
                        <p className="text-sm text-muted-foreground">{order.farmer?.phone}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.farmer?.city}, {order.farmer?.state}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="font-medium">{order.buyer?.full_name}</p>
                        <p className="text-sm text-muted-foreground">{order.buyer?.phone}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.buyer?.city}, {order.buyer?.state}
                        </p>
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Delivery Information</h4>
                    <p className="text-sm">{order.delivery_address}</p>
                    {order.delivery_date && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Expected: {new Date(order.delivery_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.order_items?.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      {item.products?.images?.[0] && (
                        <div className="w-16 h-16 relative rounded overflow-hidden">
                          <Image
                            src={item.products.images[0] || "/placeholder.svg"}
                            alt={item.products.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="font-medium">{item.products?.name}</h4>
                        <p className="text-sm text-muted-foreground">{item.products?.description}</p>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-sm">
                            {item.quantity} {item.products?.unit} × ₹{item.unit_price}
                          </span>
                          <span className="font-medium">₹{item.total_price}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {order.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Order Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{order.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{order.total_amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery</span>
                    <span>Free</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>₹{order.total_amount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge
                  variant="outline"
                  className={order.payment_status === "paid" ? "border-green-500 text-green-700" : ""}
                >
                  {order.payment_status.toUpperCase()}
                </Badge>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              {isFarmer && order.status === "pending" && <Button className="w-full">Confirm Order</Button>}
              {isFarmer && order.status === "confirmed" && <Button className="w-full">Mark as Shipped</Button>}
              {isBuyer && order.status === "shipped" && <Button className="w-full">Confirm Delivery</Button>}
              <Button variant="outline" className="w-full bg-transparent" asChild>
                <Link href={`/messages?contact=${isBuyer ? order.farmer_id : order.buyer_id}&order=${order.id}`}>
                  Contact {isBuyer ? "Farmer" : "Buyer"}
                </Link>
              </Button>
              {order.status === "delivered" && (
                <Button variant="outline" className="w-full bg-transparent">
                  Leave Review
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
