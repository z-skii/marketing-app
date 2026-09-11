/**
 * The Lab adapter: a simulated mutation that resolves after 250ms. It is
 * explicitly a demo response, not backend progress. Nothing here touches
 * the network or the database.
 */
export function demoMutation(fail = false): Promise<{ ok: boolean }> {
  return new Promise((resolve) => setTimeout(() => resolve({ ok: !fail }), 250));
}
