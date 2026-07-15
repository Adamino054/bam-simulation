/**
 * Historical macro calibrations used only for scenario initial states.
 *
 * Output gap method:
 * - Source series: World Bank real GDP, Morocco, NY.GDP.MKTP.KD
 *   https://api.worldbank.org/v2/country/MA/indicator/NY.GDP.MKTP.KD?format=json&date=2000:2025&per_page=100
 * - Potential GDP: Hodrick-Prescott trend on log(real GDP), annual lambda = 100.
 * - Output gap: ((real GDP - potential GDP) / potential GDP) * 100.
 */

export const HISTORICAL_OUTPUT_GAPS = {
  morocco2008: 0.900712,
  morocco2018: 2.288278,
  morocco2020: -6.752279,
  morocco2022: -2.065736,
  morocco2025: 2.255434,
} as const
