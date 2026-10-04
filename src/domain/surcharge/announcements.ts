// Curated carrier surcharge announcements (Middle East / Hormuz crisis 2026).
// Every entry must carry a source. `confidence: 'primary'` = carrier's own advisory;
// 'secondary' = trade press quoting the carrier (verify before relying on amounts).
// Amounts in USD per container unless `perTeu` is set.

export type ContainerType = '20DV' | '40DV' | '40HC' | '45HC' | '20RF' | '40RF' | 'SPECIAL';
export type SurchargeCode = 'WRS' | 'ECS' | 'EBS' | 'OCR';

export interface Announcement {
  id: string;
  carrier: 'HAPAG-LLOYD' | 'CMA CGM' | 'MAERSK' | 'MSC';
  code: SurchargeCode;
  name: string;
  /** Countries (ISO 3166-1 alpha-2) where origin OR destination must lie, unless `originCountries` restricts direction. */
  countries?: string[];
  /** If set, origin must be in this list (directional scope). */
  originCountries?: string[];
  /** If set, destination must be in this list. */
  destinationCountries?: string[];
  /** Origins excluded from the scope. */
  originExcludedCountries?: string[];
  global?: boolean;
  effective: string;
  /** Later effective date for FMC-regulated (US) trades, if announced. */
  effectiveUsRegulated?: string;
  appliesToCargoAfloat: boolean | 'unspecified';
  amounts: Partial<Record<ContainerType, number>>;
  /** EBS-style headhaul/backhaul split: amounts above are headhaul, these are backhaul/intra. */
  backhaulAmounts?: Partial<Record<ContainerType, number>>;
  perTeu?: boolean;
  notes?: string;
  source: string;
  confidence: 'primary' | 'secondary';
}

const GULF = ['IQ', 'KW', 'BH', 'QA', 'AE', 'SA'];
const EU_NORTH_MED = ['DE', 'NL', 'BE', 'FR', 'GB', 'DK', 'SE', 'NO', 'FI', 'PL', 'IE', 'ES', 'PT', 'IT', 'GR', 'MT', 'SI', 'HR', 'TR', 'CY', 'EE', 'LV', 'LT'];

export const ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'HL-WRS-ME-2026', carrier: 'HAPAG-LLOYD', code: 'WRS', name: 'War Risk Surcharge (Upper/Persian/Arabian Gulf)',
    countries: GULF, effective: '2026-03-02', appliesToCargoAfloat: true,
    amounts: { '20DV': 1500, '40DV': 3000, '40HC': 3000, '45HC': 3000, '20RF': 3500, '40RF': 3500, SPECIAL: 3500 },
    notes: 'USD 1,500 per TEU for standard containers (40\' = 2 TEU), USD 3,500 per reefer/special container. Applies to bookings issued from 02.03.2026 and to cargo on the water not yet discharged/loaded.',
    source: 'https://container-news.com/hapag-lloyd-introduces-war-risk-surcharge-for-gulf-cargo/', confidence: 'secondary',
  },
  {
    id: 'CMA-ECS-ME-2026', carrier: 'CMA CGM', code: 'ECS', name: 'Emergency Conflict Surcharge (Middle East)',
    countries: ['IQ', 'BH', 'KW', 'YE', 'QA', 'OM', 'AE', 'SA', 'JO', 'EG', 'DJ', 'SD', 'ER'],
    effective: '2026-03-02', appliesToCargoAfloat: true,
    amounts: { '20DV': 2000, '40DV': 3000, '40HC': 3000, '45HC': 3000, '20RF': 4000, '40RF': 4000, SPECIAL: 4000 },
    notes: 'Egypt only for the port of Ain Sokhna. Applies to bookings from 02.03.2026 and cargo already afloat.',
    source: 'https://www.cma-cgm.com/assets/public/documents/CMA%20CGM%20-%20Middle%20East%20-%20Emergency%20Conflict%20Surcharge.pdf', confidence: 'primary',
  },
  {
    id: 'MSK-ECS-NEMED-2026', carrier: 'MAERSK', code: 'ECS', name: 'Emergency Contingency Surcharge (North Europe & Med to Middle East Red Sea, Oman, Sudan, Djibouti)',
    originCountries: EU_NORTH_MED, destinationCountries: ['OM', 'JO', 'SA', 'SD', 'DJ'],
    effective: '2026-03-06', appliesToCargoAfloat: false,
    amounts: { '20DV': 1800, '40DV': 3000, '40HC': 3000, '45HC': 3000 },
    notes: 'Price calculation date 06.03.2026. Oman excluding Sohar; Saudi Arabia only Jeddah/King Abdullah port. Sudan & Djibouti: USD 1,500 (20\') / 3,000 (40\'). Maersk: "Cargo in transit will not be impacted."',
    source: 'https://www.maersk.com/news/articles/2026/03/06/emergency-contingency-surcharge-north-europe-mediterranean-to-meg-isc-east-africa', confidence: 'primary',
  },
  {
    id: 'MSK-EBS-2026', carrier: 'MAERSK', code: 'EBS', name: 'Emergency Bunker Surcharge (global)',
    global: true, effective: '2026-03-25', effectiveUsRegulated: '2026-04-09', appliesToCargoAfloat: 'unspecified',
    amounts: { '20DV': 200, '40DV': 400, '40HC': 400, '45HC': 400, '20RF': 300, '40RF': 600 },
    backhaulAmounts: { '20DV': 100, '40DV': 200, '40HC': 200, '45HC': 200, '20RF': 150, '40RF': 300 },
    notes: 'Headhaul amounts shown; backhaul/intra-region is half. Maersk may adjust amounts with fuel prices; check maersk.com for later updates.',
    source: 'https://www.maersk.com/news/articles/2026/03/11/emergency-bunker-surcharge-ebs-global', confidence: 'primary',
  },
  {
    id: 'MSK-OCR-UGULF-2026', carrier: 'MAERSK', code: 'OCR', name: 'Emergency Operational Cost Recovery (to Upper Gulf)',
    destinationCountries: ['BH', 'QA', 'KW', 'IQ'], originExcludedCountries: ['CN', 'HK', 'TW', 'JP', 'KR', 'VN', 'TH', 'MY', 'SG', 'ID', 'PH', 'KH'], effective: '2026-09-17', effectiveUsRegulated: '2026-10-11', appliesToCargoAfloat: 'unspecified',
    amounts: { '20DV': 500, '40DV': 500, '40HC': 500, '45HC': 500, '20RF': 500, '40RF': 500, SPECIAL: 500 },
    notes: 'From worldwide origins excluding Far East Asia.',
    source: 'https://www.seatrade-maritime.com/tankers/maersk-and-msc-add-middle-east-gulf-ports-risk-surcharges', confidence: 'secondary',
  },
];

export const KNOWN_CARRIERS = [...new Set(ANNOUNCEMENTS.map((a) => a.carrier))];
