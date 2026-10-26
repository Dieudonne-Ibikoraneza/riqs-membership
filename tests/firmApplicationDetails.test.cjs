const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

const filename = path.resolve(__dirname, '../src/components/FirmApplicationDetails.tsx');
const component = new Module(filename, module);
component.filename = filename;
component.paths = Module._nodeModulePaths(path.dirname(filename));
component._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText, filename);
const { FirmApplicationDetails, mapFirmApplicationDetails } = component.exports;

const apiApplication = {
  firmName: 'Example Surveyors Ltd', firmAddress: 'KN 3 Rd',
  firmContactRegistrationNumber: '102345678', firmContactResidence: 'Kigali, Rwanda',
  firmMainBusinessActivity: 'Quantity Surveying', firmCountryOfIncorporation: 'Rwanda',
  firmPrincipalPlaceOfBusiness: 'Kigali Heights, 3rd Floor',
};

test('all seven firm fields from the staff API render with their form labels', () => {
  const details = mapFirmApplicationDetails(apiApplication);
  const html = renderToStaticMarkup(React.createElement(FirmApplicationDetails, { details, shareholders: [], declarationsAccepted: true }));
  for (const value of Object.values(apiApplication)) assert.ok(html.includes(value), value);
  for (const label of ['Registered Firm Name', 'Firm Office Address', 'Company Registration Number', 'Contact Residence', 'Main Business Activity', 'Country of Incorporation', 'Principal Place of Business']) assert.ok(html.includes(label), label);
  assert.ok(html.includes('Firm Declarations'));
  assert.ok(html.includes('Accepted'));
});

test('shareholder identities, contact details, ownership and citizenship are visible', () => {
  const html = renderToStaticMarkup(React.createElement(FirmApplicationDetails, {
    details: mapFirmApplicationDetails(apiApplication),
    shareholders: [
      { id: 'one', fullName: 'Alice Example', email: 'alice@example.com', phoneNumber: '+250788123456', citizenship: 'Rwandan', shareholdingPercentage: '65.50', riqsMembershipId: 'RIQS-2026-PrQS-0001' },
      { id: 'two', fullName: 'Bob Example', email: 'bob@example.com', phoneNumber: '+254700123456', citizenship: 'Kenyan', shareholdingPercentage: 34.5 },
    ],
  }));
  for (const value of ['Alice Example', 'alice@example.com', '+250788123456', 'Rwandan', '65.50%', 'RIQS-2026-PrQS-0001', 'Bob Example', 'Kenyan', '34.5%']) assert.ok(html.includes(value), value);
  assert.equal((html.match(/RIQS Membership ID/g) || []).length, 1);
});

test('missing or blank optional RIQS membership IDs are omitted', () => {
  for (const riqsMembershipId of [undefined, null, '', '   ']) {
    const html = renderToStaticMarkup(React.createElement(FirmApplicationDetails, {
      details: mapFirmApplicationDetails(apiApplication),
      shareholders: [{ fullName: 'Shareholder', riqsMembershipId }],
    }));
    assert.ok(!html.includes('RIQS Membership ID'));
    assert.ok(html.includes('Shareholder Name'));
  }
});

test('older snake-case responses remain readable and canonical values take precedence', () => {
  const legacy = { firm_name: 'Legacy Ltd', firm_address: 'Legacy office', firm_contact_registration_number: '123', firm_contact_residence: 'Local residence', firm_main_business_activity: 'Surveying', firm_country_of_incorporation: 'Rwanda', firm_principal_place_of_business: 'Local office' };
  const details = mapFirmApplicationDetails(legacy);
  assert.deepEqual(Object.values(details), Object.values(legacy));
  assert.equal(mapFirmApplicationDetails({ ...legacy, firmName: 'Current Ltd' }).firmName, 'Current Ltd');
});

test('missing information is explicit and shareholder text is escaped', () => {
  const html = renderToStaticMarkup(React.createElement(FirmApplicationDetails, { details: mapFirmApplicationDetails({}), shareholders: [], declarationsAccepted: null }));
  assert.equal((html.match(/Not provided/g) || []).length, 7);
  assert.ok(html.includes('No shareholder records provided.'));
  assert.ok(html.includes('Not recorded'));
  const unsafe = renderToStaticMarkup(React.createElement(FirmApplicationDetails, { details: mapFirmApplicationDetails({}), shareholders: [{ fullName: '<script>alert(1)</script>', shareholdingPercentage: 0 }] }));
  assert.ok(!unsafe.includes('<script>'));
  assert.ok(unsafe.includes('0%'));
});
