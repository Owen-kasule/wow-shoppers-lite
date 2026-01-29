BEGIN;

TRUNCATE TABLE products;
TRUNCATE TABLE categories;

-- Keep IDs stable so products can reference categories.
INSERT INTO categories (id, name) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Fresh Produce'),
  ('22222222-2222-2222-2222-222222222222', 'Dairy & Eggs'),
  ('33333333-3333-3333-3333-333333333333', 'Bakery'),
  ('44444444-4444-4444-4444-444444444444', 'Meat & Fish'),
  ('55555555-5555-5555-5555-555555555555', 'Beverages'),
  ('66666666-6666-6666-6666-666666666666', 'Pantry Staples'),
  ('77777777-7777-7777-7777-777777777777', 'Snacks'),
  ('88888888-8888-8888-8888-888888888888', 'Household & Cleaning')
;

INSERT INTO products (
  category_id, name, description, price, in_stock, stock_qty, image_url
) VALUES
  -- Fresh Produce
  ('11111111-1111-1111-1111-111111111111', 'Matooke (1 bunch)', 'Fresh cooking bananas (matooke).', 18000.00, true, 12, NULL),
  ('11111111-1111-1111-1111-111111111111', 'Tomatoes (1 kg)', 'Ripe local tomatoes.', 4500.00, true, 25, NULL),
  ('11111111-1111-1111-1111-111111111111', 'Onions (1 kg)', 'Red onions.', 5000.00, true, 18, NULL),
  ('11111111-1111-1111-1111-111111111111', 'Cabbage (1 pc)', 'Green cabbage.', 2500.00, true, 9, NULL),
  ('11111111-1111-1111-1111-111111111111', 'Avocado (1 pc)', 'Large Hass avocado.', 2000.00, false, 0, NULL),

  -- Dairy & Eggs
  ('22222222-2222-2222-2222-222222222222', 'Fresh Milk (1 L)', 'Pasteurized milk 1 litre.', 4200.00, true, 30, NULL),
  ('22222222-2222-2222-2222-222222222222', 'Yoghurt (500 ml)', 'Vanilla yoghurt 500ml.', 3500.00, true, 14, NULL),
  ('22222222-2222-2222-2222-222222222222', 'Eggs (tray of 30)', 'Grade A eggs.', 15000.00, true, 6, NULL),
  ('22222222-2222-2222-2222-222222222222', 'Butter (250 g)', 'Salted butter.', 9000.00, false, 0, NULL),

  -- Bakery
  ('33333333-3333-3333-3333-333333333333', 'Bread (white loaf)', 'Soft white bread.', 3500.00, true, 22, NULL),
  ('33333333-3333-3333-3333-333333333333', 'Bread (brown loaf)', 'Whole wheat bread.', 4000.00, true, 15, NULL),
  ('33333333-3333-3333-3333-333333333333', 'Mandazi (pack)', 'Sweet mandazi pack.', 3000.00, true, 10, NULL),
  ('33333333-3333-3333-3333-333333333333', 'Cake Slice (chocolate)', 'Single chocolate cake slice.', 5000.00, true, 8, NULL),

  -- Meat & Fish
  ('44444444-4444-4444-4444-444444444444', 'Chicken (whole)', 'Whole dressed chicken.', 22000.00, true, 7, NULL),
  ('44444444-4444-4444-4444-444444444444', 'Beef (1 kg)', 'Fresh beef cuts.', 28000.00, true, 5, NULL),
  ('44444444-4444-4444-4444-444444444444', 'Tilapia (1 kg)', 'Fresh tilapia.', 20000.00, false, 0, NULL),
  ('44444444-4444-4444-4444-444444444444', 'Sausages (500 g)', 'Chicken sausages.', 12000.00, true, 11, NULL),

  -- Beverages
  ('55555555-5555-5555-5555-555555555555', 'Bottled Water (500 ml)', 'Still water 500ml.', 1000.00, true, 60, NULL),
  ('55555555-5555-5555-5555-555555555555', 'Soda (Coke 500 ml)', 'Coca-Cola 500ml.', 2000.00, true, 40, NULL),
  ('55555555-5555-5555-5555-555555555555', 'Juice (Mango 1 L)', 'Mango juice 1 litre.', 8500.00, true, 16, NULL),
  ('55555555-5555-5555-5555-555555555555', 'Tea Leaves (250 g)', 'Black tea leaves.', 6500.00, true, 20, NULL),

  -- Pantry Staples
  ('66666666-6666-6666-6666-666666666666', 'Rice (5 kg)', 'White rice 5kg bag.', 23000.00, true, 9, NULL),
  ('66666666-6666-6666-6666-666666666666', 'Sugar (2 kg)', 'Granulated sugar 2kg.', 9000.00, true, 13, NULL),
  ('66666666-6666-6666-6666-666666666666', 'Salt (1 kg)', 'Iodized salt.', 2000.00, true, 33, NULL),
  ('66666666-6666-6666-6666-666666666666', 'Cooking Oil (3 L)', 'Vegetable cooking oil 3L.', 32000.00, true, 8, NULL),
  ('66666666-6666-6666-6666-666666666666', 'Beans (1 kg)', 'Dry beans.', 6000.00, true, 0, NULL),
  ('66666666-6666-6666-6666-666666666666', 'Maize Flour (2 kg)', 'Posho flour 2kg.', 7000.00, true, 17, NULL),

  -- Snacks
  ('77777777-7777-7777-7777-777777777777', 'Biscuits (family pack)', 'Assorted biscuits.', 6500.00, true, 19, NULL),
  ('77777777-7777-7777-7777-777777777777', 'Crisps (large)', 'Potato crisps.', 5500.00, true, 12, NULL),
  ('77777777-7777-7777-7777-777777777777', 'Roasted Groundnuts (200 g)', 'Salted groundnuts.', 4000.00, false, 0, NULL),
  ('77777777-7777-7777-7777-777777777777', 'Chocolate Bar', 'Milk chocolate bar.', 3000.00, true, 25, NULL),

  -- Household & Cleaning
  ('88888888-8888-8888-8888-888888888888', 'Laundry Soap (bar)', 'Multipurpose laundry soap.', 2500.00, true, 28, NULL),
  ('88888888-8888-8888-8888-888888888888', 'Washing Powder (1 kg)', 'Detergent powder 1kg.', 12000.00, true, 10, NULL),
  ('88888888-8888-8888-8888-888888888888', 'Toilet Paper (4 rolls)', 'Soft toilet tissue 4-pack.', 6000.00, true, 21, NULL),
  ('88888888-8888-8888-8888-888888888888', 'Dishwashing Liquid (500 ml)', 'Lemon dishwashing liquid.', 7000.00, true, 6, NULL);

COMMIT;
