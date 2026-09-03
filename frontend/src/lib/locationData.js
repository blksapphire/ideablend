// Standard list of country names. Small and stable enough to hand-embed -
// unlike a full city database (100,000+ places), this doesn't need an
// external package.
export const COUNTRIES = [
  'Nigeria', 'Ghana', 'Kenya', 'South Africa', 'Egypt', 'Morocco', 'Ethiopia',
  'Tanzania', 'Uganda', 'Rwanda', 'Senegal', 'Ivory Coast', 'Cameroon', 'Zambia',
  'Zimbabwe', 'Botswana', 'Namibia', 'Algeria', 'Tunisia', 'Angola',
  'United States', 'United Kingdom', 'Canada', 'Germany', 'France', 'Netherlands',
  'Ireland', 'Sweden', 'Spain', 'Italy', 'Portugal', 'Poland', 'Switzerland',
  'India', 'China', 'Japan', 'South Korea', 'Singapore', 'Philippines', 'Indonesia',
  'Pakistan', 'Bangladesh', 'Vietnam', 'Malaysia', 'Thailand',
  'United Arab Emirates', 'Saudi Arabia', 'Israel', 'Turkey',
  'Brazil', 'Mexico', 'Argentina', 'Colombia', 'Chile',
  'Australia', 'New Zealand'
].sort();

// A curated shortlist of major cities to suggest, biased toward this app's
// actual audience (African tech hubs) plus common global tech centers.
// This is NOT exhaustive - a true global city database is 100,000+ entries
// and impractical to bundle - so the field stays free-text with these as
// suggestions via <datalist>, not a locked dropdown.
export const CITY_SUGGESTIONS = [
  'Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Kano', 'Enugu', 'Benin City',
  'Accra', 'Kumasi', 'Nairobi', 'Mombasa', 'Kigali', 'Kampala', 'Dar es Salaam',
  'Cape Town', 'Johannesburg', 'Pretoria', 'Cairo', 'Casablanca', 'Addis Ababa',
  'Dakar', 'Abidjan',
  'London', 'Manchester', 'Dublin', 'Berlin', 'Amsterdam', 'Paris', 'Lisbon',
  'New York', 'San Francisco', 'Austin', 'Toronto', 'Vancouver',
  'Dubai', 'Bangalore', 'Mumbai', 'Singapore', 'Remote'
].sort();

// The browser already knows every real IANA timezone - no dataset needed,
// and it's always accurate/up to date, unlike a hand-maintained list.
export function getTimezones() {
  if (typeof Intl.supportedValuesOf === 'function') {
    return Intl.supportedValuesOf('timeZone');
  }
  // very old browser fallback - a short manual list covering major regions
  return ['UTC', 'Africa/Lagos', 'Africa/Cairo', 'Africa/Nairobi', 'Europe/London', 'America/New_York', 'Asia/Dubai'];
}
