// CO2KostAufG (Kohlendioxidkostenaufteilungsgesetz), stage model for residential buildings
// (Anlage zu §§ 5-7). Applies to billing periods starting on or after 2023-01-01.
// Each stage: emissions in kg CO2 per m² living area per year → landlord share in percent.

export const CO2_STAGES: ReadonlyArray<{ upTo: number; landlordPercent: number }> = [
  { upTo: 12, landlordPercent: 0 },
  { upTo: 17, landlordPercent: 10 },
  { upTo: 22, landlordPercent: 20 },
  { upTo: 27, landlordPercent: 30 },
  { upTo: 32, landlordPercent: 40 },
  { upTo: 37, landlordPercent: 50 },
  { upTo: 42, landlordPercent: 60 },
  { upTo: 47, landlordPercent: 70 },
  { upTo: 52, landlordPercent: 80 },
  { upTo: Infinity, landlordPercent: 95 },
];

export const CO2_LAW_START = '2023-01-01';

export function landlordCo2Percent(kgPerSqmYear: number): number {
  for (const stage of CO2_STAGES) if (kgPerSqmYear < stage.upTo) return stage.landlordPercent;
  return 95;
}
