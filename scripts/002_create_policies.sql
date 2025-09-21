-- Row Level Security Policies for AgroDirect Marketplace

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view other profiles for marketplace" ON public.profiles
  FOR SELECT USING (true); -- Allow viewing other profiles for marketplace functionality

-- Farmer profiles policies
CREATE POLICY "Farmers can manage their own profile" ON public.farmer_profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Anyone can view farmer profiles" ON public.farmer_profiles
  FOR SELECT USING (true);

-- Categories policies (public read, admin write)
CREATE POLICY "Anyone can view categories" ON public.categories
  FOR SELECT USING (true);

-- Products policies
CREATE POLICY "Farmers can manage their own products" ON public.products
  FOR ALL USING (auth.uid() = farmer_id);

CREATE POLICY "Anyone can view available products" ON public.products
  FOR SELECT USING (status = 'available');

-- Orders policies
CREATE POLICY "Users can view their own orders as buyer" ON public.orders
  FOR SELECT USING (auth.uid() = buyer_id);

CREATE POLICY "Users can view their own orders as farmer" ON public.orders
  FOR SELECT USING (auth.uid() = farmer_id);

CREATE POLICY "Buyers can create orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Farmers can update order status" ON public.orders
  FOR UPDATE USING (auth.uid() = farmer_id);

-- Order items policies
CREATE POLICY "Users can view order items for their orders" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND (orders.buyer_id = auth.uid() OR orders.farmer_id = auth.uid())
    )
  );

CREATE POLICY "Buyers can create order items" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND orders.buyer_id = auth.uid()
    )
  );

-- Messages policies
CREATE POLICY "Users can view their own messages" ON public.messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their received messages" ON public.messages
  FOR UPDATE USING (auth.uid() = receiver_id);

-- Reviews policies
CREATE POLICY "Anyone can view reviews" ON public.reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create reviews for their orders" ON public.reviews
  FOR INSERT WITH CHECK (
    auth.uid() = reviewer_id AND
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = reviews.order_id 
      AND (orders.buyer_id = auth.uid() OR orders.farmer_id = auth.uid())
    )
  );
