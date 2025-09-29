const APP_NAME = 'Currency Converter';
const CONTACT_EMAIL = 'andrica.nuta@gmail.com';
const RATE_SOURCE_URL = 'https://api.frankfurter.dev/v1';
const LAST_UPDATED = new Date().toISOString().slice(0, 10);
const LINKEDIN_URL = 'https://www.linkedin.com/in/andreeanuta/';

// --- About ---
export const aboutText = `
${APP_NAME} is a personal project developed by Andrica Cristina to learn and showcase React Native + TypeScript.
Exchange rates are fetched from the Frankfurter API (${RATE_SOURCE_URL}) and refresh roughly once per day.

Connect with me on LinkedIn: ${LINKEDIN_URL}

This app is not a financial service and should be used for general information only.
`;

// --- Privacy Policy ---
export const privacyPolicyText = `
Last updated: ${LAST_UPDATED}

• ${APP_NAME} does not collect, store, or sell your personal data.
• Images are processed on your device to detect prices. Photos are not uploaded to our servers.
• The app connects to the internet only to fetch currency exchange rates from the Frankfurter API (${RATE_SOURCE_URL}).
• Permissions: Camera and Photo Library are used only for scanning or selecting images. You can revoke them any time in your device Settings.
• No analytics, tracking, or advertising SDKs are used.
• Children’s privacy: ${APP_NAME} is not directed to children under 13. Do not use the app if local laws require parental consent.

Changes
We may update this Privacy Policy inside the app. Continued use means you accept the updated version.

Contact
Questions? Write to ${CONTACT_EMAIL}.
`;

// --- Terms of Use ---
export const termsOfUseText = `
Purpose
${APP_NAME} is provided for learning and demonstration purposes. It is not a financial product.

Data Source & Refresh
Exchange rates are provided by the Frankfurter API (${RATE_SOURCE_URL}) and typically update once per day. We do not guarantee accuracy, availability, or timeliness.

No Financial Advice
All information is for general reference only. Do not use the app for trading or other financial decisions without verifying rates independently.

Your Responsibilities
Use the app lawfully and respectfully. Do not reverse engineer, misuse the service, or attempt to interfere with its operation.

Warranties & Liability
${APP_NAME} is provided “as is”, without any warranties (express or implied). To the maximum extent permitted by law, the author is not liable for any loss, damage, or decisions made based on information shown in the app.

Changes
We may update these Terms within the app. Continued use means you accept the updated version.

Contact
Questions? Write to ${CONTACT_EMAIL}.
`;
