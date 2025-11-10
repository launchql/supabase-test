import { getConnections, PgTestClient } from 'supabase-test';
import { insertUser } from '../test-utils';

let db: PgTestClient;
let pg: PgTestClient;
let teardown: () => Promise<void>;

let user1: any;
let user2: any;

beforeAll(async () => {
  ({ pg, db, teardown } = await getConnections());
  user1 = await insertUser(pg, 'tutorial1@example.com');
  user2 = await insertUser(pg, 'tutorial2@example.com');
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

describe('tutorial: basic rls crud operations', () => {
  it('should allow user to create their own user record', async () => {
    // set context to simulate authenticated user
    db.setContext({
      role: 'authenticated',
      'request.jwt.claim.sub': user1.id
    });

    // user can create their own pet
    const pet = await db.one(
      `INSERT INTO rls_test.pets (name, breed, user_id) 
       VALUES ($1, $2, $3) 
       RETURNING id, name, breed, user_id`,
      ['Fido', 'Labrador', user1.id]
    );

    expect(pet.name).toBe('Fido');
    expect(pet.breed).toBe('Labrador');
    expect(pet.user_id).toBe(user1.id);
  });

  it('should prevent user1 from updating user2\'s record', async () => {
    // user2 creates a pet
    db.setContext({
      role: 'authenticated',
      'request.jwt.claim.sub': user2.id
    });

    const pet = await db.one(
      `INSERT INTO rls_test.pets (name, breed, user_id) 
       VALUES ($1, $2, $3) 
       RETURNING id, name, breed, user_id`,
      ['Buddy', 'Golden Retriever', user2.id]
    );

    expect(pet.user_id).toBe(user2.id);

    // user1 tries to update user2's pet - should throw
    db.setContext({
      role: 'authenticated',
      'request.jwt.claim.sub': user1.id
    });

    await expect(
      db.one(
        `UPDATE rls_test.pets 
         SET name = $1 
         WHERE id = $2 
         RETURNING id, name, breed, user_id`,
        ['Hacked Name', pet.id]
      )
    ).rejects.toThrow();
  });
});

