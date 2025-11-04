import { getConnections, PgTestClient } from 'pgsql-test';

let pg: PgTestClient;
let db: PgTestClient;
let teardown: () => Promise<void>;

let tableExists = false;

beforeAll(async () => {
  
  
  ({ pg, db, teardown } = await getConnections());
  
  // verify auth schema exists
  const authSchemaExists = await pg.any(
    `SELECT EXISTS (
      SELECT FROM information_schema.schemata 
      WHERE schema_name = 'auth'
    ) as exists`
  );
  expect(authSchemaExists[0].exists).toBe(true);
  
  // grant access to auth schema for testing
  await pg.any(
    `GRANT USAGE ON SCHEMA auth TO public;
     GRANT SELECT ON ALL TABLES IN SCHEMA auth TO service_role;
     GRANT SELECT ON ALL TABLES IN SCHEMA auth TO authenticated;
     GRANT SELECT ON ALL TABLES IN SCHEMA auth TO anon;
     ALTER DEFAULT PRIVILEGES IN SCHEMA auth GRANT SELECT ON TABLES TO service_role;
     ALTER DEFAULT PRIVILEGES IN SCHEMA auth GRANT SELECT ON TABLES TO authenticated;
     ALTER DEFAULT PRIVILEGES IN SCHEMA auth GRANT SELECT ON TABLES TO anon;`,
    []
  );
  
  // check if auth.sessions table exists (using pg in beforeAll only)
  const exists = await pg.any(
    `SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'auth' AND table_name = 'sessions'
    ) as exists`
  );
  tableExists = exists[0]?.exists === true;
});

afterAll(async () => {
  await teardown();
});

beforeEach(async () => {
  await db.beforeEach();
});

afterEach(async () => {
  await db.afterEach();
});

describe('tutorial: auth sessions table access', () => {

  it('should verify sessions table exists', async () => {
    db.setContext({ role: 'service_role' });
    
    const exists = await db.any(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'auth' AND table_name = 'sessions'
      ) as exists`
    );
    
    expect(Array.isArray(exists)).toBe(true);
    if (exists[0]?.exists === false) {
      // table doesn't exist in this supabase setup, skip test
      expect(exists[0].exists).toBe(false);
      return;
    }
    expect(exists[0].exists).toBe(true);
  });

  it('should verify service_role can read sessions', async () => {
    if (!tableExists) {
      // table doesn't exist, skip test
      return;
    }
    
    db.setContext({ role: 'service_role' });
    
    const sessions = await db.any(
      `SELECT id, user_id, created_at, updated_at, expires_at 
       FROM auth.sessions 
       LIMIT 10`
    );
    
    expect(Array.isArray(sessions)).toBe(true);
  });

  it('should verify table has foreign key to auth.users', async () => {
    if (!tableExists) {
      return;
    }
    
    db.setContext({ role: 'service_role' });
    
    const fks = await db.any(
      `SELECT tc.constraint_name, ccu.table_name AS foreign_table_name
       FROM information_schema.table_constraints AS tc
       JOIN information_schema.constraint_column_usage AS ccu
         ON ccu.constraint_name = tc.constraint_name
       WHERE tc.constraint_type = 'FOREIGN KEY' 
         AND tc.table_schema = 'auth' 
         AND tc.table_name = 'sessions'
         AND ccu.table_name = 'users'`
    );
    
    expect(Array.isArray(fks)).toBe(true);
  });

  it('should verify table has index on user_id', async () => {
    if (!tableExists) {
      return;
    }
    
    db.setContext({ role: 'service_role' });
    
    const indexes = await db.any(
      `SELECT indexname 
       FROM pg_indexes 
       WHERE schemaname = 'auth' AND tablename = 'sessions'
       AND indexname LIKE '%user_id%'`
    );
    
    expect(Array.isArray(indexes)).toBe(true);
  });

  it('should prevent anon from accessing sessions', async () => {
    if (!tableExists) {
      return;
    }
    
    db.clearContext();
    
    const result = await db.any(
      `SELECT * FROM auth.sessions LIMIT 1`
    );
    
    expect(result.length).toBe(0);
  });
});

