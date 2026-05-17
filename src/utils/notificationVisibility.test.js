const test = require('node:test');
const assert = require('node:assert/strict');
const { isVisibleNotification } = require('./notificationVisibility');

const validNotification = {
  id: 'notification-1',
  title: 'Campus Update',
  message: 'A useful notification body.',
  createdAt: '2026-05-17T12:00:00Z',
};

test('shows sent and published lifecycle notifications', () => {
  assert.equal(isVisibleNotification({ ...validNotification, status: 'Sent' }), true);
  assert.equal(isVisibleNotification({ ...validNotification, status: 'Published' }), true);
  assert.equal(isVisibleNotification({ ...validNotification, status: ' published ' }), true);
});

test('hides archived and other explicit non-visible lifecycle statuses', () => {
  assert.equal(isVisibleNotification({ ...validNotification, status: 'Archived' }), false);
  assert.equal(isVisibleNotification({ ...validNotification, status: 'Draft' }), false);
  assert.equal(isVisibleNotification({ ...validNotification, status: 'Expired' }), false);
});

test('shows legacy production notifications when status is missing but content is valid', () => {
  assert.equal(isVisibleNotification(validNotification), true);
  assert.equal(isVisibleNotification({ ...validNotification, status: null }), true);
  assert.equal(isVisibleNotification({ ...validNotification, status: '   ' }), true);
});

test('does not show malformed legacy notifications without content', () => {
  assert.equal(isVisibleNotification({ id: 'notification-1', title: 'Campus Update' }), false);
  assert.equal(isVisibleNotification({ id: 'notification-1', message: 'Body only' }), false);
});

test('hides expired notifications even when status is missing or visible', () => {
  const now = new Date('2026-05-17T12:00:00Z').getTime();
  const expired = { ...validNotification, expiresAt: '2026-05-17T11:59:59Z' };

  assert.equal(isVisibleNotification(expired, now), false);
  assert.equal(isVisibleNotification({ ...expired, status: 'Sent' }, now), false);
});
