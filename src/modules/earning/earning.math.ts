// Pure, side-effect-free split math. Unit-tested. No DB, no I/O.

/**
 * Contributor share for a single STANDAR purchase.
 * Floor rounding; remainder stays with the platform.
 */
export function computeStandarShare(price: number, pct: number): number {
  if (pct <= 0 || price <= 0) return 0;
  return Math.floor((price * pct) / 100);
}

/**
 * Distribute a recognized subscription revenue pool among contributors
 * proportional to their SUBSCRIBE download counts in the period.
 *
 * - `pool`        = total recognized subscription revenue for the month
 *                   (platform + contributor combined).
 * - `downloads`   = Map<contributorId, downloadCount>.
 * - `pct`         = contributor_share_percentage.
 *
 * Returns an array of { contributorId, amount } for contributors with > 0
 * downloads. Floor rounding per contributor; remainder stays with platform.
 * Returns [] when total downloads is 0 (pool stays with platform).
 */
export function computeSubscriptionDistribution(
  pool: number,
  downloads: Map<string, number>,
  pct: number,
): Array<{ contributorId: string; amount: number }> {
  const totalDownloads = Array.from(downloads.values()).reduce((s, n) => s + n, 0);
  if (totalDownloads === 0) return [];

  const contributorPool = Math.floor((pool * pct) / 100);

  const result: Array<{ contributorId: string; amount: number }> = [];
  for (const [contributorId, count] of downloads) {
    if (count <= 0) continue;
    const amount = Math.floor((contributorPool * count) / totalDownloads);
    result.push({ contributorId, amount });
  }
  return result;
}