import { getConnections, PgTestClient, seed } from 'supabase-test';
import path from 'path';
import { users } from './data/seed-data';

let db: PgTestClient;
let teardown: () => Promise<void>;

const sql = (f: string) => path.join(__dirname, 'data', f);

const cwd = path.resolve(__dirname, '../../');

beforeAll(async () => {
  ({ db, teardown } = await getConnections(
    {}, [
    seed.launchql(cwd),
    seed.sqlfile([
      sql('seed-data.sql'),
    ])
  ]
  ));
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

describe('tutorial: testing with sql file seeding', () => {
  it('should work with sql file seed function', async () => {

    db.setContext({
      role: 'authenticated',
      'request.jwt.claim.sub': users[0].id
    });

    const verifiedPets = await db.any(
      `SELECT id FROM rls_test.pets WHERE user_id = $1`,
      [users[0].id]
    );
    expect(verifiedPets.length).toBe(1);

    db.clearContext();

    const anonPets = await db.any(
      `SELECT id FROM rls_test.pets WHERE user_id = $1`,
      [users[0].id]
    );
    expect(anonPets.length).toBe(0);

  });

});

