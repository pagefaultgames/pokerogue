import { getCookie } from "#utils/cookies";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("Unit Tests - cookies.ts", () => {
  describe("getCookie", () => {
    const cookieStart = document.cookie;
    beforeEach(() => {
      // clear cookie before each test
      document.cookie = "";
    });

    afterEach(() => {
      // restore original cookie after each test
      document.cookie = cookieStart;
    });
    /**
     * Spies on `document.cookie` and replaces its value with the provided string.
     */
    function setDocumentCookie(value: string) {
      vi.spyOn(document, "cookie", "get").mockReturnValue(value);
    }
    it("returns the value of a single cookie", () => {
      setDocumentCookie("foo=bar");
      expect(getCookie("foo")).toBe("bar");
    });

    it("returns empty string if cookie is not found", () => {
      setDocumentCookie("foo=bar");
      expect(getCookie("baz")).toBe("");
    });

    it("returns the value when multiple cookies exist", () => {
      setDocumentCookie("foo=bar; baz=qux");
      expect(getCookie("baz")).toBe("qux");
    });

    it("trims leading spaces in cookies", () => {
      setDocumentCookie("foo=bar;  baz=qux");
      expect(getCookie("baz")).toBe("qux");
    });

    it("returns the value of the first matching cookie if only one exists", () => {
      setDocumentCookie("foo=bar; test=val");
      expect(getCookie("foo")).toBe("bar");
    });

    it("returns empty string if document.cookie is empty", () => {
      setDocumentCookie("");
      expect(getCookie("foo")).toBe("");
    });

    it("handles cookies that aren't separated with a space", () => {
      setDocumentCookie("foo=bar;baz=qux;quux=corge;grault=garply");
      expect(getCookie("baz")).toBe("qux");
    });

    it("handles cookies that may have leading tab characters", () => {
      setDocumentCookie("foo=bar;\tbaz=qux");
      expect(getCookie("baz")).toBe("qux");
    });
  });
});
