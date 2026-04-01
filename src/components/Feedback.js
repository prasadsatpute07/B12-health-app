import * as Haptics from 'expo-haptics';

// Safely trigger haptics (some devices/situations may not support it).
const safe = (fn) => {
  try {
    fn();
  } catch (_) {}
};

export const tap = () => {
  safe(() => {
    Haptics.impactAsync?.(Haptics.ImpactFeedbackStyle?.Light);
  });
};

export const select = () => {
  safe(() => {
    Haptics.impactAsync?.(Haptics.ImpactFeedbackStyle?.Medium);
  });
};

export const success = () => {
  safe(() => {
    Haptics.notificationAsync?.(Haptics.NotificationFeedbackType?.Success);
  });
};

export const error = () => {
  safe(() => {
    Haptics.notificationAsync?.(Haptics.NotificationFeedbackType?.Error);
  });
};

export default { tap, select, success, error };

