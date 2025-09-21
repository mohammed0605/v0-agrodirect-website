-- Seed data for AgroDirect Marketplace

-- Insert sample categories
INSERT INTO public.categories (name, description) VALUES
  ('Vegetables', 'Fresh vegetables and leafy greens'),
  ('Fruits', 'Seasonal and exotic fruits'),
  ('Grains', 'Rice, wheat, and other cereals'),
  ('Pulses', 'Lentils, beans, and legumes'),
  ('Spices', 'Fresh and dried spices'),
  ('Dairy', 'Milk, cheese, and dairy products'),
  ('Organic', 'Certified organic produce')
ON CONFLICT (name) DO NOTHING;
