import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import Image from "next/image"

export default async function OrdersPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect("/auth/login")
  }

  // Get user profile to determine user type
  const { data: profile } = await supabase.from("profiles").select("user_type").eq("id", user.id).single()

  // Get orders as buyer
  const { data: buyerOrders } = await supabase
    .from("orders")
    .select(`
      *,
      farmer:profiles!farmer_id(full_name, farmer_profiles(farm_name)),
      order_items(
        *,
        products(name, images, unit)
      )
    `)
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false })

  // Get orders as farmer (if user is a farmer)
  const { data: farmerOrders } =
    profile?.user_type === "farmer"
      ? await supabase
          .from("orders")
          .select(`
          *,
          buyer:profiles!buyer_id(full_name, city, state),
          order_items(
            *,
            products(name, images, unit)
          )
        `)
          .eq("farmer_id", user.id)
          .order("created_at", { ascending: false })
      : { data: null }

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

  const OrderCard = ({ order, type }: { order: any; type: "buyer" | "farmer" }) => (
    <Card key={order.id} className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">Order #{order.id.slice(0, 8)}</CardTitle>
            <CardDescription>
              {type === "buyer"
                ? `From ${order.farmer?.farmer_profiles?.farm_name || order.farmer?.full_name}`
                : `To ${order.buyer?.full_name} (${order.buyer?.city}, ${order.buyer?.state})`}
            </CardDescription>
          </div>
          <div className="text-right">
            <Badge className={getStatusColor(order.status)}>{order.status.toUpperCase()}</Badge>
            <p className="text-sm text-muted-foreground mt-1">{new Date(order.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-2xl font-bold text-primary">₹{order.total_amount}</span>
            <Badge variant="outline" className={order.payment_status === "paid" ? "border-green-500" : ""}>
              Payment: {order.payment_status}
            </Badge>
          </div>

          {/* Order Items */}
          <div className="space-y-2">
            <h4 className="font-medium">Items:</h4>
            {order.order_items?.map((item: any) => (
              <div key={item.id} className="flex items-center gap-3 p-2 bg-muted rounded">
                {item.products?.images?.[0] && (
                  <div className="w-12 h-12 relative rounded overflow-hidden">
                    <Image
                      src={item.products.images[0] || "/placeholder.svg"}
                      alt={item.products.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-medium">{item.products?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.quantity} {item.products?.unit} × ₹{item.unit_price} = ₹{item.total_price}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button asChild size="sm" className="flex-1">
              <Link href={`/orders/${order.id}`}>View Details</Link>
            </Button>
            {type === "farmer" && order.status === "pending" && (
              <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                Update Status
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="text-2xl font-bold text-primary">
            AgroDirect
          </Link>
          <Button variant="outline" asChild>
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Orders</h1>
          <p className="text-muted-foreground">Track and manage your orders</p>
        </div>

        <Tabs defaultValue="purchases" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="purchases">My Purchases</TabsTrigger>
            {profile?.user_type === "farmer" && <TabsTrigger value="sales">My Sales</TabsTrigger>}
          </TabsList>

          <TabsContent value="purchases" className="mt-6">
            {buyerOrders && buyerOrders.length > 0 ? (
              <div>
                {buyerOrders.map((order) => (
                  <OrderCard key={order.id} order={order} type="buyer" />
                ))}
              </div>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <h3 className="text-xl font-semibold mb-2">No purchases yet</h3>
                  <p className="text-muted-foreground mb-4">Start shopping for fresh produce from local farmers</p>
                  <Button asChild>
                    <Link href="/products">Browse Products</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {profile?.user_type === "farmer" && (
            <TabsContent value="sales" className="mt-6">
              {farmerOrders && farmerOrders.length > 0 ? (
                <div>
                  {farmerOrders.map((order) => (
                    <OrderCard key={order.id} order={order} type="farmer" />
                  ))}
                </div>
              ) : (
                <Card className="text-center py-12">
                  <CardContent>
                    <h3 className="text-xl font-semibold mb-2">No sales yet</h3>
                    <p className="text-muted-foreground mb-4">Add products to start receiving orders</p>
                    <Button asChild>
                      <Link href="/products/manage">Manage Products</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  )
}
