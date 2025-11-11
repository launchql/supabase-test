-- Verify: rls-demo on pg

-- Verify schema exists
SELECT 1 FROM information_schema.schemata WHERE schema_name = 'rls_test';

-- Verify users table exists with correct structure
SELECT 1 FROM information_schema.tables 
WHERE table_schema = 'rls_test' AND table_name = 'users';

SELECT 1 FROM information_schema.columns 
WHERE table_schema = 'rls_test' AND table_name = 'users' AND column_name = 'id';

SELECT 1 FROM information_schema.columns 
WHERE table_schema = 'rls_test' AND table_name = 'users' AND column_name = 'email';

SELECT 1 FROM information_schema.columns 
WHERE table_schema = 'rls_test' AND table_name = 'users' AND column_name = 'name';

-- Verify products table exists with correct structure
SELECT 1 FROM information_schema.tables 
WHERE table_schema = 'rls_test' AND table_name = 'products';

SELECT 1 FROM information_schema.columns 
WHERE table_schema = 'rls_test' AND table_name = 'products' AND column_name = 'id';

SELECT 1 FROM information_schema.columns 
WHERE table_schema = 'rls_test' AND table_name = 'products' AND column_name = 'owner_id';

SELECT 1 FROM information_schema.columns 
WHERE table_schema = 'rls_test' AND table_name = 'products' AND column_name = 'name';

-- Verify foreign key constraint
SELECT 1 FROM information_schema.table_constraints 
WHERE table_schema = 'rls_test' 
AND table_name = 'products' 
AND constraint_type = 'FOREIGN KEY'
AND constraint_name LIKE '%owner_id%';

-- Verify RLS is enabled
SELECT 1 FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'rls_test' 
AND c.relname = 'users' 
AND c.relrowsecurity = true;

SELECT 1 FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'rls_test' 
AND c.relname = 'products' 
AND c.relrowsecurity = true;

-- Verify policies exist
SELECT 1 FROM pg_policies 
WHERE schemaname = 'rls_test' 
AND tablename = 'users' 
AND policyname = 'Users can view own data';

SELECT 1 FROM pg_policies 
WHERE schemaname = 'rls_test' 
AND tablename = 'products' 
AND policyname = 'Users can view own products';

-- Verify indexes exist
SELECT 1 FROM pg_indexes 
WHERE schemaname = 'rls_test' 
AND tablename = 'products' 
AND indexname = 'idx_products_owner_id';

SELECT 1 FROM pg_indexes 
WHERE schemaname = 'rls_test' 
AND tablename = 'users' 
AND indexname = 'idx_users_email';

-- Verify trigger function exists
SELECT 1 FROM information_schema.routines 
WHERE routine_schema = 'rls_test' 
AND routine_name = 'update_updated_at_column';

-- Verify triggers exist
SELECT 1 FROM information_schema.triggers 
WHERE trigger_schema = 'rls_test' 
AND trigger_name = 'update_users_updated_at';

SELECT 1 FROM information_schema.triggers 
WHERE trigger_schema = 'rls_test' 
AND trigger_name = 'update_products_updated_at';
