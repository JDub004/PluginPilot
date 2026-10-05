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
    { name: 'HubSpot', category: 'crm', department: 'Vertrieb', users: 9, licenses: 10, monthlyCostEur: 900, owner: 'Vertriebsleitung', critical: true, approved: true, dataFlowsTo: ['DATEV', 'Mailchimp'] },
    { name: 'Kundenliste.xlsx', category: 'spreadsheet', department: 'Vertrieb', users: 5, critical: true, approved: true, dataFlowsTo: [] },
    { name: 'Pipedrive', category: 'crm', department: 'Vertrieb', users: 3, licenses: 5, monthlyCostEur: 120, critical: false, approved: false, dataFlowsTo: [] },
    { name: 'DATEV', category: 'accounting', department: 'Buchhaltung', users: 3, licenses: 3, monthlyCostEur: 280, owner: 'Buchhaltung', critical: true, approved: true, dataFlowsTo: ['Steuerberater-Portal'] },
    { name: 'Lexoffice', category: 'accounting', department: 'Buchhaltung', users: 2, licenses: 2, monthlyCostEur: 40, critical: false, approved: true, dataFlowsTo: [] },
    { name: 'Personio', category: 'hr', department: 'Personal', users: 2, licenses: 2, monthlyCostEur: 350, owner: 'Personalleitung', critical: true, approved: true, dataFlowsTo: ['DATEV'] },
    { name: 'Mailchimp', category: 'marketing', department: 'Marketing', users: 3, licenses: 3, monthlyCostEur: 110, owner: 'Marketing', critical: false, approved: true, dataFlowsTo: [] },
    { name: 'Canva', category: 'marketing', department: 'Marketing', users: 4, licenses: 10, monthlyCostEur: 120, critical: false, approved: true, dataFlowsTo: [] },
    { name: 'Shopify', category: 'ecommerce', department: 'Vertrieb', users: 4, monthlyCostEur: 300, owner: 'E-Commerce', critical: true, approved: true, dataFlowsTo: ['HubSpot', 'DATEV'] },
    { name: 'Zendesk', category: 'support', department: 'Kundenservice', users: 6, licenses: 8, monthlyCostEur: 440, owner: 'Teamleitung Service', critical: true, approved: true, dataFlowsTo: ['HubSpot'] },
    { name: 'Power BI', category: 'analytics', department: 'Geschäftsführung', users: 3, licenses: 3, monthlyCostEur: 30, critical: false, approved: true, dataFlowsTo: [] },
    { name: 'Bitwarden', category: 'security', department: 'Alle', users: 35, licenses: 40, monthlyCostEur: 160, owner: 'IT-Leitung', critical: true, approved: true, dataFlowsTo: [] },
  ],
};
