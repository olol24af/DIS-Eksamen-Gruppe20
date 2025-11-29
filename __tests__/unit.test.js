const { availabilityMessage } = require('../services/notifications');

describe('availabilityMessage', () => {
  it('includes the provided name in the notification template', () => {
    const message = availabilityMessage({ fullName: 'Ada Lovelace' });
    expect(message).toContain('Hi Ada Lovelace');
  });

  it('falls back to a generic greeting when no name is supplied', () => {
    const message = availabilityMessage({});
    expect(message).toContain('Hi there');
  });
});
