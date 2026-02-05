import { useState, useEffect, useMemo } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Coins, 
  TrendUp, 
  Storefront, 
  Scales, 
  Info, 
  CheckCircle,
  ArrowsClockwise,
  CurrencyDollar,
  Globe
} from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface Assets {
  cash: number
  gold: number
  silver: number
  investments: number
  business: number
  crypto: number
}

interface Liabilities {
  shortTermDebt: number
  longTermDebt: number
  loans: number
  other: number
}

interface Currency {
  code: string
  symbol: string
  name: string
}

interface ExchangeRates {
  [key: string]: number
}

const GOLD_NISAB_GRAMS = 87.48
const SILVER_NISAB_GRAMS = 612.36
const ZAKAT_RATE = 0.025

const CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'SAR', symbol: 'ر.س', name: 'Saudi Riyal' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'EGP', symbol: 'ج.م', name: 'Egyptian Pound' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
  { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
  { code: 'GHS', symbol: '₵', name: 'Ghanaian Cedi' },
  { code: 'TZS', symbol: 'TSh', name: 'Tanzanian Shilling' },
  { code: 'UGX', symbol: 'USh', name: 'Ugandan Shilling' },
  { code: 'MAD', symbol: 'د.م.', name: 'Moroccan Dirham' },
  { code: 'ETB', symbol: 'Br', name: 'Ethiopian Birr' },
  { code: 'XOF', symbol: 'CFA', name: 'West African CFA Franc' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
]

function App() {
  const [assets, setAssets] = useKV<Assets>('zakat-assets', {
    cash: 0,
    gold: 0,
    silver: 0,
    investments: 0,
    business: 0,
    crypto: 0
  })

  const [liabilities, setLiabilities] = useKV<Liabilities>('zakat-liabilities', {
    shortTermDebt: 0,
    longTermDebt: 0,
    loans: 0,
    other: 0
  })

  const [goldPrice, setGoldPrice] = useState(65)
  const [silverPrice, setSilverPrice] = useState(0.85)
  const [useGoldNisab, setUseGoldNisab] = useState(true)
  const [showZakat, setShowZakat] = useState(false)
  const [selectedCurrency, setSelectedCurrency] = useKV<string>('selected-currency', 'USD')
  const [exchangeRates, setExchangeRates] = useKV<ExchangeRates>('exchange-rates', { USD: 1 })
  const [lastRateUpdate, setLastRateUpdate] = useKV<number>('last-rate-update', 0)
  const [isLoadingRates, setIsLoadingRates] = useState(false)

  const currentCurrency = CURRENCIES.find(c => c.code === selectedCurrency) || CURRENCIES[0]
  const exchangeRate = exchangeRates?.[selectedCurrency || 'USD'] || 1

  const nisabThreshold = useGoldNisab 
    ? goldPrice * GOLD_NISAB_GRAMS * exchangeRate
    : silverPrice * SILVER_NISAB_GRAMS * exchangeRate

  const totalAssets = useMemo(() => {
    if (!assets) return 0
    return Object.values(assets).reduce((sum: number, val: number) => sum + val, 0)
  }, [assets])

  const totalLiabilities = useMemo(() => {
    if (!liabilities) return 0
    return Object.values(liabilities).reduce((sum: number, val: number) => sum + val, 0)
  }, [liabilities])

  const netAssets = Math.max(0, totalAssets - totalLiabilities)

  const zakatAmount = netAssets >= nisabThreshold ? netAssets * ZAKAT_RATE : 0
  const nisabPercentage = Math.min((netAssets / nisabThreshold) * 100, 100)
  const isNisabReached = netAssets >= nisabThreshold

  const fetchExchangeRates = async () => {
    setIsLoadingRates(true)
    try {
      const currencyList = CURRENCIES.map(c => c.code).join(', ')
      const promptText = `You are a financial data provider. Provide current exchange rates for the following currencies relative to USD (1 USD = X currency).
      
      Required currencies: ${currencyList}
      
      Return ONLY a JSON object with currency codes as keys and their exchange rates as values. The USD rate should always be 1.
      
      Example format:
      {
        "USD": 1,
        "EUR": 0.92,
        "GBP": 0.79,
        ...etc
      }
      
      Provide realistic, current exchange rates.`
      
      const response = await window.spark.llm(promptText, 'gpt-4o-mini', true)
      const rates = JSON.parse(response) as ExchangeRates
      
      setExchangeRates(rates)
      setLastRateUpdate(Date.now())
      toast.success('Exchange rates updated successfully')
    } catch (error) {
      console.error('Failed to fetch exchange rates:', error)
      toast.error('Failed to update exchange rates')
    } finally {
      setIsLoadingRates(false)
    }
  }

  useEffect(() => {
    const shouldFetchRates = () => {
      if (!lastRateUpdate) return true
      const hoursSinceUpdate = (Date.now() - (lastRateUpdate || 0)) / (1000 * 60 * 60)
      return hoursSinceUpdate > 24
    }

    if (shouldFetchRates()) {
      fetchExchangeRates()
    }
  }, [])

  useEffect(() => {
    if (isNisabReached && netAssets > 0) {
      setShowZakat(true)
    }
  }, [isNisabReached, netAssets])

  const updateAsset = (key: keyof Assets, value: string) => {
    const numValue = parseFloat(value) || 0
    if (numValue < 0) return
    
    setAssets((current) => {
      if (!current) return { cash: 0, gold: 0, silver: 0, investments: 0, business: 0, crypto: 0, [key]: numValue }
      return {
        ...current,
        [key]: numValue
      }
    })
  }

  const updateLiability = (key: keyof Liabilities, value: string) => {
    const numValue = parseFloat(value) || 0
    if (numValue < 0) return
    
    setLiabilities((current) => {
      if (!current) return { shortTermDebt: 0, longTermDebt: 0, loans: 0, other: 0, [key]: numValue }
      return {
        ...current,
        [key]: numValue
      }
    })
  }

  const formatCurrency = (amount: number) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: selectedCurrency || 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount)
    } catch (error) {
      return `${currentCurrency.symbol}${amount.toFixed(2)}`
    }
  }

  const assetCategories = [
    {
      key: 'cash' as keyof Assets,
      label: 'Cash & Savings',
      icon: Coins,
      description: 'Bank accounts, savings, and physical cash',
      info: 'Include all cash in bank accounts, savings accounts, and physical cash you possess.'
    },
    {
      key: 'gold' as keyof Assets,
      label: `Gold (value in ${currentCurrency.code})`,
      icon: Coins,
      description: 'Gold jewelry, coins, and bars',
      info: 'Enter the current market value of gold items. Only gold held as wealth is zakatable.'
    },
    {
      key: 'silver' as keyof Assets,
      label: `Silver (value in ${currentCurrency.code})`,
      icon: Coins,
      description: 'Silver jewelry, coins, and bars',
      info: 'Enter the current market value of silver items held as wealth.'
    },
    {
      key: 'investments' as keyof Assets,
      label: 'Investments',
      icon: TrendUp,
      description: 'Stocks, bonds, mutual funds',
      info: 'Include the current value of all investment portfolios, stocks, and bonds.'
    },
    {
      key: 'business' as keyof Assets,
      label: 'Business Assets',
      icon: Storefront,
      description: 'Inventory and trade goods',
      info: 'Include business inventory, trade goods, and liquid business assets. Fixed assets like buildings are not zakatable.'
    },
    {
      key: 'crypto' as keyof Assets,
      label: 'Cryptocurrency',
      icon: CurrencyDollar,
      description: 'Bitcoin, Ethereum, and other crypto',
      info: 'Include the current USD value of all cryptocurrency holdings.'
    }
  ]

  const liabilityCategories = [
    {
      key: 'shortTermDebt' as keyof Liabilities,
      label: 'Short-term Debt',
      icon: CurrencyDollar,
      description: 'Credit cards, bills due within a year',
      info: 'Include credit card debt, utility bills, and any debt payable within the current year.'
    },
    {
      key: 'longTermDebt' as keyof Liabilities,
      label: 'Long-term Debt',
      icon: CurrencyDollar,
      description: 'Mortgages, car loans (portion due this year)',
      info: 'Only include the portion of long-term debt that is payable within the current lunar year.'
    },
    {
      key: 'loans' as keyof Liabilities,
      label: 'Personal Loans',
      icon: CurrencyDollar,
      description: 'Money owed to individuals',
      info: 'Include personal loans and money owed to family or friends that must be repaid.'
    },
    {
      key: 'other' as keyof Liabilities,
      label: 'Other Liabilities',
      icon: CurrencyDollar,
      description: 'Other debts and financial obligations',
      info: 'Include any other legitimate debts or financial obligations due within the year.'
    }
  ]

  const handleRefreshPrices = () => {
    fetchExchangeRates()
  }

  const getLastUpdateText = () => {
    if (!lastRateUpdate || lastRateUpdate === 0) return 'Never updated'
    const hoursSinceUpdate = (Date.now() - lastRateUpdate) / (1000 * 60 * 60)
    if (hoursSinceUpdate < 1) return 'Updated recently'
    if (hoursSinceUpdate < 24) return `Updated ${Math.floor(hoursSinceUpdate)} hours ago`
    return `Updated ${Math.floor(hoursSinceUpdate / 24)} days ago`
  }

  const handleClearData = () => {
    setAssets({
      cash: 0,
      gold: 0,
      silver: 0,
      investments: 0,
      business: 0,
      crypto: 0
    })
    setLiabilities({
      shortTermDebt: 0,
      longTermDebt: 0,
      loans: 0,
      other: 0
    })
    setShowZakat(false)
    toast.success('All data cleared')
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen">
        <header className="bg-card border-b sticky top-0 z-10 py-4 px-4 sm:px-6 lg:px-8">
          <div className="max-w-[1800px] mx-auto flex items-center justify-between">
            <div>
              <motion.h1 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-display text-2xl sm:text-3xl font-bold text-foreground"
              >
                Zakat Calculator
              </motion.h1>
              <p className="text-muted-foreground text-sm hidden sm:block">
                Calculate your Zakat obligation with precision
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={selectedCurrency || 'USD'} onValueChange={setSelectedCurrency}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {CURRENCIES.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs">{currency.symbol}</span>
                        <span className="text-sm">{currency.code}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRefreshPrices}
                disabled={isLoadingRates}
              >
                <ArrowsClockwise size={16} className={isLoadingRates ? 'animate-spin' : ''} />
              </Button>
            </div>
          </div>
          {(lastRateUpdate || 0) > 0 && (
            <div className="max-w-[1800px] mx-auto flex items-center gap-2 mt-2">
              <Globe size={14} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{getLastUpdateText()}</span>
            </div>
          )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 max-w-[1800px] mx-auto">
          <div className="border-r bg-background/50 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 100px)' }}>
            <div>
              <h2 className="text-xl font-semibold mb-1 flex items-center gap-2">
                <Scales className="text-primary" size={24} />
                Nisab Configuration
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Set the threshold for Zakat obligation
              </p>

              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="gold-price">Gold (USD/gram)</Label>
                      <Input
                        id="gold-price"
                        type="number"
                        value={goldPrice}
                        onChange={(e) => setGoldPrice(parseFloat(e.target.value) || 0)}
                        className="font-mono"
                      />
                      <p className="text-xs text-muted-foreground">
                        {currentCurrency.symbol}{(goldPrice * exchangeRate).toFixed(2)}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="silver-price">Silver (USD/gram)</Label>
                      <Input
                        id="silver-price"
                        type="number"
                        value={silverPrice}
                        onChange={(e) => setSilverPrice(parseFloat(e.target.value) || 0)}
                        className="font-mono"
                      />
                      <p className="text-xs text-muted-foreground">
                        {currentCurrency.symbol}{(silverPrice * exchangeRate).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant={useGoldNisab ? "default" : "outline"}
                      onClick={() => setUseGoldNisab(true)}
                      className="flex-1"
                      size="sm"
                    >
                      Gold Nisab
                    </Button>
                    <Button
                      variant={!useGoldNisab ? "default" : "outline"}
                      onClick={() => setUseGoldNisab(false)}
                      className="flex-1"
                      size="sm"
                    >
                      Silver Nisab
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-1 flex items-center gap-2">
                <Coins className="text-primary" size={24} />
                Your Assets
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Enter all zakatable wealth
              </p>
              
              <div className="space-y-3">
                {assetCategories.map((category) => (
                  <Card key={category.key} className="hover:shadow-sm transition-shadow">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start gap-3">
                        <category.icon className="text-primary mt-1 flex-shrink-0" size={20} />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor={category.key} className="text-sm font-medium">
                              {category.label}
                            </Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button type="button">
                                  <Info size={14} className="text-muted-foreground" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p className="text-sm">{category.info}</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Input
                            id={category.key}
                            type="number"
                            min="0"
                            step="0.01"
                            value={assets?.[category.key] || ''}
                            onChange={(e) => updateAsset(category.key, e.target.value)}
                            placeholder="0.00"
                            className="font-mono"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-1 flex items-center gap-2">
                <CurrencyDollar className="text-destructive" size={24} />
                Your Liabilities
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Debts due within the current lunar year
              </p>
              
              <div className="space-y-3">
                {liabilityCategories.map((category) => (
                  <Card key={category.key} className="hover:shadow-sm transition-shadow border-destructive/20">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start gap-3">
                        <category.icon className="text-destructive mt-1 flex-shrink-0" size={20} />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor={category.key} className="text-sm font-medium">
                              {category.label}
                            </Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button type="button">
                                  <Info size={14} className="text-muted-foreground" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p className="text-sm">{category.info}</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Input
                            id={category.key}
                            type="number"
                            min="0"
                            step="0.01"
                            value={liabilities?.[category.key] || ''}
                            onChange={(e) => updateLiability(category.key, e.target.value)}
                            placeholder="0.00"
                            className="font-mono"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Button 
              variant="outline" 
              onClick={handleClearData}
              className="w-full"
            >
              Clear All Data
            </Button>

            <Card className="bg-secondary/50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Info className="text-primary" size={16} />
                  About Zakat
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <p>
                  Zakat is one of the Five Pillars of Islam and is an obligatory act of charity on wealth 
                  that has been held for one lunar year.
                </p>
                <p>
                  The Nisab is the minimum wealth threshold (87.48g gold or 612.36g silver). 
                  The standard Zakat rate is 2.5% of your zakatable wealth.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="bg-muted/30 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 100px)' }}>
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Scales className="text-accent" size={24} />
                Calculation Results
              </h2>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm text-muted-foreground">Nisab Threshold</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold font-mono text-primary">
                      {formatCurrency(nisabThreshold)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Based on {useGoldNisab ? 'Gold' : 'Silver'} standard
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm text-muted-foreground">Total Assets</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold font-mono">
                      {formatCurrency(totalAssets)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm text-muted-foreground">Total Liabilities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold font-mono text-destructive">
                      {formatCurrency(totalLiabilities)}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-2 border-primary/30">
                  <CardHeader>
                    <CardTitle className="text-sm text-muted-foreground">Net Assets</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-4xl font-bold font-mono text-primary">
                      {formatCurrency(netAssets)}
                    </p>
                    <div className="mt-4">
                      <Progress value={nisabPercentage} className="h-3" />
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        {isNisabReached 
                          ? 'Nisab threshold reached' 
                          : `${formatCurrency(nisabThreshold - netAssets)} below Nisab`}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {isNisabReached && (
                  <Alert className="bg-primary/5 border-primary/20">
                    <CheckCircle className="text-primary" />
                    <AlertDescription>
                      You have reached the Nisab threshold. Zakat is obligatory on your wealth.
                    </AlertDescription>
                  </Alert>
                )}

                <Separator />

                <AnimatePresence mode="wait">
                  {showZakat && zakatAmount > 0 ? (
                    <motion.div
                      key="zakat-amount"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                    >
                      <Card className="bg-accent/10 border-accent/30 border-2 animate-pulse-glow">
                        <CardHeader>
                          <CardTitle className="text-sm font-medium text-accent-foreground">
                            Your Zakat Due (2.5%)
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-5xl font-bold font-mono text-accent animate-count-up">
                            {formatCurrency(zakatAmount)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-4">
                            This amount should be paid to eligible recipients
                          </p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="no-zakat"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <Card>
                        <CardContent className="text-center py-12 text-muted-foreground">
                          <p className="text-sm">
                            {netAssets === 0 
                              ? 'Enter your assets to calculate Zakat' 
                              : 'Your net assets are below the Nisab threshold. Zakat is not obligatory.'}
                          </p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}

export default App