import { hasCalendarScope, CALENDAR_SCOPE } from "../../../../lib/auth/googleScope";

describe("hasCalendarScope", () => {
  it("detects scope when present", () => {
    const s = `openid email profile ${CALENDAR_SCOPE}`;
    expect(hasCalendarScope(s)).toBe(true);
  });

  it("returns false when missing", () => {
    expect(hasCalendarScope("openid profile email")).toBe(false);
  });

  it("handles null/undefined", () => {
    expect(hasCalendarScope()).toBe(false);
    expect(hasCalendarScope(null)).toBe(false);
  });
}); 