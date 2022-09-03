import { expect, test } from "vitest";
import { sum } from "./sum";

test("sum", () => {
  const actual = sum(1, 3);
  const expected = 4;
  expect(actual).toBe(expected);
});
