import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('JB & Best Logistics API', () => {
  let app: typeof import('./index').default;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    ({ default: app } = await import('./index'));
  });

  it('reports service health without requiring MongoDB', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true, service: 'jb-best-logistics-api' });
  });

  it('rejects invalid registration input with field details', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ email: 'invalid', password: 'short' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Request validation failed');
    expect(response.body.details).toHaveProperty('email');
  });
});