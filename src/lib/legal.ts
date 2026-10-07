/**
 * Business details shown on the public legal pages (/privacy, /terms,
 * /delete-account). Google Play links to these pages from the store listing,
 * so they must be accurate before the app is submitted.
 *
 * TODO(before Play submission): replace every `FILL_ME` value with the real
 * registered details.
 */
export const LEGAL = {
  appName: 'IrriKart',
  /** Registered business name (proprietorship / LLP / Pvt Ltd). */
  entity: 'FILL_ME — registered business name',
  /** Registered office address. */
  address: 'FILL_ME — registered office address, India',
  supportEmail: 'FILL_ME@irrikart.com',
  /** Grievance Officer under the DPDP Act 2023 / IT Rules 2011. */
  grievanceOfficer: 'FILL_ME — name of grievance officer',
  whatsApp: '+91 97110 91823',
  whatsAppLink: 'https://wa.me/919711091823',
  effectiveDate: '7 October 2026',
} as const;
