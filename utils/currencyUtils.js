/**
 * currencyUtils.js
 * Maps country (as stored in User.country) to currency symbol + code.
 * Usage:
 *   import { getCurrency, formatBalance } from './currencyUtils.js';
 *   const { symbol, code } = getCurrency(user.country);
 *   const display = formatBalance(user.balance, user.country); // "₦ 84,520.00"
 */

const COUNTRY_CURRENCY_MAP = {
  // A
  Afganistan: { symbol: "؋", code: "AFN", name: "Afghan Afghani" },
  Albania: { symbol: "L", code: "ALL", name: "Albanian Lek" },
  Algeria: { symbol: "دج", code: "DZD", name: "Algerian Dinar" },
  "American Samoa": { symbol: "$", code: "USD", name: "US Dollar" },
  Andorra: { symbol: "€", code: "EUR", name: "Euro" },
  Angola: { symbol: "Kz", code: "AOA", name: "Angolan Kwanza" },
  Anguilla: { symbol: "$", code: "XCD", name: "East Caribbean Dollar" },
  "Antigua & Barbuda": {
    symbol: "$",
    code: "XCD",
    name: "East Caribbean Dollar",
  },
  Argentina: { symbol: "$", code: "ARS", name: "Argentine Peso" },
  Armenia: { symbol: "֏", code: "AMD", name: "Armenian Dram" },
  Aruba: { symbol: "ƒ", code: "AWG", name: "Aruban Florin" },
  Australia: { symbol: "A$", code: "AUD", name: "Australian Dollar" },
  Austria: { symbol: "€", code: "EUR", name: "Euro" },
  Azerbaijan: { symbol: "₼", code: "AZN", name: "Azerbaijani Manat" },

  // B
  Bahamas: { symbol: "$", code: "BSD", name: "Bahamian Dollar" },
  Bahrain: { symbol: "BD", code: "BHD", name: "Bahraini Dinar" },
  Bangladesh: { symbol: "৳", code: "BDT", name: "Bangladeshi Taka" },
  Barbados: { symbol: "$", code: "BBD", name: "Barbadian Dollar" },
  Belarus: { symbol: "Br", code: "BYN", name: "Belarusian Ruble" },
  Belgium: { symbol: "€", code: "EUR", name: "Euro" },
  Belize: { symbol: "$", code: "BZD", name: "Belize Dollar" },
  Benin: { symbol: "Fr", code: "XOF", name: "West African CFA Franc" },
  Bermuda: { symbol: "$", code: "BMD", name: "Bermudian Dollar" },
  Bhutan: { symbol: "Nu", code: "BTN", name: "Bhutanese Ngultrum" },
  Bolivia: { symbol: "Bs", code: "BOB", name: "Bolivian Boliviano" },
  Bonaire: { symbol: "$", code: "USD", name: "US Dollar" },
  "Bosnia & Herzegovina": {
    symbol: "KM",
    code: "BAM",
    name: "Bosnia-Herzegovina Convertible Mark",
  },
  Botswana: { symbol: "P", code: "BWP", name: "Botswana Pula" },
  Brazil: { symbol: "R$", code: "BRL", name: "Brazilian Real" },
  "British Indian Ocean Ter": { symbol: "$", code: "USD", name: "US Dollar" },
  Brunei: { symbol: "$", code: "BND", name: "Brunei Dollar" },
  Bulgaria: { symbol: "лв", code: "BGN", name: "Bulgarian Lev" },
  "Burkina Faso": { symbol: "Fr", code: "XOF", name: "West African CFA Franc" },
  Burundi: { symbol: "Fr", code: "BIF", name: "Burundian Franc" },

  // C
  Cambodia: { symbol: "៛", code: "KHR", name: "Cambodian Riel" },
  Cameroon: { symbol: "Fr", code: "XAF", name: "Central African CFA Franc" },
  Canada: { symbol: "C$", code: "CAD", name: "Canadian Dollar" },
  "Canary Islands": { symbol: "€", code: "EUR", name: "Euro" },
  "Cape Verde": { symbol: "$", code: "CVE", name: "Cape Verdean Escudo" },
  "Cayman Islands": { symbol: "$", code: "KYD", name: "Cayman Islands Dollar" },
  "Central African Republic": {
    symbol: "Fr",
    code: "XAF",
    name: "Central African CFA Franc",
  },
  Chad: { symbol: "Fr", code: "XAF", name: "Central African CFA Franc" },
  "Channel Islands": { symbol: "£", code: "GBP", name: "British Pound" },
  Chile: { symbol: "$", code: "CLP", name: "Chilean Peso" },
  China: { symbol: "¥", code: "CNY", name: "Chinese Yuan" },
  "Christmas Island": { symbol: "A$", code: "AUD", name: "Australian Dollar" },
  "Cocos Island": { symbol: "A$", code: "AUD", name: "Australian Dollar" },
  Colombia: { symbol: "$", code: "COP", name: "Colombian Peso" },
  Comoros: { symbol: "Fr", code: "KMF", name: "Comorian Franc" },
  Congo: { symbol: "Fr", code: "XAF", name: "Central African CFA Franc" },
  "Cook Islands": { symbol: "$", code: "NZD", name: "New Zealand Dollar" },
  "Costa Rica": { symbol: "₡", code: "CRC", name: "Costa Rican Colón" },
  "Cote DIvoire": { symbol: "Fr", code: "XOF", name: "West African CFA Franc" },
  Croatia: { symbol: "€", code: "EUR", name: "Euro" },
  Cuba: { symbol: "$", code: "CUP", name: "Cuban Peso" },
  Curaco: { symbol: "ƒ", code: "ANG", name: "Netherlands Antillean Guilder" },
  Cyprus: { symbol: "€", code: "EUR", name: "Euro" },
  "Czech Republic": { symbol: "Kč", code: "CZK", name: "Czech Koruna" },

  // D
  Denmark: { symbol: "kr", code: "DKK", name: "Danish Krone" },
  Djibouti: { symbol: "Fr", code: "DJF", name: "Djiboutian Franc" },
  Dominica: { symbol: "$", code: "XCD", name: "East Caribbean Dollar" },
  "Dominican Republic": { symbol: "$", code: "DOP", name: "Dominican Peso" },

  // E
  "East Timor": { symbol: "$", code: "USD", name: "US Dollar" },
  Ecuador: { symbol: "$", code: "USD", name: "US Dollar" },
  Egypt: { symbol: "£", code: "EGP", name: "Egyptian Pound" },
  "El Salvador": { symbol: "$", code: "USD", name: "US Dollar" },
  "Equatorial Guinea": {
    symbol: "Fr",
    code: "XAF",
    name: "Central African CFA Franc",
  },
  Eritrea: { symbol: "Nfk", code: "ERN", name: "Eritrean Nakfa" },
  Estonia: { symbol: "€", code: "EUR", name: "Euro" },
  Ethiopia: { symbol: "Br", code: "ETB", name: "Ethiopian Birr" },

  // F
  "Falkland Islands": {
    symbol: "£",
    code: "FKP",
    name: "Falkland Islands Pound",
  },
  "Faroe Islands": { symbol: "kr", code: "DKK", name: "Danish Krone" },
  Fiji: { symbol: "$", code: "FJD", name: "Fijian Dollar" },
  Finland: { symbol: "€", code: "EUR", name: "Euro" },
  France: { symbol: "€", code: "EUR", name: "Euro" },
  "French Guiana": { symbol: "€", code: "EUR", name: "Euro" },
  "French Polynesia": { symbol: "Fr", code: "XPF", name: "CFP Franc" },
  "French Southern Ter": { symbol: "€", code: "EUR", name: "Euro" },

  // G
  Gabon: { symbol: "Fr", code: "XAF", name: "Central African CFA Franc" },
  Gambia: { symbol: "D", code: "GMD", name: "Gambian Dalasi" },
  Georgia: { symbol: "₾", code: "GEL", name: "Georgian Lari" },
  Germany: { symbol: "€", code: "EUR", name: "Euro" },
  Ghana: { symbol: "₵", code: "GHS", name: "Ghanaian Cedi" },
  Gibraltar: { symbol: "£", code: "GIP", name: "Gibraltar Pound" },
  "Great Britain": { symbol: "£", code: "GBP", name: "British Pound" },
  Greece: { symbol: "€", code: "EUR", name: "Euro" },
  Greenland: { symbol: "kr", code: "DKK", name: "Danish Krone" },
  Grenada: { symbol: "$", code: "XCD", name: "East Caribbean Dollar" },
  Guadeloupe: { symbol: "€", code: "EUR", name: "Euro" },
  Guam: { symbol: "$", code: "USD", name: "US Dollar" },
  Guatemala: { symbol: "Q", code: "GTQ", name: "Guatemalan Quetzal" },
  Guinea: { symbol: "Fr", code: "GNF", name: "Guinean Franc" },
  Guyana: { symbol: "$", code: "GYD", name: "Guyanese Dollar" },

  // H
  Haiti: { symbol: "G", code: "HTG", name: "Haitian Gourde" },
  Hawaii: { symbol: "$", code: "USD", name: "US Dollar" },
  Honduras: { symbol: "L", code: "HNL", name: "Honduran Lempira" },
  "Hong Kong": { symbol: "HK$", code: "HKD", name: "Hong Kong Dollar" },
  Hungary: { symbol: "Ft", code: "HUF", name: "Hungarian Forint" },

  // I
  Iceland: { symbol: "kr", code: "ISK", name: "Icelandic Króna" },
  India: { symbol: "₹", code: "INR", name: "Indian Rupee" },
  Indonesia: { symbol: "Rp", code: "IDR", name: "Indonesian Rupiah" },
  Iran: { symbol: "﷼", code: "IRR", name: "Iranian Rial" },
  Iraq: { symbol: "ع.د", code: "IQD", name: "Iraqi Dinar" },
  Ireland: { symbol: "€", code: "EUR", name: "Euro" },
  "Isle of Man": { symbol: "£", code: "GBP", name: "British Pound" },
  Israel: { symbol: "₪", code: "ILS", name: "Israeli New Shekel" },
  Italy: { symbol: "€", code: "EUR", name: "Euro" },

  // J
  Jamaica: { symbol: "$", code: "JMD", name: "Jamaican Dollar" },
  Japan: { symbol: "¥", code: "JPY", name: "Japanese Yen" },
  Jordan: { symbol: "JD", code: "JOD", name: "Jordanian Dinar" },

  // K
  Kazakhstan: { symbol: "₸", code: "KZT", name: "Kazakhstani Tenge" },
  Kenya: { symbol: "KSh", code: "KES", name: "Kenyan Shilling" },
  Kiribati: { symbol: "A$", code: "AUD", name: "Australian Dollar" },
  "Korea North": { symbol: "₩", code: "KPW", name: "North Korean Won" },
  "Korea Sout": { symbol: "₩", code: "KRW", name: "South Korean Won" },
  Kuwait: { symbol: "KD", code: "KWD", name: "Kuwaiti Dinar" },
  Kyrgyzstan: { symbol: "с", code: "KGS", name: "Kyrgystani Som" },

  // L
  Laos: { symbol: "₭", code: "LAK", name: "Laotian Kip" },
  Latvia: { symbol: "€", code: "EUR", name: "Euro" },
  Lebanon: { symbol: "£", code: "LBP", name: "Lebanese Pound" },
  Lesotho: { symbol: "L", code: "LSL", name: "Lesotho Loti" },
  Liberia: { symbol: "$", code: "LRD", name: "Liberian Dollar" },
  Libya: { symbol: "LD", code: "LYD", name: "Libyan Dinar" },
  Liechtenstein: { symbol: "Fr", code: "CHF", name: "Swiss Franc" },
  Lithuania: { symbol: "€", code: "EUR", name: "Euro" },
  Luxembourg: { symbol: "€", code: "EUR", name: "Euro" },

  // M
  Macau: { symbol: "P", code: "MOP", name: "Macanese Pataca" },
  Macedonia: { symbol: "ден", code: "MKD", name: "Macedonian Denar" },
  Madagascar: { symbol: "Ar", code: "MGA", name: "Malagasy Ariary" },
  Malaysia: { symbol: "RM", code: "MYR", name: "Malaysian Ringgit" },
  Malawi: { symbol: "MK", code: "MWK", name: "Malawian Kwacha" },
  Maldives: { symbol: "Rf", code: "MVR", name: "Maldivian Rufiyaa" },
  Mali: { symbol: "Fr", code: "XOF", name: "West African CFA Franc" },
  Malta: { symbol: "€", code: "EUR", name: "Euro" },
  "Marshall Islands": { symbol: "$", code: "USD", name: "US Dollar" },
  Martinique: { symbol: "€", code: "EUR", name: "Euro" },
  Mauritania: { symbol: "UM", code: "MRU", name: "Mauritanian Ouguiya" },
  Mauritius: { symbol: "₨", code: "MUR", name: "Mauritian Rupee" },
  Mayotte: { symbol: "€", code: "EUR", name: "Euro" },
  Mexico: { symbol: "$", code: "MXN", name: "Mexican Peso" },
  "Midway Islands": { symbol: "$", code: "USD", name: "US Dollar" },
  Moldova: { symbol: "L", code: "MDL", name: "Moldovan Leu" },
  Monaco: { symbol: "€", code: "EUR", name: "Euro" },
  Mongolia: { symbol: "₮", code: "MNT", name: "Mongolian Tugrik" },
  Montserrat: { symbol: "$", code: "XCD", name: "East Caribbean Dollar" },
  Morocco: { symbol: "MAD", code: "MAD", name: "Moroccan Dirham" },
  Mozambique: { symbol: "MT", code: "MZN", name: "Mozambican Metical" },
  Myanmar: { symbol: "K", code: "MMK", name: "Myanmar Kyat" },

  // N
  Nambia: { symbol: "$", code: "NAD", name: "Namibian Dollar" },
  Nauru: { symbol: "A$", code: "AUD", name: "Australian Dollar" },
  Nepal: { symbol: "₨", code: "NPR", name: "Nepalese Rupee" },
  "Netherland Antilles": {
    symbol: "ƒ",
    code: "ANG",
    name: "Netherlands Antillean Guilder",
  },
  Netherlands: { symbol: "€", code: "EUR", name: "Euro" },
  Nevis: { symbol: "$", code: "XCD", name: "East Caribbean Dollar" },
  "New Caledonia": { symbol: "Fr", code: "XPF", name: "CFP Franc" },
  "New Zealand": { symbol: "NZ$", code: "NZD", name: "New Zealand Dollar" },
  Nicaragua: { symbol: "C$", code: "NIO", name: "Nicaraguan Córdoba" },
  Niger: { symbol: "Fr", code: "XOF", name: "West African CFA Franc" },
  Nigeria: { symbol: "₦", code: "NGN", name: "Nigerian Naira" },
  Niue: { symbol: "NZ$", code: "NZD", name: "New Zealand Dollar" },
  "Norfolk Island": { symbol: "A$", code: "AUD", name: "Australian Dollar" },
  Norway: { symbol: "kr", code: "NOK", name: "Norwegian Krone" },

  // O
  Oman: { symbol: "﷼", code: "OMR", name: "Omani Rial" },

  // P
  Pakistan: { symbol: "₨", code: "PKR", name: "Pakistani Rupee" },
  "Palau Island": { symbol: "$", code: "USD", name: "US Dollar" },
  Palestine: { symbol: "₪", code: "ILS", name: "Israeli New Shekel" },
  Panama: { symbol: "B/.", code: "PAB", name: "Panamanian Balboa" },
  "Papua New Guinea": {
    symbol: "K",
    code: "PGK",
    name: "Papua New Guinean Kina",
  },
  Paraguay: { symbol: "₲", code: "PYG", name: "Paraguayan Guaraní" },
  Peru: { symbol: "S/", code: "PEN", name: "Peruvian Sol" },
  Phillipines: { symbol: "₱", code: "PHP", name: "Philippine Peso" },
  "Pitcairn Island": { symbol: "NZ$", code: "NZD", name: "New Zealand Dollar" },
  Poland: { symbol: "zł", code: "PLN", name: "Polish Złoty" },
  Portugal: { symbol: "€", code: "EUR", name: "Euro" },
  "Puerto Rico": { symbol: "$", code: "USD", name: "US Dollar" },

  // Q
  Qatar: { symbol: "﷼", code: "QAR", name: "Qatari Riyal" },

  // R
  "Republic of Montenegro": { symbol: "€", code: "EUR", name: "Euro" },
  "Republic of Serbia": { symbol: "din", code: "RSD", name: "Serbian Dinar" },
  Reunion: { symbol: "€", code: "EUR", name: "Euro" },
  Romania: { symbol: "lei", code: "RON", name: "Romanian Leu" },
  Russia: { symbol: "₽", code: "RUB", name: "Russian Ruble" },
  Rwanda: { symbol: "Fr", code: "RWF", name: "Rwandan Franc" },

  // S
  "St Barthelemy": { symbol: "€", code: "EUR", name: "Euro" },
  "St Eustatius": { symbol: "$", code: "USD", name: "US Dollar" },
  "St Helena": { symbol: "£", code: "SHP", name: "Saint Helena Pound" },
  "St Kitts-Nevis": { symbol: "$", code: "XCD", name: "East Caribbean Dollar" },
  "St Lucia": { symbol: "$", code: "XCD", name: "East Caribbean Dollar" },
  "St Maarten": {
    symbol: "ƒ",
    code: "ANG",
    name: "Netherlands Antillean Guilder",
  },
  "St Pierre & Miquelon": { symbol: "€", code: "EUR", name: "Euro" },
  "St Vincent & Grenadines": {
    symbol: "$",
    code: "XCD",
    name: "East Caribbean Dollar",
  },
  Saipan: { symbol: "$", code: "USD", name: "US Dollar" },
  Samoa: { symbol: "T", code: "WST", name: "Samoan Tālā" },
  "Samoa American": { symbol: "$", code: "USD", name: "US Dollar" },
  "San Marino": { symbol: "€", code: "EUR", name: "Euro" },
  "Sao Tome & Principe": {
    symbol: "Db",
    code: "STN",
    name: "São Tomé & Príncipe Dobra",
  },
  "Saudi Arabia": { symbol: "﷼", code: "SAR", name: "Saudi Riyal" },
  Senegal: { symbol: "Fr", code: "XOF", name: "West African CFA Franc" },
  Serbia: { symbol: "din", code: "RSD", name: "Serbian Dinar" },
  Seychelles: { symbol: "₨", code: "SCR", name: "Seychellois Rupee" },
  "Sierra Leone": { symbol: "Le", code: "SLL", name: "Sierra Leonean Leone" },
  Singapore: { symbol: "S$", code: "SGD", name: "Singapore Dollar" },
  Slovakia: { symbol: "€", code: "EUR", name: "Euro" },
  Slovenia: { symbol: "€", code: "EUR", name: "Euro" },
  "Solomon Islands": {
    symbol: "$",
    code: "SBD",
    name: "Solomon Islands Dollar",
  },
  Somalia: { symbol: "Sh", code: "SOS", name: "Somali Shilling" },
  "South Africa": { symbol: "R", code: "ZAR", name: "South African Rand" },
  Spain: { symbol: "€", code: "EUR", name: "Euro" },
  "Sri Lanka": { symbol: "₨", code: "LKR", name: "Sri Lankan Rupee" },
  Sudan: { symbol: "£", code: "SDG", name: "Sudanese Pound" },
  Suriname: { symbol: "$", code: "SRD", name: "Surinamese Dollar" },
  Swaziland: { symbol: "L", code: "SZL", name: "Swazi Lilangeni" },
  Sweden: { symbol: "kr", code: "SEK", name: "Swedish Krona" },
  Switzerland: { symbol: "Fr", code: "CHF", name: "Swiss Franc" },
  Syria: { symbol: "£", code: "SYP", name: "Syrian Pound" },

  // T
  Tahiti: { symbol: "Fr", code: "XPF", name: "CFP Franc" },
  Taiwan: { symbol: "NT$", code: "TWD", name: "New Taiwan Dollar" },
  Tajikistan: { symbol: "SM", code: "TJS", name: "Tajikistani Somoni" },
  Tanzania: { symbol: "Sh", code: "TZS", name: "Tanzanian Shilling" },
  Thailand: { symbol: "฿", code: "THB", name: "Thai Baht" },
  Togo: { symbol: "Fr", code: "XOF", name: "West African CFA Franc" },
  Tokelau: { symbol: "NZ$", code: "NZD", name: "New Zealand Dollar" },
  Tonga: { symbol: "T$", code: "TOP", name: "Tongan Paʻanga" },
  "Trinidad & Tobago": {
    symbol: "$",
    code: "TTD",
    name: "Trinidad & Tobago Dollar",
  },
  Tunisia: { symbol: "DT", code: "TND", name: "Tunisian Dinar" },
  Turkey: { symbol: "₺", code: "TRY", name: "Turkish Lira" },
  Turkmenistan: { symbol: "T", code: "TMT", name: "Turkmenistani Manat" },
  "Turks & Caicos Is": { symbol: "$", code: "USD", name: "US Dollar" },
  Tuvalu: { symbol: "A$", code: "AUD", name: "Australian Dollar" },

  // U
  Uganda: { symbol: "Sh", code: "UGX", name: "Ugandan Shilling" },
  Ukraine: { symbol: "₴", code: "UAH", name: "Ukrainian Hryvnia" },
  "United Arab Erimates": { symbol: "د.إ", code: "AED", name: "UAE Dirham" },
  "United Kingdom": { symbol: "£", code: "GBP", name: "British Pound" },
  "United States of America": { symbol: "$", code: "USD", name: "US Dollar" },
  Uraguay: { symbol: "$", code: "UYU", name: "Uruguayan Peso" },
  Uzbekistan: { symbol: "лв", code: "UZS", name: "Uzbekistani Som" },

  // V
  Vanuatu: { symbol: "Vt", code: "VUV", name: "Vanuatu Vatu" },
  "Vatican City State": { symbol: "€", code: "EUR", name: "Euro" },
  Venezuela: { symbol: "Bs", code: "VES", name: "Venezuelan Bolívar" },
  Vietnam: { symbol: "₫", code: "VND", name: "Vietnamese Đồng" },
  "Virgin Islands (Brit)": { symbol: "$", code: "USD", name: "US Dollar" },
  "Virgin Islands (USA)": { symbol: "$", code: "USD", name: "US Dollar" },

  // W
  "Wake Island": { symbol: "$", code: "USD", name: "US Dollar" },
  "Wallis & Futana Is": { symbol: "Fr", code: "XPF", name: "CFP Franc" },

  // Y
  Yemen: { symbol: "﷼", code: "YER", name: "Yemeni Rial" },

  // Z
  Zaire: { symbol: "Fr", code: "CDF", name: "Congolese Franc" },
  Zambia: { symbol: "ZK", code: "ZMW", name: "Zambian Kwacha" },
  Zimbabwe: { symbol: "$", code: "ZWL", name: "Zimbabwean Dollar" },
};

