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
    expect(parseBootstrapConfig({ ADMIN_EMAIL: 'budi@example.com' })).toEqual({
      adminEmail: 'budi@example.com',
      adminName: 'budi',
      workspaceName: 'Keuangan Saya',
      baseCurrency: 'IDR'
    });
  });

  test('uses values from env when provided', () => {
    const config = parseBootstrapConfig({
      ADMIN_EMAIL: 'budi@example.com',
      ADMIN_NAME: 'Budi Santoso',
      WORKSPACE_NAME: 'Rumah Tangga',
      BASE_CURRENCY: 'USD'
    });

    expect(config).toEqual({
      adminEmail: 'budi@example.com',
      adminName: 'Budi Santoso',
      workspaceName: 'Rumah Tangga',
      baseCurrency: 'USD'
    });
  });

  test('throws for an email without @', () => {
    expect(() => parseBootstrapConfig({ ADMIN_EMAIL: 'budi.example.com' })).toThrow('ADMIN_EMAIL');
  });

  test('throws for a currency that is not 3 uppercase letters', () => {
    expect(() =>
      parseBootstrapConfig({ ADMIN_EMAIL: 'budi@example.com', BASE_CURRENCY: 'idr' })
    ).toThrow('BASE_CURRENCY');
  });
});
