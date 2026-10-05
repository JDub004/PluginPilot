import type { CityInput } from './schema.js';

/** Example company used in tests, the demo and the playground. Clearly fictional. */
export const SAMPLE_COMPANY: CityInput = {
  company: 'Beispiel GmbH (Demo)',
  apps: [
    { name: 'Microsoft 365', category: 'collaboration', department: 'Alle', users: 42, licenses: 50, monthlyCostEur: 600, owner: 'IT-Leitung', critical: true, approved: true, dataFlowsTo: ['SharePoint'] },
    { name: 'Slack', category: 'communication', department: 'Alle', users: 18, licenses: 25, monthlyCostEur: 175, owner: 'IT-Leitung', critical: false, approved: true, dataFlowsTo: [] },
    { name: 'Microsoft Teams', category: 'communication', department: 'Alle', users: 40, critical: false, approved: true, dataFlowsTo: [] },
    { name: 'SharePoint', category: 'storage', department: 'Alle', users: 40, owner: 'IT-Leitung', critical: true, approved: true, dataFlowsTo: [] },
    { name: 'Dropbox', category: 'storage', department: 'Marketing', users: 6, licenses: 10, monthlyCostEur: 150, critical: false, approved: false, dataFlowsTo: [] },
    { name: 'HubSpot', category: 'crm', department: 'Vertrieb', users: 9, licenses: 10, monthlyCostEur: 900, owner: 'Vertriebsleitung', critical: true, approved: true, renewalDate: '2026-12-31', noticePeriodDays: 60, dataFlowsTo: ['DATEV', 'Mailchimp'] },
    { name: 'Kundenliste.xlsx', category: 'spreadsheet', department: 'Vertrieb', users: 5, critical: true, approved: true, dataFlowsTo: [] },
    { name: 'Pipedrive', category: 'crm', department: 'Vertrieb', users: 3, licenses: 5, monthlyCostEur: 120, critical: false, approved: false, dataFlowsTo: [] },
    { name: 'DATEV', category: 'accounting', department: 'Buchhaltung', users: 3, licenses: 3, monthlyCostEur: 280, owner: 'Buchhaltung', critical: true, approved: true, dataFlowsTo: ['Steuerberater-Portal'] },
    { name: 'Lexoffice', category: 'accounting', department: 'Buchhaltung', users: 2, licenses: 2, monthlyCostEur: 40, critical: false, approved: true, dataFlowsTo: [] },
    { name: 'Personio', category: 'hr', department: 'Personal', users: 2, licenses: 2, monthlyCostEur: 350, owner: 'Personalleitung', critical: true, approved: true, dataFlowsTo: ['DATEV'] },
    { name: 'Mailchimp', category: 'marketing', department: 'Marketing', users: 3, licenses: 3, monthlyCostEur: 110, owner: 'Marketing', critical: false, approved: true, dataFlowsTo: [] },
    { name: 'Canva', category: 'marketing', department: 'Marketing', users: 4, licenses: 10, monthlyCostEur: 120, critical: false, approved: true, dataFlowsTo: [] },
    { name: 'Shopify', category: 'ecommerce', department: 'Vertrieb', users: 4, monthlyCostEur: 300, owner: 'E-Commerce', critical: true, approved: true, dataFlowsTo: ['HubSpot', 'DATEV'] },
    { name: 'Zendesk', category: 'support', department: 'Kundenservice', users: 6, licenses: 8, monthlyCostEur: 440, owner: 'Teamleitung Service', critical: true, approved: true, renewalDate: '2027-03-31', noticePeriodDays: 90, dataFlowsTo: ['HubSpot'] },
    { name: 'Power BI', category: 'analytics', department: 'Geschäftsführung', users: 3, licenses: 3, monthlyCostEur: 30, critical: false, approved: true, dataFlowsTo: [] },
    { name: 'Bitwarden', category: 'security', department: 'Alle', users: 35, licenses: 40, monthlyCostEur: 160, owner: 'IT-Leitung', critical: true, approved: true, dataFlowsTo: [] },
    { name: 'Lagerverwaltung', category: 'erp', department: 'Logistik', site: 'Lager Leipzig', users: 8, licenses: 8, monthlyCostEur: 260, owner: 'Lagerleitung', critical: true, approved: true, importance: 5, dataFlowsTo: ['Shopify', 'Spedition Nordlicht'] },
  ],
  people: [
    { name: 'Mara Beispiel', role: 'IT-Leitung', department: 'Alle', email: 'it@beispiel.example', phone: '+49 40 000000-10', responsibleFor: [] },
    { name: 'Tom Muster', role: 'Vertriebsleitung', department: 'Vertrieb', email: 'vertrieb@beispiel.example', responsibleFor: ['Kundenliste.xlsx'] },
    { name: 'Lena Demo', role: 'Buchhaltung', department: 'Buchhaltung', phone: '+49 40 000000-30', note: 'Vertretung: Steuerkanzlei', responsibleFor: [] },
    { name: 'Jonas Probe', role: 'Lagerleitung', department: 'Logistik', responsibleFor: [] },
    { name: 'Ada Fiktiv', role: 'Geschäftsführung', department: 'Geschäftsführung', responsibleFor: ['Power BI'] },
  ],
  sites: [
    { name: 'Zentrale Hamburg', city: 'Hamburg', employees: 38, main: true },
    { name: 'Lager Leipzig', city: 'Leipzig', employees: 9, main: false },
  ],
  partners: [
    { name: 'Steuerkanzlei Beispiel', kind: 'service_provider', city: 'Hamburg', connectedApps: ['DATEV'] },
    { name: 'Spedition Nordlicht', kind: 'supplier', city: 'Bremen', connectedApps: ['Lagerverwaltung'] },
    { name: 'Systemhaus Muster', kind: 'service_provider', city: 'Berlin', contact: 'Support-Hotline', connectedApps: ['Microsoft 365', 'Bitwarden'] },
    { name: 'Großkunde Alpen AG', kind: 'customer', city: 'Wien', connectedApps: ['Shopify'] },
  ],
};
