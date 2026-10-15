import { describe, expect, test } from 'bun:test';
import { parseBootstrapConfig } from './parse-bootstrap-config';

describe('parseBootstrapConfig', () => {
  test('returns null when ADMIN_EMAIL is missing', () => {
    expect(parseBootstrapConfig({})).toBeNull();
  });

  test('returns null when ADMIN_EMAIL is blank', () => {
    expect(parseBootstrapConfig({ ADMIN_EMAIL: '   ' })).toBeNull();
  });

  test('uses defaults for admin name, workspace name and currency', () => {
    expect(parseBootstrapConfig({ ADMIN_EMAIL: 'budi@example.com', ADMIN_PASSWORD: 'rahasia123' })).toEqual({
      adminEmail: 'budi@example.com',
      adminPassword: 'rahasia123',
      adminName: 'budi',
      workspaceName: 'Keuangan Saya',
      baseCurrency: 'IDR'
    });
  });

  test('uses values from env when provided', () => {
    const config = parseBootstrapConfig({
      ADMIN_EMAIL: 'budi@example.com',
      ADMIN_PASSWORD: 'rahasia123',
      ADMIN_NAME: 'Budi Santoso',
      WORKSPACE_NAME: 'Rumah Tangga',
      BASE_CURRENCY: 'USD'
    });

    expect(config).toEqual({
      adminEmail: 'budi@example.com',
      adminPassword: 'rahasia123',
      adminName: 'Budi Santoso',
      workspaceName: 'Rumah Tangga',
      baseCurrency: 'USD'
    });
  });

  test('throws for an email without @', () => {
    expect(() =>
      parseBootstrapConfig({ ADMIN_EMAIL: 'budi.example.com', ADMIN_PASSWORD: 'rahasia123' })
    ).toThrow('ADMIN_EMAIL');
  });

  test('throws for a currency that is not 3 uppercase letters', () => {
    expect(() =>
      parseBootstrapConfig({
        ADMIN_EMAIL: 'budi@example.com',
        ADMIN_PASSWORD: 'rahasia123',
        BASE_CURRENCY: 'idr'
      })
    ).toThrow('BASE_CURRENCY');
  });

  test('lowercases the admin email', () => {
    const config = parseBootstrapConfig({ ADMIN_EMAIL: 'Budi@Example.com', ADMIN_PASSWORD: 'rahasia123' });

    expect(config?.adminEmail).toBe('budi@example.com');
  });

  test('throws when ADMIN_PASSWORD is missing', () => {
    expect(() => parseBootstrapConfig({ ADMIN_EMAIL: 'budi@example.com' })).toThrow('ADMIN_PASSWORD');
  });

  test('throws when ADMIN_PASSWORD is shorter than 8 characters', () => {
    expect(() =>
      parseBootstrapConfig({ ADMIN_EMAIL: 'budi@example.com', ADMIN_PASSWORD: 'short' })
    ).toThrow('ADMIN_PASSWORD');
  });
});
