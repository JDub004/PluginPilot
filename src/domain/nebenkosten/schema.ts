import { z } from 'zod';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');
const euro = z.number().finite().min(-1_000_000).max(1_000_000);
const positive = z.number().finite().positive().max(1_000_000_000);

export const CostItemSchema = z.object({
  label: z.string().trim().min(1).max(120).describe('Cost line exactly as printed, e.g. "Grundsteuer" or "Hausmeister"'),
  totalCost: euro.optional().describe('Total cost of this item for the whole building/allocation unit, in EUR'),
  allocationKey: z
    .enum(['area', 'persons', 'units', 'consumption', 'other'])
    .optional()
    .describe('How the item is split: area = m², persons, units = per apartment, consumption = metered'),
  totalAllocationUnits: positive.optional().describe('Denominator of the key, e.g. total building m² or total persons'),
  tenantAllocationUnits: positive.optional().describe('Tenant share of the key, e.g. the apartment m²'),
  tenantShare: euro.describe('Amount charged to the tenant for this item, in EUR'),
});

export const HeatingSchema = z
  .object({
    consumptionSharePercent: z.number().min(0).max(100).optional().describe('Share of heating cost split by metered consumption (rest by area)'),
    billedByConsumption: z.boolean().optional().describe('false if heating was split only by area/flat rate despite meters being required'),
    fossilFuel: z.boolean().optional().describe('true for gas, oil, district heating from fossil sources'),
    co2Cost: euro.optional().describe('CO2 cost of the building for the period, in EUR (often printed on the fuel invoice/statement)'),
    co2KgPerSqmYear: z.number().min(0).max(1000).optional().describe('Building CO2 emissions in kg CO2 per m² living area per year'),
    co2LandlordShareApplied: euro.optional().describe('Amount of CO2 cost the statement says the landlord carries for this apartment, in EUR'),
    tenantCo2CostShareBeforeSplit: euro.optional().describe('CO2 cost attributable to this apartment before the landlord/tenant split, in EUR'),
    co2InfoShown: z.boolean().optional().describe('Whether the statement shows CO2 cost and emissions at all'),
  })
  .strict();

export const StatementSchema = z
  .object({
    periodStart: isoDate.describe('First day of the billing period'),
    periodEnd: isoDate.describe('Last day of the billing period'),
    receivedDate: isoDate.optional().describe('Date the tenant received the statement'),
    apartmentSqm: positive.optional().describe('Living area of the apartment in m²'),
    items: z.array(CostItemSchema).min(1).max(60),
    prepaymentsTotal: euro.optional().describe('Sum of monthly advance payments (Vorauszahlungen) in the period, in EUR'),
    statedBalance: euro
      .optional()
      .describe('Final result printed on the statement: positive = tenant must pay (Nachzahlung), negative = refund (Guthaben)'),
    heating: HeatingSchema.optional(),
  })
  .strict();

export type Statement = z.infer<typeof StatementSchema>;
export type CostItem = z.infer<typeof CostItemSchema>;

export const Severity = z.enum(['error', 'warning', 'info']);

export const FindingSchema = z.object({
  id: z.string(),
  severity: Severity,
  title: z.string(),
  explanation: z.string(),
  legalBasis: z.string().optional(),
  item: z.string().optional(),
  estimatedOverchargeEur: z.number().optional(),
});
export type Finding = z.infer<typeof FindingSchema>;

export const CheckResultSchema = z.object({
  rulesVersion: z.string(),
  verdict: z.enum(['issues_found', 'warnings_only', 'no_issues_found']),
  estimatedOverchargeEur: z.number(),
  objectionDeadline: z.string().optional(),
  findings: z.array(FindingSchema),
  checkedRules: z.array(z.string()),
  disclaimer: z.string(),
});
export type CheckResult = z.infer<typeof CheckResultSchema>;
