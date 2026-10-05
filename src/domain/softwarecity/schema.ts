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
    dataFlowsTo: z.array(name(60)).max(20).default([]).describe('Names of other apps (or partners) this app sends data to'),
    importance: z.number().int().min(1).max(5).optional().describe('Importance for the business, 1 = nice to have … 5 = core of the business. Default: 4 if critical, else 3'),
    site: name(60).optional().describe('Name of the site/location where it is used; omit if used at all sites'),
  })
  .strict();

const contact = {
  email: z.string().trim().email().max(120).optional().describe('Business e-mail address'),
  phone: z.string().trim().regex(/^[+0-9 ()/.-]{3,40}$/).optional().describe('Business phone number'),
  note: z.string().trim().max(300).optional().describe('Short note, e.g. deputy, office hours, contract number'),
};

export const PersonSchema = z
  .object({
    name: name(60).describe('Name of the key person'),
    role: name(60).optional().describe('Role, e.g. "IT-Leitung", "Ansprechpartnerin Lohn"'),
    department: name(40).describe('Department the person belongs to; "Alle" for company-wide roles'),
    ...contact,
    responsibleFor: z.array(name(60)).max(20).default([]).describe('Names of apps this person is responsible for or the go-to contact'),
  })
  .strict();

export const SiteSchema = z
  .object({
    name: name(60).describe('Site name, e.g. "Zentrale Hamburg"'),
    city: name(60).optional().describe('City the site is in (used to place it on the map)'),
    lat: z.number().min(-90).max(90).optional(),
    lon: z.number().min(-180).max(180).optional(),
    employees: z.number().int().min(0).max(1_000_000).optional(),
    main: z.boolean().default(false).describe('Headquarters'),
  })
  .strict();

export const PARTNER_KINDS = ['supplier', 'customer', 'service_provider', 'authority', 'other'] as const;
export const PartnerSchema = z
  .object({
    name: name(80).describe('External company, e.g. supplier, tax advisor, IT service provider, key customer'),
    kind: z.enum(PARTNER_KINDS).default('other'),
    city: name(60).optional(),
    lat: z.number().min(-90).max(90).optional(),
    lon: z.number().min(-180).max(180).optional(),
    contact: name(60).optional().describe('Contact person at the partner'),
    ...contact,
    connectedApps: z.array(name(60)).max(20).default([]).describe('Own apps used to exchange data with this partner'),
  })
  .strict();

export const CityInputSchema = z
  .object({
    company: name(80).describe('Company name shown on the map'),
    apps: z.array(AppSchema).min(1).max(120),
    people: z.array(PersonSchema).max(60).optional().describe('Key persons and contacts (business contact data only, with their consent)'),
    sites: z.array(SiteSchema).max(20).optional().describe('Company sites/locations'),
    partners: z.array(PartnerSchema).max(40).optional().describe('External network: suppliers, customers, service providers, authorities'),
  })
  .strict();
export type CityInput = z.infer<typeof CityInputSchema>;
export type AppInput = z.infer<typeof AppSchema>;
export type PersonInput = z.infer<typeof PersonSchema>;
export type PartnerKind = (typeof PARTNER_KINDS)[number];

export type Severity = 'high' | 'medium' | 'low';

export interface Building {
  id: string;
  name: string;
  category: Category;
  district: string;
  /** Grid position (isometric tile coordinates). */
  gx: number;
  gy: number;
  /** Number of floors (1..9), derived from users and importance. */
  floors: number;
  /** 1..5; also widens the footprint. */
  importance: number;
  site?: string;
  users?: number;
  licenses?: number;
  monthlyCostEur?: number;
  owner?: string;
  critical: boolean;
  approved: boolean;
  questIds: string[];
}
export interface District { name: string; gx: number; gy: number; w: number; h: number; buildingIds: string[]; personIds: string[] }
export interface Contact { email?: string; phone?: string; note?: string }
export interface Person extends Contact { id: string; name: string; role?: string; district: string; buildingIds: string[] }
/** Layout of one site's own town (same building ids, different positions). */
export interface SiteLayout { districts: District[]; positions: Record<string, [number, number]> }
export interface Site { id: string; name: string; city?: string; lat?: number; lon?: number; employees?: number; main: boolean; buildingIds: string[]; layout: SiteLayout }
export interface Partner extends Contact { id: string; name: string; kind: PartnerKind; city?: string; lat?: number; lon?: number; contact?: string; buildingIds: string[]; siteId?: string }
export interface Road { from: string; to: string }
export interface Quest {
  id: string;
  severity: Severity;
  kind: 'duplicate' | 'unused_licenses' | 'critical_spreadsheet' | 'no_owner' | 'shadow_it' | 'data_island' | 'unknown_flow' | 'key_person';
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
  people: Person[];
  sites: Site[];
  partners: Partner[];
  stats: { apps: number; districts: number; monthlyCostEur: number; potentialSavingsEurYear: number; healthScore: number };
  disclaimer: string;
}
