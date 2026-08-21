import { describe, expect, it } from "vitest";
import { checkDestinationUrl, slugify } from "../src/lib/validation";
import { preQualify } from "../src/lib/click-qualification";
import { formatCredit, parseDollarsToCents, estimatedOpens } from "../src/lib/money";

const base = {
  method: "GET", userAgent: "Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/131 Safari/537.36",
  secPurpose: null, purpose: null, mozPrefetch: null, secFetchMode: "navigate",
};

describe("destination URLs (§40)", () => {
  it("accepts a normal https link and extracts the domain", () => {
    const result = checkDestinationUrl("https://www.Example.com/launch?ref=1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.domain).toBe("example.com");
      expect(result.url).toContain("https://");
    }
  });

  it("assumes https when no scheme is given", () => {
    const result = checkDestinationUrl("example.com/page");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.url.startsWith("https://")).toBe(true);
  });

  it("upgrades http to https rather than rejecting it", () => {
    const result = checkDestinationUrl("http://example.com");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.url.startsWith("https://")).toBe(true);
  });

  it.each([
    ["javascript:alert(1)", "javascript"],
    ["data:text/html;base64,PHN2Zz4=", "data"],
    ["file:///etc/passwd", "file"],
  ])("rejects the %s scheme", (input) => {
    expect(checkDestinationUrl(input).ok).toBe(false);
  });

  it.each([
    "http://localhost:3000",
    "http://127.0.0.1/admin",
    "http://10.0.0.5",
    "http://192.168.1.1",
    "http://172.16.4.2",
    "http://169.254.169.254/latest/meta-data",
    "http://0.0.0.0",
  ])("refuses the private or loopback address %s", (input) => {
    expect(checkDestinationUrl(input).ok).toBe(false);
  });

  it("rejects embedded credentials and bare hosts", () => {
    expect(checkDestinationUrl("https://user:pass@example.com").ok).toBe(false);
    expect(checkDestinationUrl("https://intranet").ok).toBe(false);
    expect(checkDestinationUrl("   ").ok).toBe(false);
  });

  it("rejects an over-long URL", () => {
    expect(checkDestinationUrl(`https://example.com/${"a".repeat(2100)}`).ok).toBe(false);
  });

  it("makes safe slugs", () => {
    expect(slugify("Lumen Type")).toBe("lumen-type");
    expect(slugify("  ///  ")).toBe("link");
    expect(slugify("Ünïcôdé Ñame")).toMatch(/^[a-z0-9-]+$/);
  });
});

describe("click pre-qualification (§29)", () => {
  it("passes a normal browser navigation", () => {
    expect(preQualify(base).rejection).toBeNull();
  });

  it("rejects anything that is not a GET", () => {
    expect(preQualify({ ...base, method: "HEAD" }).rejection).toBe("non_get_request");
    expect(preQualify({ ...base, method: "POST" }).rejection).toBe("non_get_request");
  });

  it.each([
    "curl/8.4.0", "python-requests/2.31", "Googlebot/2.1", "AhrefsBot",
    "node-fetch/3", "HeadlessChrome/120", "Slackbot-LinkExpanding", "facebookexternalhit/1.1",
  ])("rejects the automated client %s", (ua) => {
    expect(preQualify({ ...base, userAgent: ua }).rejection).toBe("bot_user_agent");
  });

  it("rejects a missing user agent", () => {
    expect(preQualify({ ...base, userAgent: null }).rejection).toBe("missing_user_agent");
    expect(preQualify({ ...base, userAgent: "   " }).rejection).toBe("missing_user_agent");
  });

  it.each([
    ["secPurpose", "prefetch"],
    ["purpose", "prefetch"],
    ["mozPrefetch", "prefetch"],
    ["secPurpose", "prefetch;prerender"],
  ])("rejects the %s prefetch signal", (header, value) => {
    expect(preQualify({ ...base, [header]: value }).rejection).toBe("prefetch");
  });
});

describe("money formatting", () => {
  it("shows whole dollars without cents, and cents when they matter", () => {
    expect(formatCredit(8300)).toBe("$83");
    expect(formatCredit(5)).toBe("$0.05");
    expect(formatCredit(136815)).toBe("$1,368.15");
    expect(formatCredit(0)).toBe("$0");
    expect(formatCredit(-2500)).toBe("-$25");
  });

  it("parses typed amounts into exact cents", () => {
    expect(parseDollarsToCents("25")).toBe(2500);
    expect(parseDollarsToCents("$1,000.50")).toBe(100050);
    expect(parseDollarsToCents("0.05")).toBe(5);
    expect(parseDollarsToCents("abc")).toBeNull();
    expect(parseDollarsToCents("1.005")).toBeNull();
    expect(parseDollarsToCents("-5")).toBeNull();
  });

  it("estimates opens without ever rounding up", () => {
    expect(estimatedOpens(2500, 5)).toBe(500);
    expect(estimatedOpens(7, 5)).toBe(1);
    expect(estimatedOpens(4, 5)).toBe(0);
    expect(estimatedOpens(100, 0)).toBe(0);
  });
});
