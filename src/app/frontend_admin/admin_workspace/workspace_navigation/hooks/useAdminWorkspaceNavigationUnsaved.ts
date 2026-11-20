"use client";

const eventName = "demo-request-discard";
export function requestDiscard() {
  return window.dispatchEvent(new Event(eventName, { cancelable: true }));
}
