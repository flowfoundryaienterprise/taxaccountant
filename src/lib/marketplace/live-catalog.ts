import { api } from "@/convex/_generated/api";
import { publicConvexClient } from "@/lib/convex/public-client";
import { getCountry, type CountryEntry } from "./countries";

/** Convex decides publication. Local entries supply map coordinates and editorial context. */
export async function loadPublicCountries() {
  const rows = await publicConvexClient.query(api.taxonomy.publicCountryCatalog, {});
  return rows.flatMap(row => {
    const presentation = getCountry(row.code);
    if (!presentation) return [];
    const country: CountryEntry = {
      ...presentation,
      name: row.name,
      defaultLocale: row.defaultLocale,
      displayCurrency: row.displayCurrency,
      discoverable: true,
      status: "published",
    };
    return [{ country, jurisdictions: row.jurisdictions.map(jurisdiction => ({
      value: jurisdiction.code,
      label: jurisdiction.label,
      short: jurisdiction.label,
      countryCode: row.code,
    })) }];
  });
}
