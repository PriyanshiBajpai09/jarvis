// actionEngine.ts
// Future device-execution layer. Every intent that maps to a real
// device capability (flashlight, calls, SMS, opening apps, battery,
// network, reminders) resolves to a structured ActionResult here.
// Today, every action is executable: false — Expo Go and the current
// dependency set cannot perform any of them yet. This is the single
// seam where real native execution (expo-battery, expo-network,
// expo-intent-launcher, Linking.openURL for calls/SMS, etc.) will be
// added once the project moves to a custom dev build, without the
// chat pipeline needing to change at all.

import { IntentResult, IntentType } from './intentEngine';

export interface ActionResult {
  action: string;
  executable: boolean;
  reason?: string;
  payload: Record<string, string>;
}

const ACTION_NAME_BY_INTENT: Partial<Record<IntentType, string>> = {
  flashlight: 'toggle_flashlight',
  battery: 'read_battery',
  network: 'read_network',
  open_app: 'open_app',
  call: 'place_call',
  sms: 'send_sms',
  reminder: 'create_reminder',
};

const REASON_BY_INTENT: Partial<Record<IntentType, string>> = {
  flashlight: 'Flashlight control requires native device access, available after moving to a custom dev build.',
  battery: 'Battery status requires the expo-battery native module, not available in Expo Go.',
  network: 'Network status requires the expo-network native module, not available in Expo Go.',
  open_app: 'Launching other apps requires native intent/URL-scheme handling, available after a custom dev build.',
  call: 'Placing calls requires native device access, available after a custom dev build.',
  sms: 'Sending messages requires native device access, available after a custom dev build.',
  reminder: 'Reminders require native notification/calendar access, available after a custom dev build.',
};

function buildPayload(intent: IntentResult): Record<string, string> {
  const payload: Record<string, string> = {};
  const { entities } = intent;
  if (entities.appName) payload.appName = entities.appName;
  if (entities.contactName) payload.contactName = entities.contactName;
  if (entities.reminderText) payload.reminderText = entities.reminderText;
  if (entities.location) payload.location = entities.location;
  return payload;
}

/**
 * Resolves a device-action intent into a structured, currently
 * non-executable action. Callers (jarvisRouter) use `reason` to phrase
 * an in-character explanation to the user — never surface `reason`
 * verbatim as raw technical text.
 */
export function resolveAction(intent: IntentResult): ActionResult {
  const action = ACTION_NAME_BY_INTENT[intent.type];

  if (!action) {
    return {
      action: 'none',
      executable: false,
      reason: 'No device action is associated with this intent.',
      payload: {},
    };
  }

  return {
    action,
    executable: false,
    reason: REASON_BY_INTENT[intent.type],
    payload: buildPayload(intent),
  };
}