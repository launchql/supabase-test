import { PgTestClient } from "supabase-test";

/**
 * Helper function to insert a new user into auth.users
 * @param client - The PgTestClient to use (pg or db)
 * @param email - The user's email address
 * @param options - Optional additional fields and return options
 * @returns The inserted user object
 */
export async function insertUser(
    client: PgTestClient,
    email: string,
    options?: {
      id?: string;
      returnFields?: string[];
    }
  ): Promise<{ id: string; email: string; [key: string]: any }> {
    const returnFields = options?.returnFields || ['id', 'email'];
    const fields = returnFields.join(', ');
    
    if (options?.id) {
      return await client.one(
        `INSERT INTO auth.users (id, email) 
         VALUES ($1, $2) 
         RETURNING ${fields}`,
        [options.id, email]
      );
    } else {
      return await client.one(
        `INSERT INTO auth.users (id, email) 
         VALUES (gen_random_uuid(), $1) 
         RETURNING ${fields}`,
        [email]
      );
    }
  }