const DEFAULT_CURRENCY = { symbol: "$", code: "USD", name: "US Dollar" };

export { COUNTRY_CURRENCY_MAP };

/**
 * Get currency info for a country.
 * @param {string} country - The country value as stored in User.country
 * @returns {{ symbol: string, code: string, name: string }}
 */
export function getCurrency(country) {
  if (!country) return DEFAULT_CURRENCY;
  return COUNTRY_CURRENCY_MAP[country] ?? DEFAULT_CURRENCY;
}

/**
 * Format a balance number with the correct currency symbol.
 * @param {number} amount
 * @param {string} country - User.country
 * @param {object} options
 * @param {boolean} options.showCode - append currency code e.g. "₦ 84,520.00 NGN"
 * @returns {string}
 */
export function formatBalance(amount, country, options = {}) {
  const { symbol, code } = getCurrency(country);
  const formatted = Number(amount ?? 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const base = `${symbol} ${formatted}`;
  return options.showCode ? `${base} ${code}` : base;
}

/**
 * Get just the symbol for a country.
 * Useful for inline display next to inputs.
 * @param {string} country
 * @returns {string}
 */
export function getCurrencySymbol(country) {
  return getCurrency(country).symbol;
}

/**
 * Get just the currency code for a country.
 * @param {string} country
 * @returns {string}
 */
export function getCurrencyCode(country) {
  return getCurrency(country).code;
}
