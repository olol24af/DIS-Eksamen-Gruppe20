process.env.JWT_SECRET = 'test-secret';

const request = require('supertest');

jest.mock('../db/users', () => ({
  validateUserCredentials: jest.fn(),
}));

jest.mock('../services/notifications', () => ({
  sendAvailabilityNotification: jest.fn(),
  isTwilioConfigured: true,
  availabilityMessage: ({ fullName }) =>
    `[TEST] Hello ${fullName || 'there'}`,
}));

const { validateUserCredentials } = require('../db/users');
const app = require('../app');

describe('POST /admin/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects with a session cookie when credentials are valid', async () => {
    validateUserCredentials.mockResolvedValue({ id: 1, username: 'admin' });

    const response = await request(app)
      .post('/admin/login')
      .type('form')
      .send({ username: 'admin', password: 'correct' });

    expect(response.status).toBe(302);
    expect(response.headers['set-cookie']).toBeDefined();
  });

  it('responds with 401 when credentials are invalid and JSON is accepted', async () => {
    validateUserCredentials.mockResolvedValue(null);

    const response = await request(app)
      .post('/admin/login')
      .set('Accept', 'application/json')
      .send({ username: 'admin', password: 'wrong' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Invalid username or password.' });
  });
});
