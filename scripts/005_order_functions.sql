-- Function to update product quantity when order is placed
CREATE OR REPLACE FUNCTION update_product_quantity(product_id UUID, quantity_sold DECIMAL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.products 
  SET 
    quantity_available = quantity_available - quantity_sold,
    status = CASE 
      WHEN quantity_available - quantity_sold <= 0 THEN 'sold_out'
      ELSE status
    END
  WHERE id = product_id;
END;
$$;
