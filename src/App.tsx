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
import { 
  Coins, 
  TrendUp, 
  Storefront, 
  Scales, 
  Info, 
  CheckCircle,
  ArrowsClockwise,
  CurrencyDollar
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

const GOLD_NISAB_GRAMS = 87.48
const SILVER_NISAB_GRAMS = 612.36
const ZAKAT_RATE = 0.025

function App() {
  const [assets, setAssets] = useKV<Assets>('zakat-assets', {
    cash: 0,
    gold: 0,
    silver: 0,
    investments: 0,
    business: 0,
    crypto: 0
  })

  const [goldPrice, setGoldPrice] = useState(65)
  const [silverPrice, setSilverPrice] = useState(0.85)
  const [useGoldNisab, setUseGoldNisab] = useState(true)
  const [showZakat, setShowZakat] = useState(false)

  const nisabThreshold = useGoldNisab 
    ? goldPrice * GOLD_NISAB_GRAMS 
    : silverPrice * SILVER_NISAB_GRAMS

  const totalAssets = useMemo(() => {
    if (!assets) return 0
    return Object.values(assets).reduce((sum: number, val: number) => sum + val, 0)
  }, [assets])

  const zakatAmount = totalAssets >= nisabThreshold ? totalAssets * ZAKAT_RATE : 0
  const nisabPercentage = Math.min((totalAssets / nisabThreshold) * 100, 100)
  const isNisabReached = totalAssets >= nisabThreshold

  useEffect(() => {
    if (isNisabReached && totalAssets > 0) {
      setShowZakat(true)
    }
  }, [isNisabReached, totalAssets])

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
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
      label: 'Gold (value in USD)',
      icon: Coins,
      description: 'Gold jewelry, coins, and bars',
      info: 'Enter the current market value of gold items. Only gold held as wealth is zakatable.'
    },
    {
      key: 'silver' as keyof Assets,
      label: 'Silver (value in USD)',
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

  const handleRefreshPrices = () => {
    toast.success('Using standard market prices for gold and silver')
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
    setShowZakat(false)
    toast.success('All data cleared')
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <header className="text-center space-y-3">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display text-4xl sm:text-5xl font-bold text-foreground"
            >
              Zakat Calculator
            </motion.h1>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
              Calculate your Zakat obligation with precision and confidence
            </p>
          </header>

          <Card className="border-2">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Scales className="text-primary" size={24} />
                    Nisab Threshold
                  </CardTitle>
                  <CardDescription className="mt-2">
                    Minimum wealth requiring Zakat payment
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleRefreshPrices}
                >
                  <ArrowsClockwise size={16} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gold-price">Gold Price (per gram)</Label>
                  <Input
                    id="gold-price"
                    type="number"
                    value={goldPrice}
                    onChange={(e) => setGoldPrice(parseFloat(e.target.value) || 0)}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="silver-price">Silver Price (per gram)</Label>
                  <Input
                    id="silver-price"
                    type="number"
                    value={silverPrice}
                    onChange={(e) => setSilverPrice(parseFloat(e.target.value) || 0)}
                    className="font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant={useGoldNisab ? "default" : "outline"}
                  onClick={() => setUseGoldNisab(true)}
                  className="flex-1"
                >
                  Gold Nisab
                </Button>
                <Button
                  variant={!useGoldNisab ? "default" : "outline"}
                  onClick={() => setUseGoldNisab(false)}
                  className="flex-1"
                >
                  Silver Nisab
                </Button>
              </div>

              <div className="bg-muted rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Current Nisab</span>
                  <span className="text-2xl font-bold font-mono text-primary">
                    {formatCurrency(nisabThreshold)}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Your Assets</span>
                    <span className="font-mono font-medium">
                      {formatCurrency(totalAssets)}
                    </span>
                  </div>
                  <Progress value={nisabPercentage} className="h-2" />
                  <p className="text-xs text-muted-foreground text-center">
                    {isNisabReached 
                      ? 'Nisab threshold reached' 
                      : `${formatCurrency(nisabThreshold - totalAssets)} below Nisab`}
                  </p>
                </div>
              </div>

              {isNisabReached && (
                <Alert className="bg-primary/5 border-primary/20">
                  <CheckCircle className="text-primary" />
                  <AlertDescription>
                    You have reached the Nisab threshold. Zakat is obligatory on your wealth.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <div>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Coins className="text-primary" size={28} />
              Your Assets
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assetCategories.map((category) => (
                <Card key={category.key} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <category.icon className="text-primary" size={20} />
                      {category.label}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="ml-auto">
                            <Info size={16} className="text-muted-foreground" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-sm">{category.info}</p>
                        </TooltipContent>
                      </Tooltip>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {category.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Input
                      id={category.key}
                      type="number"
                      min="0"
                      step="0.01"
                      value={assets?.[category.key] || ''}
                      onChange={(e) => updateAsset(category.key, e.target.value)}
                      placeholder="0.00"
                      className="font-mono text-lg"
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Card className="border-2 border-accent/50">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Scales className="text-accent" size={28} />
                Zakat Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Assets</p>
                  <p className="text-3xl font-bold font-mono">
                    {formatCurrency(totalAssets)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Nisab Threshold</p>
                  <p className="text-3xl font-bold font-mono text-primary">
                    {formatCurrency(nisabThreshold)}
                  </p>
                </div>
              </div>

              <Separator />

              <AnimatePresence mode="wait">
                {showZakat && zakatAmount > 0 ? (
                  <motion.div
                    key="zakat-amount"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-accent/10 rounded-lg p-6 space-y-2 animate-pulse-glow"
                  >
                    <p className="text-sm font-medium text-accent-foreground">
                      Your Zakat Due (2.5%)
                    </p>
                    <p className="text-5xl font-bold font-mono text-accent animate-count-up">
                      {formatCurrency(zakatAmount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      This amount should be paid to eligible recipients
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="no-zakat"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-8 text-muted-foreground"
                  >
                    <p className="text-sm">
                      {totalAssets === 0 
                        ? 'Enter your assets above to calculate Zakat' 
                        : 'Your assets are below the Nisab threshold. Zakat is not obligatory.'}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleClearData}
                  className="flex-1"
                >
                  Clear All Data
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-secondary/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="text-primary" size={20} />
                About Zakat
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Zakat is one of the Five Pillars of Islam and is an obligatory act of charity on wealth 
                that has been held for one lunar year.
              </p>
              <p>
                The Nisab is the minimum amount of wealth a Muslim must possess for one lunar year 
                before Zakat becomes obligatory. It is equivalent to 87.48 grams of gold or 612.36 grams of silver.
              </p>
              <p>
                The standard Zakat rate is 2.5% of your total zakatable wealth. This calculator uses 
                the lower threshold (silver) as it allows more people to fulfill this important obligation.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  )
}

export default App