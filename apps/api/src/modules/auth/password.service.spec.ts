import { PasswordService } from './password.service';

describe('PasswordService', () => {
  const passwords = new PasswordService();

  it('stores a one-way Argon2id hash and verifies only the original password', async () => {
    const plaintext = 'correct horse battery staple';
    const passwordHash = await passwords.hash(plaintext);

    expect(passwordHash).toMatch(/^\$argon2id\$/);
    expect(passwordHash).not.toContain(plaintext);
    await expect(passwords.matches(plaintext, passwordHash)).resolves.toBe(
      true,
    );
    await expect(
      passwords.matches('incorrect password', passwordHash),
    ).resolves.toBe(false);
  });
});
