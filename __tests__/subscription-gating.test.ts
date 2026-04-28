/**
 * Subscription Gating Tests
 *
 * Tests the pure logic of:
 * - isPremium derivation (RC entitlement check)
 * - debugSetPremium override behaviour
 * - NeuroAudit section splitting (free vs premium sections)
 * - Which screens are gated and what they receive
 */

const ENTITLEMENT_ID = 'ResetDopa Pro';

// ---------- helpers that mirror SubscriptionContext logic ----------

function deriveIsPremium(
  customerInfo: { entitlements: { active: Record<string, unknown> } } | null,
  debugOverride: boolean | null,
  isDev: boolean
): boolean {
  const rcIsPremium =
    customerInfo != null &&
    customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
  return isDev && debugOverride !== null ? debugOverride : rcIsPremium;
}

// mirrors parseAuditSections from NeuroAuditScreen
function parseAuditSections(raw: string): { title: string; body: string }[] {
  if (!raw) return [];
  const parts = raw.split(/\n?##\s+/).filter(Boolean);
  return parts.map((part) => {
    const newline = part.indexOf('\n');
    if (newline === -1) return { title: part.trim(), body: '' };
    return {
      title: part.slice(0, newline).trim(),
      body: part.slice(newline + 1).trim(),
    };
  });
}

function splitSections(raw: string) {
  const sections = parseAuditSections(raw);
  const freeSections = sections.filter((s) => s.title !== "Next Week's Protocol");
  const protocolSection = sections.find((s) => s.title === "Next Week's Protocol") ?? null;
  return { freeSections, protocolSection };
}

// ---------- fixture ----------

const FULL_AUDIT = `## The Pattern
Your urges spike between 10 PM and midnight.

## The Weakest Link
You don't have a dopamine problem. You have a transition problem.

## Next Week's Protocol
If it is after 9 PM and you reach for your phone, then do 10 push-ups first.`;

const LEGACY_FREE_AUDIT = `## The Pattern
Your urges spike between 10 PM and midnight.

## The Weakest Link
You don't have a dopamine problem. You have a transition problem.`;

// =======================================================================

describe('isPremium derivation', () => {
  test('false when customerInfo is null', () => {
    expect(deriveIsPremium(null, null, false)).toBe(false);
  });

  test('false when entitlement not active', () => {
    const info = { entitlements: { active: {} } };
    expect(deriveIsPremium(info, null, false)).toBe(false);
  });

  test('true when entitlement is active', () => {
    const info = { entitlements: { active: { [ENTITLEMENT_ID]: {} } } };
    expect(deriveIsPremium(info, null, false)).toBe(true);
  });
});

describe('debugSetPremium override (DEV only)', () => {
  const noEntitlement = { entitlements: { active: {} } };

  test('override true forces isPremium even without RC entitlement', () => {
    expect(deriveIsPremium(noEntitlement, true, true)).toBe(true);
  });

  test('override null falls back to real RC value (false)', () => {
    expect(deriveIsPremium(noEntitlement, null, true)).toBe(false);
  });

  test('override null falls back to real RC value (true)', () => {
    const withEntitlement = { entitlements: { active: { [ENTITLEMENT_ID]: {} } } };
    expect(deriveIsPremium(withEntitlement, null, true)).toBe(true);
  });

  test('override is ignored in production (isDev = false)', () => {
    expect(deriveIsPremium(noEntitlement, true, false)).toBe(false);
  });
});

describe('NeuroAudit section splitting', () => {
  test('full audit has 3 sections', () => {
    const { freeSections, protocolSection } = splitSections(FULL_AUDIT);
    expect(freeSections).toHaveLength(2);
    expect(freeSections[0].title).toBe('The Pattern');
    expect(freeSections[1].title).toBe('The Weakest Link');
    expect(protocolSection).not.toBeNull();
    expect(protocolSection!.title).toBe("Next Week's Protocol");
  });

  test('free sections never include the Protocol', () => {
    const { freeSections } = splitSections(FULL_AUDIT);
    const titles = freeSections.map((s) => s.title);
    expect(titles).not.toContain("Next Week's Protocol");
  });

  test('legacy free audit (no protocol) returns null protocolSection', () => {
    const { freeSections, protocolSection } = splitSections(LEGACY_FREE_AUDIT);
    expect(freeSections).toHaveLength(2);
    expect(protocolSection).toBeNull();
  });

  test('empty audit returns empty sections', () => {
    const { freeSections, protocolSection } = splitSections('');
    expect(freeSections).toHaveLength(0);
    expect(protocolSection).toBeNull();
  });

  test('protocol section body is populated', () => {
    const { protocolSection } = splitSections(FULL_AUDIT);
    expect(protocolSection!.body).toContain('If it is after 9 PM');
  });
});

describe('screen gating logic', () => {
  function screenShouldGate(isPremium: boolean): boolean {
    return !isPremium;
  }

  function neuroAuditShouldShowLockedCard(
    isPremium: boolean,
    protocolSection: { title: string; body: string } | null
  ): boolean {
    if (isPremium && protocolSection) return false; // show section normally
    return true; // show locked card (free user OR no section yet)
  }

  test('BlockedAppsManager gates free users', () => {
    expect(screenShouldGate(false)).toBe(true);
  });

  test('BlockedAppsManager does not gate premium users', () => {
    expect(screenShouldGate(true)).toBe(false);
  });

  test('Store gates free users', () => {
    expect(screenShouldGate(false)).toBe(true);
  });

  test('Store does not gate premium users', () => {
    expect(screenShouldGate(true)).toBe(false);
  });

  test('NeuroAudit shows locked Protocol card to free users', () => {
    const { protocolSection } = splitSections(FULL_AUDIT);
    expect(neuroAuditShouldShowLockedCard(false, protocolSection)).toBe(true);
  });

  test('NeuroAudit shows full Protocol to premium users', () => {
    const { protocolSection } = splitSections(FULL_AUDIT);
    expect(neuroAuditShouldShowLockedCard(true, protocolSection)).toBe(false);
  });

  test('NeuroAudit shows locked card when protocol section is missing (legacy doc)', () => {
    const { protocolSection } = splitSections(LEGACY_FREE_AUDIT);
    expect(neuroAuditShouldShowLockedCard(true, protocolSection)).toBe(true);
  });

  test('upgrading: override true reveals protocol on existing audit', () => {
    const noEntitlement = { entitlements: { active: {} } };
    const isPremium = deriveIsPremium(noEntitlement, true, true); // debug override
    const { protocolSection } = splitSections(FULL_AUDIT);
    expect(neuroAuditShouldShowLockedCard(isPremium, protocolSection)).toBe(false);
  });
});
