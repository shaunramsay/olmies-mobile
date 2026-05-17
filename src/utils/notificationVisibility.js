const VISIBLE_NOTIFICATION_STATUSES = new Set(['sent', 'published']);

const normalizeStatus = (status) => (
  typeof status === 'string' ? status.trim().toLowerCase() : ''
);

const hasNotificationContent = (notification) => (
  typeof notification?.title === 'string' &&
  notification.title.trim().length > 0 &&
  typeof notification?.message === 'string' &&
  notification.message.trim().length > 0
);

const isExpiredNotification = (notification, now = Date.now()) => {
  if (!notification?.expiresAt) return false;

  const expiresAt = new Date(notification.expiresAt).getTime();
  return Number.isFinite(expiresAt) && expiresAt <= now;
};

const isVisibleNotification = (notification, now = Date.now()) => {
  if (!notification || isExpiredNotification(notification, now)) {
    return false;
  }

  const status = normalizeStatus(notification.status);
  if (status) {
    return VISIBLE_NOTIFICATION_STATUSES.has(status);
  }

  return hasNotificationContent(notification);
};

module.exports = {
  isVisibleNotification,
};
