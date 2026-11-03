// Chạy: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { formatTotalHours, formatVnd } from "./format.ts";
import { weekStats } from "./stats.ts";

test("tuần không có buổi nào -> toàn 0", () => {
  const stats = weekStats([]);
  assert.deepEqual(stats, { sessionCount: 0, totalMinutes: 0, totalCostVnd: 0 });
  assert.equal(formatTotalHours(stats.totalMinutes), "0h");
  assert.equal(formatVnd(stats.totalCostVnd), "0 ₫");
});

test("một buổi", () => {
  const stats = weekStats([{ durationMinutes: 120, costVnd: 150_000 }]);
  assert.deepEqual(stats, {
    sessionCount: 1,
    totalMinutes: 120,
    totalCostVnd: 150_000,
  });
  assert.equal(formatTotalHours(stats.totalMinutes), "2h");
  assert.equal(formatVnd(stats.totalCostVnd), "150.000 ₫");
});

test("nhiều buổi, có buổi miễn phí, giờ lẻ phút", () => {
  const stats = weekStats([
    { durationMinutes: 90, costVnd: 120_000 },
    { durationMinutes: 45, costVnd: 0 },
    { durationMinutes: 120, costVnd: 1_250_000 },
  ]);
  assert.deepEqual(stats, {
    sessionCount: 3,
    totalMinutes: 255,
    totalCostVnd: 1_370_000,
  });
  assert.equal(formatTotalHours(stats.totalMinutes), "4h15");
  assert.equal(formatVnd(stats.totalCostVnd), "1.370.000 ₫");
});

test("định dạng tổng giờ", () => {
  assert.equal(formatTotalHours(45), "0h45");
  assert.equal(formatTotalHours(65), "1h05");
  assert.equal(formatTotalHours(600), "10h");
  assert.equal(formatTotalHours(1440 * 7), "168h");
});
