import { describe, it, expect } from "vitest";
import {
  computeStandarShare,
  computeSubscriptionDistribution,
} from "./earning.math.js";

describe("computeStandarShare", () => {
  it("returns floor(price * pct / 100)", () => {
    expect(computeStandarShare(250000, 70)).toBe(175000);
    expect(computeStandarShare(100, 70)).toBe(70);
    expect(computeStandarShare(101, 70)).toBe(70); // floor(70.7)
  });

  it("returns 0 when pct is 0", () => {
    expect(computeStandarShare(250000, 0)).toBe(0);
  });
});

describe("computeSubscriptionDistribution", () => {
  it("distributes the contributor pool proportionally by downloads", () => {
    const out = computeSubscriptionDistribution(
      100000,
      new Map([
        ["a", 3],
        ["b", 1],
      ]),
      70,
    );
    // pool 100000 * 70% = 70000; total downloads 4
    // a = floor(70000 * 3 / 4) = 52500 ; b = floor(70000 * 1 / 4) = 17500
    expect(out).toEqual([
      { contributorId: "a", amount: 52500 },
      { contributorId: "b", amount: 17500 },
    ]);
  });

  it("returns [] when there are no downloads", () => {
    expect(computeSubscriptionDistribution(100000, new Map(), 70)).toEqual([]);
  });

  it("gives the full contributor pool to a single contributor", () => {
    const out = computeSubscriptionDistribution(100000, new Map([["a", 5]]), 70);
    expect(out).toEqual([{ contributorId: "a", amount: 70000 }]);
  });

  it("returns 0 amounts when pct is 0", () => {
    const out = computeSubscriptionDistribution(100000, new Map([["a", 1]]), 0);
    expect(out).toEqual([{ contributorId: "a", amount: 0 }]);
  });
});