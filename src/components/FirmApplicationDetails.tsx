const FIRM_FIELDS = [
  { key: "firmName", legacyKey: "firm_name", label: "Registered Firm Name" },
  { key: "firmAddress", legacyKey: "firm_address", label: "Firm Office Address" },
  { key: "firmContactRegistrationNumber", legacyKey: "firm_contact_registration_number", label: "Company Registration Number" },
  { key: "firmContactResidence", legacyKey: "firm_contact_residence", label: "Contact Residence" },
  { key: "firmMainBusinessActivity", legacyKey: "firm_main_business_activity", label: "Main Business Activity" },
  { key: "firmCountryOfIncorporation", legacyKey: "firm_country_of_incorporation", label: "Country of Incorporation" },
  { key: "firmPrincipalPlaceOfBusiness", legacyKey: "firm_principal_place_of_business", label: "Principal Place of Business" },
] as const;

type FirmDetails = Record<(typeof FIRM_FIELDS)[number]["key"], string>;

export function mapFirmApplicationDetails(application: Record<string, unknown>): FirmDetails {
  return Object.fromEntries(FIRM_FIELDS.map(({ key, legacyKey }) => [key, String(application[key] ?? application[legacyKey] ?? "")])) as FirmDetails;
}

interface Shareholder {
  id?: string;
  fullName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  citizenship?: string | null;
  shareholdingPercentage?: string | number | null;
  riqsMembershipId?: string | null;
}

function DetailRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 rounded px-2.5 py-1.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-right text-sm font-medium text-zinc-900 dark:text-zinc-100 whitespace-pre-wrap">{value === null || value === undefined || String(value).trim() === "" ? "Not provided" : value}</dd>
    </div>
  );
}

export function FirmApplicationDetails({ details, shareholders, declarationsAccepted }: { details: FirmDetails; shareholders: Shareholder[]; declarationsAccepted?: boolean | null }) {
  return (
    <>
      <section aria-labelledby="firm-information-heading" className="rounded-xl border border-zinc-100 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 id="firm-information-heading" className="border-b border-zinc-100 px-4 py-3 text-sm font-bold text-navy dark:border-zinc-800">Firm Information</h2>
        <dl className="space-y-2.5 p-4">
          {FIRM_FIELDS.map(({ key, label }) => <DetailRow key={key} label={label} value={details[key]} />)}
        </dl>
      </section>
      <section aria-labelledby="firm-shareholders-heading" className="rounded-xl border border-zinc-100 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 id="firm-shareholders-heading" className="border-b border-zinc-100 px-4 py-3 text-sm font-bold text-navy dark:border-zinc-800">Firm Shareholders ({shareholders.length})</h2>
        <div className="space-y-3 p-4">
          {shareholders.length === 0 ? <p className="text-sm text-muted-foreground">No shareholder records provided.</p> : shareholders.map((shareholder, index) => (
            <div key={shareholder.id || index} className="rounded border border-zinc-100 p-2.5 dark:border-zinc-800">
              <h3 className="mb-2 px-2.5 text-sm font-semibold text-navy">Shareholder {index + 1}</h3>
              <dl className="space-y-1">
                <DetailRow label="Shareholder Name" value={shareholder.fullName} />
                <DetailRow label="Email Address" value={shareholder.email} />
                <DetailRow label="Phone Number" value={shareholder.phoneNumber} />
                <DetailRow label="Share (%)" value={shareholder.shareholdingPercentage != null && String(shareholder.shareholdingPercentage).trim() !== "" ? `${shareholder.shareholdingPercentage}%` : null} />
                {shareholder.riqsMembershipId?.trim() && <DetailRow label="RIQS Membership ID" value={shareholder.riqsMembershipId} />}
                <DetailRow label="Citizenship" value={shareholder.citizenship} />
              </dl>
            </div>
          ))}
        </div>
      </section>
      <section aria-labelledby="firm-declarations-heading" className="rounded-xl border border-zinc-100 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 id="firm-declarations-heading" className="border-b border-zinc-100 px-4 py-3 text-sm font-bold text-navy dark:border-zinc-800">Firm Declarations</h2>
        <dl className="p-4">
          <DetailRow label="Beneficial ownership, compliance undertaking and terms" value={declarationsAccepted === true ? "Accepted" : declarationsAccepted === false ? "Not accepted" : "Not recorded"} />
        </dl>
      </section>
    </>
  );
}
