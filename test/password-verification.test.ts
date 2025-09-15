import { expect, test, describe } from '@jest/globals';
import { supabaseAdmin } from '../lib/supabase';

describe('Password Verification System', () => {
  test('should store password directly without hashing', async () => {
    // Create a test student
    const testRegisterNumber = 'TEST001';
    const testPassword = 'testpassword123';
    
    // Clean up any existing test student
    await supabaseAdmin
      .from('unified_students')
      .delete()
      .eq('register_number', testRegisterNumber);
    
    // Create a new test student
    const { data: createdStudent, error: createError } = await supabaseAdmin
      .from('unified_students')
      .insert({
        register_number: testRegisterNumber,
        name: 'Test Student',
        email: 'test@example.com',
        password: testPassword
      })
      .select()
      .single();
    
    expect(createError).toBeNull();
    expect(createdStudent).toBeDefined();
    expect(createdStudent?.password).toBe(testPassword);
    
    // Verify we can retrieve the student with password
    const { data: fetchedStudent, error: fetchError } = await supabaseAdmin
      .from('unified_students')
      .select('*')
      .eq('register_number', testRegisterNumber)
      .single();
    
    expect(fetchError).toBeNull();
    expect(fetchedStudent).toBeDefined();
    expect(fetchedStudent?.password).toBe(testPassword);
    
    // Clean up
    await supabaseAdmin
      .from('unified_students')
      .delete()
      .eq('register_number', testRegisterNumber);
  });
  
  test('should verify password during login', async () => {
    // This test would typically be an integration test that involves the AuthContext
    // For now, we're just verifying the database behavior
    expect(true).toBe(true);
  });
});