import { z } from 'zod';

export const CATEGORIES = [
  'crm', 'erp', 'accounting', 'hr', 'communication', 'collaboration', 'storage', 'spreadsheet',
  'dev', 'marketing', 'support', 'security', 'analytics', 'ecommerce', 'other',
] as const;
export type Category = (typeof CATEGORIES)[number];

const name = (max: number) => z.string().trim().min(1).max(max);

export const AppSchema = z
  .object({
    name: name(60).describe('Software name as used in the company, e.g. "Salesforce", "DATEV", "Kundenliste.xlsx"'),
    category: z.enum(CATEGORIES).describe('What the software is used for'),
    department: name(40).describe('Department that mainly uses it; "Alle" or "Company-wide" for shared tools'),
    users: z.number().int().min(0).max(100_000).optional().describe('Number of people actively using it'),
    licenses: z.number().int().min(0).max(100_000).optional().describe('Number of paid seats/licences'),
    monthlyCostEur: z.number().min(0).max(10_000_000).optional().describe('Total monthly cost in EUR'),
    owner: name(60).optional().describe('Person or role responsible for the software'),
    critical: z.boolean().default(false).describe('Business stops or money is lost if it fails'),
    approved: z.boolean().default(true).describe('false if introduced without IT/management approval (shadow IT)'),
    dataFlowsTo: z.array(name(60)).max(20).default([]).describe('Names of other apps this app sends data to'),
  })
  .strict();

export const CityInputSchema = z
  .object({
    company: name(80).describe('Company name shown on the map'),
    apps: z.array(AppSchema).min(1).max(120),
  })
  .strict();
export type CityInput = z.infer<typeof CityInputSchema>;
export type AppInput = z.infer<typeof AppSchema>;

export type Severity = 'high' | 'medium' | 'low';

export interface Building {
  id: string;
  name: string;
  category: Category;
  district: string;
  /** Grid position (isometric tile coordinates). */
  gx: number;
  gy: number;
  /** Number of floors (1..7), derived from users. */
  floors: number;
  users?: number;
  licenses?: number;
  monthlyCostEur?: number;
  owner?: string;
  critical: boolean;
  approved: boolean;
  questIds: string[];
}
export interface District { name: string; gx: number; gy: number; w: number; h: number; buildingIds: string[] }
export interface Road { from: string; to: string }
export interface Quest {
  id: string;
  severity: Severity;
  kind: 'duplicate' | 'unused_licenses' | 'critical_spreadsheet' | 'no_owner' | 'shadow_it' | 'data_island' | 'unknown_flow';
  title: string;
  detail: string;
  buildingIds: string[];
  savingEurYear?: number;
}
export interface CityMap {
  company: string;
  districts: District[];
  buildings: Building[];
  roads: Road[];
  quests: Quest[];
  stats: { apps: number; districts: number; monthlyCostEur: number; potentialSavingsEurYear: number; healthScore: number };
  disclaimer: string;
}
