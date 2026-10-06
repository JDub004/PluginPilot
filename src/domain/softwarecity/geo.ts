// Built-in coordinates for common cities, so sites and partners land on the map without a geocoding
// service (no network call, deterministic). Unknown cities need lat/lon in the input.
const CITIES: Record<string, [number, number]> = {
  berlin: [52.52, 13.405], hamburg: [53.551, 9.994], muenchen: [48.137, 11.575], munich: [48.137, 11.575], koeln: [50.938, 6.96], cologne: [50.938, 6.96],
  frankfurt: [50.11, 8.682], 'frankfurt am main': [50.11, 8.682], stuttgart: [48.776, 9.183], duesseldorf: [51.227, 6.774], leipzig: [51.34, 12.375],
  dortmund: [51.514, 7.466], essen: [51.456, 7.012], bremen: [53.079, 8.802], dresden: [51.05, 13.738], hannover: [52.376, 9.732], nuernberg: [49.452, 11.077],
  duisburg: [51.435, 6.763], bochum: [51.481, 7.216], wuppertal: [51.256, 7.151], bielefeld: [52.03, 8.532], bonn: [50.737, 7.098], muenster: [51.961, 7.626],
  mannheim: [49.488, 8.466], karlsruhe: [49.007, 8.404], augsburg: [48.371, 10.898], wiesbaden: [50.078, 8.24], mainz: [49.993, 8.247], kiel: [54.323, 10.123],
  luebeck: [53.866, 10.686], rostock: [54.092, 12.099], magdeburg: [52.12, 11.628], erfurt: [50.978, 11.029], potsdam: [52.391, 13.064], saarbruecken: [49.234, 6.997],
  freiburg: [47.999, 7.842], heidelberg: [49.399, 8.672], regensburg: [49.013, 12.102], ulm: [48.401, 9.987], wuerzburg: [49.791, 9.953], kassel: [51.312, 9.479],
  aachen: [50.776, 6.084], osnabrueck: [52.279, 8.047], oldenburg: [53.144, 8.214], braunschweig: [52.269, 10.521], chemnitz: [50.828, 12.921], halle: [51.483, 11.97],
  ingolstadt: [48.766, 11.426], wolfsburg: [52.423, 10.787], paderborn: [51.719, 8.757], darmstadt: [49.873, 8.651], schwerin: [53.636, 11.401], flensburg: [54.794, 9.437],
  wien: [48.208, 16.373], vienna: [48.208, 16.373], graz: [47.071, 15.439], linz: [48.306, 14.286], salzburg: [47.811, 13.055], innsbruck: [47.269, 11.404],
  zuerich: [47.377, 8.541], zurich: [47.377, 8.541], bern: [46.948, 7.447], basel: [47.56, 7.589], genf: [46.204, 6.143], geneva: [46.204, 6.143], luzern: [47.05, 8.309],
  amsterdam: [52.368, 4.904], rotterdam: [51.924, 4.478], bruessel: [50.85, 4.352], brussels: [50.85, 4.352], antwerpen: [51.219, 4.402], luxemburg: [49.611, 6.13],
  paris: [48.857, 2.352], lyon: [45.764, 4.836], marseille: [43.296, 5.37], london: [51.507, -0.128], manchester: [53.481, -2.243], dublin: [53.35, -6.26],
  madrid: [40.417, -3.704], barcelona: [41.385, 2.173], lissabon: [38.722, -9.139], lisbon: [38.722, -9.139], rom: [41.903, 12.496], rome: [41.903, 12.496], mailand: [45.464, 9.19], milan: [45.464, 9.19],
  kopenhagen: [55.676, 12.568], copenhagen: [55.676, 12.568], stockholm: [59.329, 18.069], oslo: [59.914, 10.752], helsinki: [60.17, 24.938],
  warschau: [52.23, 21.012], warsaw: [52.23, 21.012], krakau: [50.065, 19.945], breslau: [51.108, 17.039], wroclaw: [51.108, 17.039], posen: [52.406, 16.925], poznan: [52.406, 16.925],
  prag: [50.075, 14.438], prague: [50.075, 14.438], budapest: [47.498, 19.04], bratislava: [48.149, 17.107], bukarest: [44.426, 26.103], sofia: [42.698, 23.322], athen: [37.984, 23.728],
  istanbul: [41.008, 28.978], 'new york': [40.713, -74.006], chicago: [41.878, -87.63], 'san francisco': [37.775, -122.419], seattle: [47.606, -122.332], toronto: [43.653, -79.383],
  vaduz: [47.141, 9.521], ljubljana: [46.056, 14.506], zagreb: [45.815, 15.982], belgrad: [44.787, 20.457], belgrade: [44.787, 20.457],
  kiew: [50.45, 30.523], kyiv: [50.45, 30.523], riga: [56.949, 24.105], vilnius: [54.687, 25.28], tallinn: [59.437, 24.754], reykjavik: [64.147, -21.942],
  ankara: [39.934, 32.86], 'tel aviv': [32.085, 34.782], kairo: [30.044, 31.236], cairo: [30.044, 31.236], casablanca: [33.573, -7.59], lagos: [6.524, 3.379],
  nairobi: [-1.292, 36.822], johannesburg: [-26.204, 28.047], kapstadt: [-33.925, 18.424], 'cape town': [-33.925, 18.424], riad: [24.713, 46.675], riyadh: [24.713, 46.675],
  doha: [25.285, 51.531], 'abu dhabi': [24.454, 54.377], delhi: [28.614, 77.209], 'new delhi': [28.614, 77.209], karachi: [24.861, 67.01], dhaka: [23.81, 90.413],
  bangkok: [13.756, 100.502], 'kuala lumpur': [3.139, 101.687], jakarta: [-6.208, 106.846], manila: [14.6, 120.984], 'ho chi minh': [10.823, 106.63], hanoi: [21.028, 105.854],
  seoul: [37.567, 126.978], 'hong kong': [22.32, 114.169], hongkong: [22.32, 114.169], taipeh: [25.033, 121.565], taipei: [25.033, 121.565], osaka: [34.694, 135.502],
  melbourne: [-37.814, 144.963], auckland: [-36.848, 174.763], 'mexiko-stadt': [19.433, -99.133], 'mexico city': [19.433, -99.133], bogota: [4.711, -74.072],
  lima: [-12.046, -77.043], santiago: [-33.449, -70.669], 'buenos aires': [-34.604, -58.382], 'rio de janeiro': [-22.907, -43.173], montreal: [45.502, -73.567],
  vancouver: [49.283, -123.121], houston: [29.76, -95.37], atlanta: [33.749, -84.388], miami: [25.762, -80.192], 'los angeles': [34.052, -118.244], boston: [42.36, -71.059],
  athens: [37.984, 23.728], porto: [41.158, -8.629], valencia: [39.47, -0.376], turin: [45.07, 7.687], gothenburg: [57.709, 11.975], goeteborg: [57.709, 11.975], aarhus: [56.163, 10.203],
  shanghai: [31.23, 121.474], shenzhen: [22.543, 114.058], peking: [39.904, 116.407], beijing: [39.904, 116.407], tokio: [35.676, 139.65], tokyo: [35.676, 139.65],
  singapur: [1.352, 103.82], singapore: [1.352, 103.82], dubai: [25.205, 55.271], mumbai: [19.076, 72.878], bangalore: [12.972, 77.595], 'sao paulo': [-23.551, -46.633], sydney: [-33.869, 151.209],
};

export function normCity(s: string): string {
  return s.toLowerCase().trim().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/é/g, 'e').replace(/ã/g, 'a')
    .replace(/\s*\(.*\)$/, '').replace(/^(\d{4,5}\s+)/, '').replace(/\s+/g, ' ');
}

/** Coordinates for a city name, or undefined when it is not in the built-in list. */
export function locate(city?: string): { lat: number; lon: number } | undefined {
  if (!city) return undefined;
  const c = CITIES[normCity(city)] ?? CITIES[normCity(city).split(/[ ,/-]/)[0] ?? ''];
  return c ? { lat: c[0], lon: c[1] } : undefined;
}
