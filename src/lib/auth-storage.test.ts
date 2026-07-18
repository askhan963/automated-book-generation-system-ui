import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AUTH_UNAUTHORIZED_EVENT,
  clearToken,
  getToken,
  notifyUnauthorized,
  onUnauthorized,
  setToken,
} from "@/lib/auth-storage";

describe("auth-storage unauthorized notification", () => {
  afterEach(() => {
    clearToken();
    vi.restoreAllMocks();
  });

  it("notifies same-document listeners when unauthorized", () => {
    const listener = vi.fn();
    const unsubscribe = onUnauthorized(listener);

    notifyUnauthorized();

    expect(listener).toHaveBeenCalledOnce();
    unsubscribe();
  });

  it("stops notifying after unsubscribe", () => {
    const listener = vi.fn();
    const unsubscribe = onUnauthorized(listener);

    unsubscribe();
    notifyUnauthorized();

    expect(listener).not.toHaveBeenCalled();
  });

  it("uses a stable custom event name", () => {
    const listener = vi.fn();
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, listener);

    notifyUnauthorized();

    expect(listener).toHaveBeenCalledOnce();
    window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, listener);
  });

  it("round-trips the access token in storage", () => {
    setToken("abc");
    expect(getToken()).toBe("abc");
    clearToken();
    expect(getToken()).toBeNull();
  });
});
