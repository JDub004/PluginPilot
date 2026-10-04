import { z } from 'zod';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format JJJJ-MM-TT');

export const SituationSchema = z
  .object({
    dateOfDeath: isoDate.describe('Date of death (YYYY-MM-DD)'),
    knowledgeDate: isoDate
      .optional()
      .describe('Date the user learned of the death and of being an heir, if later than the date of death'),
    placeOfDeath: z.enum(['home', 'hospital_or_care_home', 'abroad']).default('home'),
    relationship: z.enum(['spouse_or_partner', 'child', 'parent', 'sibling', 'other']).default('child')
      .describe('Relationship of the user to the deceased'),
    deceasedReceivedPension: z.boolean().default(false).describe('The deceased received a statutory pension'),
    survivingSpouse: z.boolean().default(false).describe('A spouse or registered partner survives'),
    survivingSpouseFamilyInsured: z.boolean().default(false)
      .describe('The surviving spouse was co-insured (familienversichert) via the deceased'),
    childrenUnder27: z.boolean().default(false).describe('The deceased leaves children under 27 (possible orphan pension)'),
    deceasedEmployed: z.boolean().default(false),
    deceasedCivilServant: z.boolean().default(false).describe('Beamter/Beamtin or Versorgungsempfänger'),
    deceasedSelfEmployed: z.boolean().default(false).describe('Had a registered business (Gewerbe) or freelance activity'),
    receivedCareBenefits: z.boolean().default(false).describe('Received Pflegegeld or other care-insurance benefits'),
    rentedApartment: z.boolean().default(false).describe('The deceased lived in a rented apartment'),
    livedTogether: z.boolean().default(false).describe('The user lived in that apartment with the deceased'),
    ownedVehicle: z.boolean().default(false),
    willFound: z.boolean().default(false).describe('A handwritten or other testament has been found'),
    debtsSuspected: z.boolean().default(false).describe('The estate may be over-indebted'),
    deceasedLivedAbroad: z.boolean().default(false).describe('Last residence of the deceased was abroad'),
    hasLifeInsurance: z.boolean().default(false).describe('Life or funeral (Sterbegeld) insurance exists'),
  })
  .strict();
export type Situation = z.infer<typeof SituationSchema>;

export const StepSchema = z.object({
  id: z.string(),
  title: z.string(),
  phase: z.enum(['sofort', 'erste_woche', 'erste_wochen', 'spaeter']),
  dueDate: z.string().optional(),
  dueLabel: z.string(),
  daysLeft: z.number().optional(),
  overdue: z.boolean(),
  critical: z.boolean().describe('Missing it costs money or rights'),
  office: z.string(),
  documents: z.array(z.string()),
  why: z.string(),
  legalBasis: z.string().optional(),
  letterType: z.string().optional().describe('If set, draft_letter can prepare the letter for this step'),
  sourceUrl: z.string().url().optional().describe('Official text to read up on the rule'),
});
export type Step = z.infer<typeof StepSchema>;

export const PlanSchema = z.object({
  rulesVersion: z.string(),
  today: z.string(),
  heading: z.string(),
  intro: z.string(),
  phaseSet: z.enum(['default', 'geburt']).optional(),
  anchorLabel: z.string().describe('Event the plan is anchored to, e.g. "Todestag 28.09.2026"'),
  dateOfDeath: z.string().optional(),
  nextDeadline: StepSchema.optional(),
  steps: z.array(StepSchema),
  support: z.string(),
  disclaimer: z.string(),
});
export type Plan = z.infer<typeof PlanSchema>;
