import { Alert, Platform } from 'react-native';

// react-native-web's Alert.alert() is a hard no-op — it doesn't show a dialog
// AND never calls any button's onPress, so every confirm/error dialog in the
// app (delete, log out, upload failures) silently did nothing on web. This
// wraps the same (title, message, buttons) shape RN's Alert.alert takes, and
// falls back to window.confirm/alert on web so the callbacks actually fire.
export function alert(title, message, buttons) {
  if (Platform.OS !== 'web') {
    return Alert.alert(title, message, buttons);
  }

  const text = [title, message].filter(Boolean).join('\n\n');

  if (!buttons || buttons.length === 0) {
    window.alert(text);
    return;
  }

  if (buttons.length === 1) {
    window.alert(text);
    buttons[0].onPress?.();
    return;
  }

  const cancelButton = buttons.find((b) => b.style === 'cancel');
  const actionButton = buttons.find((b) => b !== cancelButton);

  if (window.confirm(text)) {
    actionButton?.onPress?.();
  } else {
    cancelButton?.onPress?.();
  }
}
