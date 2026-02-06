/**
 * Exchange rate fetching utilities
 * Uses exchangerate-api.com free tier for fetching current rates
 */

interface ExchangeRates {
  [key: string]: number
}

interface ExchangeRateAPIResponse {
  result: string
  conversion_rates: ExchangeRates
}

/**
 * Fetches current exchange rates for supported currencies
 * Falls back to default rates if the API is unavailable
 */
export async function fetchExchangeRates(currencyCodes: string[]): Promise<ExchangeRates> {
  try {
    // Use exchangerate-api.com free tier (no API key required for USD base)
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD')
    
    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`)
    }
    
    const data = await response.json() as { rates: ExchangeRates }
    
    // Filter to only include our supported currencies
    const filteredRates: ExchangeRates = { USD: 1 }
    currencyCodes.forEach(code => {
      if (code === 'USD') {
        filteredRates[code] = 1
      } else if (data.rates[code]) {
        filteredRates[code] = data.rates[code]
      }
    })
    
    return filteredRates
  } catch (error) {
    console.warn('Failed to fetch exchange rates, using defaults:', error)
    // Return default rates as fallback
    return getDefaultExchangeRates()
  }
}

/**
 * Default exchange rates as fallback
 * These are approximate rates and should be updated periodically
 */
function getDefaultExchangeRates(): ExchangeRates {
  return {
    USD: 1,
    EUR: 0.92,
    GBP: 0.79,
    SAR: 3.75,
    AED: 3.67,
    EGP: 48.50,
    TRY: 32.50,
    PKR: 278.00,
    INR: 83.00,
    MYR: 4.70,
    IDR: 15600,
    BDT: 110.00,
    NGN: 1400,
    ZAR: 18.50,
    KES: 155.00,
    GHS: 15.00,
    TZS: 2500,
    UGX: 3700,
    MAD: 10.00,
    ETB: 55.00,
  }
}
