import { useState, useEffect, useMemo, useRef } from 'react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Coins, 
  TrendUp, 
  Storefront, 
  Scales, 
  Info, 
  CheckCircle,
  ArrowsClockwise,
  CurrencyDollar,
  Globe,
  ChartPie,
  ChartBar,
  FilePdf,
  Download,
  CaretLeft,
  CaretRight,
  Users,
  Heart,
  HandCoins,
  Book
} from '@phosphor-icons/react'
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion'
import { toast } from 'sonner'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { jsPDF } from 'jspdf'
import { useIsMobile } from '@/hooks/use-mobile'

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

const ASSET_COLORS = {
  cash: 'oklch(0.60 0.15 142)',
  gold: 'oklch(0.70 0.15 75)',
  silver: 'oklch(0.75 0.05 240)',
  investments: 'oklch(0.48 0.08 210)',
  business: 'oklch(0.55 0.12 285)',
  crypto: 'oklch(0.65 0.18 30)'
}

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

const ZAKAT_RECIPIENTS = [
  {
    category: 'Al-Fuqara (The Poor)',
    arabic: 'الفقراء',
    icon: Users,
    description: 'Those who have no income or insufficient means to meet their basic needs.',
    color: 'text-primary'
  },
  {
    category: 'Al-Masakin (The Needy)',
    arabic: 'المساكين',
    icon: Heart,
    description: 'Those who have some income but it is insufficient to cover their essential needs.',
    color: 'text-accent'
  },
  {
    category: 'Al-Amilin (Zakat Workers)',
    arabic: 'العاملون عليها',
    icon: HandCoins,
    description: 'Those appointed to collect and distribute Zakat.',
    color: 'text-primary'
  },
  {
    category: 'Al-Mu\'allafatu Qulubuhum (New Muslims)',
    arabic: 'المؤلفة قلوبهم',
    icon: Heart,
    description: 'New Muslims or those whose hearts are inclined towards Islam.',
    color: 'text-accent'
  },
  {
    category: 'Ar-Riqab (Freeing Slaves)',
    arabic: 'في الرقاب',
    icon: Users,
    description: 'Historically for freeing slaves; today can be interpreted as freeing people from bondage or oppression.',
    color: 'text-primary'
  },
  {
    category: 'Al-Gharimin (Those in Debt)',
    arabic: 'الغارمون',
    icon: CurrencyDollar,
    description: 'Those who are in debt and unable to pay it off, especially if incurred for a good cause.',
    color: 'text-accent'
  },
  {
    category: 'Fi Sabilillah (In the Path of Allah)',
    arabic: 'في سبيل الله',
    icon: Book,
    description: 'Those who are striving in the path of Allah, including religious education and dawah activities.',
    color: 'text-primary'
  },
  {
    category: 'Ibnus-Sabil (Stranded Traveler)',
    arabic: 'ابن السبيل',
    icon: Globe,
    description: 'Travelers who are stranded and in need of financial assistance to return home.',
    color: 'text-accent'
  }
]

function App() {
  const isMobile = useIsMobile()
  const [currentPanel, setCurrentPanel] = useState<'input' | 'results'>('input')
  const constraintsRef = useRef<HTMLDivElement>(null)
  const [isHeaderVisible, setIsHeaderVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const scrollThreshold = 10

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

  const assetChartData = useMemo(() => {
    if (!assets) return []
    return [
      { name: 'Cash & Savings', value: assets.cash, color: ASSET_COLORS.cash },
      { name: 'Gold', value: assets.gold, color: ASSET_COLORS.gold },
      { name: 'Silver', value: assets.silver, color: ASSET_COLORS.silver },
      { name: 'Investments', value: assets.investments, color: ASSET_COLORS.investments },
      { name: 'Business Assets', value: assets.business, color: ASSET_COLORS.business },
      { name: 'Cryptocurrency', value: assets.crypto, color: ASSET_COLORS.crypto }
    ].filter(item => item.value > 0)
  }, [assets])

  const comparisonChartData = useMemo(() => {
    return [
      {
        name: 'Total',
        assets: totalAssets,
        liabilities: totalLiabilities,
        net: netAssets
      }
    ]
  }, [totalAssets, totalLiabilities, netAssets])

  const fetchExchangeRates = async () => {
    setIsLoadingRates(true)
    try {
      const currencyList = CURRENCIES.map(c => c.code).join(', ')
      const prompt = `You are a financial data provider. Provide current exchange rates for the following currencies relative to USD (1 USD = X currency).

Required currencies: ${currencyList}

Return ONLY a valid JSON object with currency codes as keys and their exchange rates as numeric values. The USD rate should always be 1. Do not include any explanatory text, comments, trailing commas, or markdown formatting.

Format example:
{
  "USD": 1,
  "EUR": 0.92,
  "GBP": 0.79
}

Return only the JSON object with realistic current exchange rates for all currencies listed.`
      
      const response = await window.spark.llm(prompt, 'gpt-4o-mini', true)
      const rates = JSON.parse(response) as ExchangeRates
      
      if (!rates.USD || rates.USD !== 1) {
        throw new Error('Invalid exchange rate data')
      }
      
      setExchangeRates(rates)
      setLastRateUpdate(Date.now())
      toast.success('Exchange rates updated successfully')
    } catch (error) {
      console.error('Failed to fetch exchange rates:', error)
      toast.error('Failed to update exchange rates. Using default rates.')
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

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      if (Math.abs(currentScrollY - lastScrollY) < scrollThreshold) {
        return
      }

      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setIsHeaderVisible(false)
      } else {
        setIsHeaderVisible(true)
      }

      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY, scrollThreshold])

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

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground">{payload[0].name}</p>
          <p className="text-lg font-bold font-mono text-primary">
            {formatCurrency(payload[0].value)}
          </p>
          <p className="text-xs text-muted-foreground">
            {((payload[0].value / totalAssets) * 100).toFixed(1)}% of total
          </p>
        </div>
      )
    }
    return null
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

  const exportToPDF = () => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 20
    let yPos = 20

    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.text('Zakat Calculation Report', pageWidth / 2, yPos, { align: 'center' })
    
    yPos += 10
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text(`Generated on ${new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}`, pageWidth / 2, yPos, { align: 'center' })
    
    yPos += 15
    doc.setDrawColor(200, 200, 200)
    doc.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 10

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text('Configuration', margin, yPos)
    yPos += 8

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Currency: ${currentCurrency.name} (${currentCurrency.code})`, margin + 5, yPos)
    yPos += 6
    doc.text(`Nisab Standard: ${useGoldNisab ? 'Gold' : 'Silver'}`, margin + 5, yPos)
    yPos += 6
    doc.text(`Gold Price: $${goldPrice.toFixed(2)} per gram`, margin + 5, yPos)
    yPos += 6
    doc.text(`Silver Price: $${silverPrice.toFixed(2)} per gram`, margin + 5, yPos)
    yPos += 6
    doc.text(`Nisab Threshold: ${formatCurrency(nisabThreshold)}`, margin + 5, yPos)
    yPos += 12

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Assets', margin, yPos)
    yPos += 8

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    
    const assetEntries = [
      { label: 'Cash & Savings', value: assets?.cash || 0 },
      { label: 'Gold', value: assets?.gold || 0 },
      { label: 'Silver', value: assets?.silver || 0 },
      { label: 'Investments', value: assets?.investments || 0 },
      { label: 'Business Assets', value: assets?.business || 0 },
      { label: 'Cryptocurrency', value: assets?.crypto || 0 }
    ]

    assetEntries.forEach(entry => {
      doc.text(entry.label, margin + 5, yPos)
      doc.text(formatCurrency(entry.value), pageWidth - margin - 5, yPos, { align: 'right' })
      yPos += 6
    })

    yPos += 2
    doc.setDrawColor(220, 220, 220)
    doc.line(margin + 5, yPos, pageWidth - margin - 5, yPos)
    yPos += 6

    doc.setFont('helvetica', 'bold')
    doc.text('Total Assets', margin + 5, yPos)
    doc.text(formatCurrency(totalAssets), pageWidth - margin - 5, yPos, { align: 'right' })
    yPos += 12

    doc.setFontSize(14)
    doc.text('Liabilities', margin, yPos)
    yPos += 8

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')

    const liabilityEntries = [
      { label: 'Short-term Debt', value: liabilities?.shortTermDebt || 0 },
      { label: 'Long-term Debt', value: liabilities?.longTermDebt || 0 },
      { label: 'Personal Loans', value: liabilities?.loans || 0 },
      { label: 'Other Liabilities', value: liabilities?.other || 0 }
    ]

    liabilityEntries.forEach(entry => {
      doc.text(entry.label, margin + 5, yPos)
      doc.text(formatCurrency(entry.value), pageWidth - margin - 5, yPos, { align: 'right' })
      yPos += 6
    })

    yPos += 2
    doc.line(margin + 5, yPos, pageWidth - margin - 5, yPos)
    yPos += 6

    doc.setFont('helvetica', 'bold')
    doc.text('Total Liabilities', margin + 5, yPos)
    doc.setTextColor(220, 38, 38)
    doc.text(formatCurrency(totalLiabilities), pageWidth - margin - 5, yPos, { align: 'right' })
    yPos += 12

    doc.setTextColor(0, 0, 0)
    doc.setFontSize(16)
    doc.text('Net Assets', margin, yPos)
    yPos += 8

    doc.setFontSize(12)
    doc.setTextColor(37, 99, 235)
    doc.text(formatCurrency(netAssets), margin + 5, yPos)
    yPos += 12

    if (yPos > 240) {
      doc.addPage()
      yPos = 20
    }

    doc.setFontSize(16)
    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'bold')
    doc.text('Zakat Calculation', margin, yPos)
    yPos += 10

    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')

    if (isNisabReached) {
      doc.setTextColor(34, 197, 94)
      doc.text('✓ Nisab threshold reached - Zakat is obligatory', margin + 5, yPos)
      yPos += 10

      doc.setFontSize(10)
      doc.setTextColor(0, 0, 0)
      doc.text(`Zakatable Amount: ${formatCurrency(netAssets)}`, margin + 5, yPos)
      yPos += 6
      doc.text(`Zakat Rate: 2.5%`, margin + 5, yPos)
      yPos += 10

      doc.setFillColor(255, 237, 213)
      doc.roundedRect(margin, yPos - 4, pageWidth - 2 * margin, 18, 3, 3, 'F')
      
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(202, 138, 4)
      doc.text('Zakat Due:', margin + 5, yPos + 6)
      doc.setFontSize(16)
      doc.text(formatCurrency(zakatAmount), pageWidth - margin - 5, yPos + 6, { align: 'right' })
      yPos += 22
    } else {
      doc.setTextColor(100, 100, 100)
      doc.text('Nisab threshold not reached - Zakat is not obligatory at this time', margin + 5, yPos)
      yPos += 8
      doc.setFontSize(10)
      doc.text(`Amount below threshold: ${formatCurrency(nisabThreshold - netAssets)}`, margin + 5, yPos)
      yPos += 10
    }

    doc.setFontSize(8)
    doc.setTextColor(120, 120, 120)
    doc.text('Important Notes:', margin, yPos)
    yPos += 5
    doc.setFontSize(7)
    doc.text('• Zakat is due on wealth that has been held for one complete lunar year (Hawl)', margin + 3, yPos)
    yPos += 4
    doc.text('• This calculation is for informational purposes. Consult a qualified Islamic scholar for specific guidance', margin + 3, yPos)
    yPos += 4
    doc.text('• Zakat should be distributed to the eight categories of recipients mentioned in the Quran', margin + 3, yPos)

    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    const footerText = 'Generated by Zakat Calculator'
    doc.text(footerText, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' })

    const filename = `Zakat_Calculation_${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(filename)
    
    toast.success('PDF exported successfully')
  }

  const handleSwipe = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeThreshold = 50
    
    if (info.offset.x > swipeThreshold && currentPanel === 'results') {
      setCurrentPanel('input')
    } else if (info.offset.x < -swipeThreshold && currentPanel === 'input') {
      setCurrentPanel('results')
    }
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen flex flex-col">
        <motion.header 
          initial={{ y: 0 }}
          animate={{ y: isHeaderVisible ? 0 : -100 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="bg-card border-b sticky top-0 z-10"
        >
          <div className="py-4 px-4 sm:px-6 lg:px-8">
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
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={exportToPDF}
                  className="gap-2"
                >
                  <Download size={16} />
                  <span className="hidden sm:inline">Export PDF</span>
                </Button>
              </div>
            </div>
            {(lastRateUpdate || 0) > 0 && (
              <div className="max-w-[1800px] mx-auto flex items-center gap-2 mt-2">
                <Globe size={14} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{getLastUpdateText()}</span>
              </div>
            )}
          </div>

          {isMobile && (
            <>
              <div className="bg-background/95 backdrop-blur-sm border-t px-4 py-2 flex items-center justify-between">
                <Button
                  variant={currentPanel === 'input' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentPanel('input')}
                  className="flex-1 gap-2"
                >
                  <Coins size={16} />
                  Input
                </Button>
                <Button
                  variant={currentPanel === 'results' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentPanel('results')}
                  className="flex-1 gap-2"
                >
                  <Scales size={16} />
                  Results
                </Button>
              </div>
              <div className="px-4 py-2 bg-muted/30 flex items-center justify-center gap-2 text-xs text-muted-foreground border-t">
                <CaretLeft size={12} />
                <span>Swipe to navigate</span>
                <CaretRight size={12} />
              </div>
            </>
          )}
        </motion.header>

        <div className="grid grid-cols-1 lg:grid-cols-2 max-w-[1800px] mx-auto relative overflow-hidden flex-1" ref={constraintsRef}>
          {isMobile ? (
            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={handleSwipe}
              className="w-full"
            >
              <AnimatePresence mode="wait">
                {currentPanel === 'input' ? (
                  <motion.div
                    key="input-panel"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="lg:border-r bg-background/50 p-4 sm:p-6 lg:p-8 space-y-6"
                  >
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
                        <p className="pt-2 border-t">
                          Zakat must be distributed to one of eight categories of recipients as specified in the Quran (9:60). 
                          View the Recipients tab in the Results section to learn more.
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ) : (
                  <motion.div
                    key="results-panel"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 20, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="bg-muted/30 p-4 sm:p-6 lg:p-8 space-y-6"
                  >
                    <div>
                      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Scales className="text-accent" size={24} />
                        Calculation Results
                      </h2>

                      <Tabs defaultValue="summary" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="charts">Charts</TabsTrigger>
                  <TabsTrigger value="recipients">Recipients</TabsTrigger>
                </TabsList>

                <TabsContent value="summary" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm text-muted-foreground">Nisab Threshold</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold font-mono text-primary break-all">
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
                      <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold font-mono break-all">
                        {formatCurrency(totalAssets)}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm text-muted-foreground">Total Liabilities</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold font-mono text-destructive break-all">
                        {formatCurrency(totalLiabilities)}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-primary/30">
                    <CardHeader>
                      <CardTitle className="text-sm text-muted-foreground">Net Assets</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold font-mono text-primary break-all">
                        {formatCurrency(netAssets)}
                      </p>
                      <div className="mt-4">
                        <Progress value={nisabPercentage} className="h-3" />
                        <p className="text-xs text-muted-foreground text-center mt-2 break-words">
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

                  {netAssets > 0 && (
                    <Button 
                      onClick={exportToPDF}
                      className="w-full gap-2"
                      size="lg"
                    >
                      <FilePdf size={20} />
                      Export Calculation as PDF
                    </Button>
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
                            <p className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold font-mono text-accent animate-count-up break-all">
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
                </TabsContent>

                <TabsContent value="charts" className="space-y-4 mt-4">
                  {assetChartData.length > 0 ? (
                    <>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <ChartPie className="text-primary" size={20} />
                            Asset Distribution
                          </CardTitle>
                          <CardDescription>
                            Breakdown of your zakatable wealth
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                              <Pie
                                data={assetChartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {assetChartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <RechartsTooltip content={<CustomTooltip />} />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="mt-4 space-y-2">
                            {assetChartData.map((item) => (
                              <div key={item.name} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-3 h-3 rounded-full" 
                                    style={{ backgroundColor: item.color }}
                                  />
                                  <span className="text-muted-foreground">{item.name}</span>
                                </div>
                                <span className="font-mono font-medium">
                                  {formatCurrency(item.value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <ChartBar className="text-primary" size={20} />
                            Assets vs Liabilities
                          </CardTitle>
                          <CardDescription>
                            Financial overview comparison
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={comparisonChartData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.88 0.01 220)" />
                              <XAxis dataKey="name" hide />
                              <YAxis 
                                tickFormatter={(value) => {
                                  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
                                  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
                                  return value.toString()
                                }}
                              />
                              <RechartsTooltip 
                                formatter={(value: number) => formatCurrency(value)}
                                contentStyle={{
                                  backgroundColor: 'oklch(0.99 0 0)',
                                  border: '1px solid oklch(0.88 0.01 220)',
                                  borderRadius: '8px'
                                }}
                              />
                              <Legend />
                              <Bar 
                                dataKey="assets" 
                                fill="oklch(0.48 0.08 210)" 
                                name="Total Assets" 
                                radius={[8, 8, 0, 0]}
                              />
                              <Bar 
                                dataKey="liabilities" 
                                fill="oklch(0.577 0.245 27.325)" 
                                name="Total Liabilities" 
                                radius={[8, 8, 0, 0]}
                              />
                              <Bar 
                                dataKey="net" 
                                fill="oklch(0.70 0.15 75)" 
                                name="Net Assets" 
                                radius={[8, 8, 0, 0]}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    </>
                  ) : (
                    <Card>
                      <CardContent className="text-center py-12">
                        <ChartPie className="mx-auto text-muted-foreground mb-4" size={48} />
                        <p className="text-sm text-muted-foreground">
                          Enter your assets to view visual charts
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="recipients" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Users className="text-primary" size={20} />
                        Eight Categories of Zakat Recipients
                      </CardTitle>
                      <CardDescription>
                        As mentioned in Surah At-Tawbah (9:60)
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {ZAKAT_RECIPIENTS.map((recipient, index) => (
                        <motion.div
                          key={recipient.category}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Card className="border-l-4 border-l-primary/50 hover:shadow-sm transition-shadow">
                            <CardContent className="pt-4 pb-4">
                              <div className="flex items-start gap-3">
                                <recipient.icon 
                                  className={`${recipient.color} mt-1 flex-shrink-0`} 
                                  size={24} 
                                />
                                <div className="flex-1 space-y-1">
                                  <div className="flex items-start justify-between gap-2">
                                    <h3 className="font-semibold text-sm leading-tight">
                                      {index + 1}. {recipient.category}
                                    </h3>
                                    <span className="text-xs text-muted-foreground font-serif whitespace-nowrap">
                                      {recipient.arabic}
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground leading-relaxed">
                                    {recipient.description}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="bg-secondary/50">
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Info className="text-primary" size={16} />
                        Quranic Reference
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-xs text-muted-foreground">
                      <div className="bg-background/80 p-3 rounded-lg border">
                        <p className="text-sm italic leading-relaxed">
                          "The alms are only for the poor and the needy, and those who collect them, and those whose hearts are to be reconciled, and to free the slaves and the debtors, and for the cause of Allah, and for the wayfarer; a duty imposed by Allah. Allah is Knower, Wise."
                        </p>
                        <p className="text-xs text-muted-foreground mt-2 text-right">
                          - Quran 9:60
                        </p>
                      </div>
                      <p>
                        Zakat must be distributed to one or more of these eight categories. It cannot be given to parents, grandparents, children, grandchildren, or the Prophet's descendants.
                      </p>
                      <p>
                        Scholars recommend researching and verifying organizations before donating to ensure Zakat reaches legitimate recipients.
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <>
              <InputPanel
                assets={assets}
                liabilities={liabilities}
                goldPrice={goldPrice}
                silverPrice={silverPrice}
                useGoldNisab={useGoldNisab}
                currentCurrency={currentCurrency}
                exchangeRate={exchangeRate}
                setGoldPrice={setGoldPrice}
                setSilverPrice={setSilverPrice}
                setUseGoldNisab={setUseGoldNisab}
                updateAsset={updateAsset}
                updateLiability={updateLiability}
                handleClearData={handleClearData}
                assetCategories={assetCategories}
                liabilityCategories={liabilityCategories}
              />
              <ResultsPanel
                nisabThreshold={nisabThreshold}
                useGoldNisab={useGoldNisab}
                totalAssets={totalAssets}
                totalLiabilities={totalLiabilities}
                netAssets={netAssets}
                nisabPercentage={nisabPercentage}
                isNisabReached={isNisabReached}
                zakatAmount={zakatAmount}
                showZakat={showZakat}
                formatCurrency={formatCurrency}
                exportToPDF={exportToPDF}
                assetChartData={assetChartData}
                comparisonChartData={comparisonChartData}
                CustomTooltip={CustomTooltip}
              />
            </>
          )}
        </div>

        <footer className="bg-card border-t py-4 px-4 sm:px-6 lg:px-8 mt-auto">
          <div className="max-w-[1800px] mx-auto text-center">
            <p className="text-sm text-muted-foreground">
              Created by{' '}
              <a 
                href="https://starfolksoftware.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 transition-colors font-medium underline-offset-4 hover:underline"
              >
                Starfolk Software Tech. Ltd.
              </a>
            </p>
          </div>
        </footer>
      </div>
    </TooltipProvider>
  )
}

function InputPanel({ assets, liabilities, goldPrice, silverPrice, useGoldNisab, currentCurrency, exchangeRate, setGoldPrice, setSilverPrice, setUseGoldNisab, updateAsset, updateLiability, handleClearData, assetCategories, liabilityCategories }: any) {
  return (
    <div className="lg:border-r bg-background/50 p-4 sm:p-6 lg:p-8 space-y-6 lg:overflow-y-auto lg:max-h-[calc(100vh-100px)]">
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
          {assetCategories.map((category: any) => (
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
          {liabilityCategories.map((category: any) => (
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
          <p className="pt-2 border-t">
            Zakat must be distributed to one of eight categories of recipients as specified in the Quran (9:60). 
            View the Recipients tab in the Results section to learn more.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function ResultsPanel({ nisabThreshold, useGoldNisab, totalAssets, totalLiabilities, netAssets, nisabPercentage, isNisabReached, zakatAmount, showZakat, formatCurrency, exportToPDF, assetChartData, comparisonChartData, CustomTooltip }: any) {
  return (
    <div className="bg-muted/30 p-4 sm:p-6 lg:p-8 space-y-6 lg:overflow-y-auto lg:max-h-[calc(100vh-100px)]">
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Scales className="text-accent" size={24} />
          Calculation Results
        </h2>

        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="charts">Charts</TabsTrigger>
            <TabsTrigger value="recipients">Recipients</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">Nisab Threshold</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold font-mono text-primary break-all">
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
                <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold font-mono break-all">
                  {formatCurrency(totalAssets)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">Total Liabilities</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold font-mono text-destructive break-all">
                  {formatCurrency(totalLiabilities)}
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/30">
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">Net Assets</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold font-mono text-primary break-all">
                  {formatCurrency(netAssets)}
                </p>
                <div className="mt-4">
                  <Progress value={nisabPercentage} className="h-3" />
                  <p className="text-xs text-muted-foreground text-center mt-2 break-words">
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

            {netAssets > 0 && (
              <Button 
                onClick={exportToPDF}
                className="w-full gap-2"
                size="lg"
              >
                <FilePdf size={20} />
                Export Calculation as PDF
              </Button>
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
                      <p className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold font-mono text-accent animate-count-up break-all">
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
          </TabsContent>

          <TabsContent value="charts" className="space-y-4 mt-4">
            {assetChartData.length > 0 ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <ChartPie className="text-primary" size={20} />
                      Asset Distribution
                    </CardTitle>
                    <CardDescription>
                      Breakdown of your zakatable wealth
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={assetChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {assetChartData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-4 space-y-2">
                      {assetChartData.map((item: any) => (
                        <div key={item.name} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="text-muted-foreground">{item.name}</span>
                          </div>
                          <span className="font-mono font-medium">
                            {formatCurrency(item.value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <ChartBar className="text-primary" size={20} />
                      Assets vs Liabilities
                    </CardTitle>
                    <CardDescription>
                      Financial overview comparison
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={comparisonChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.88 0.01 220)" />
                        <XAxis dataKey="name" hide />
                        <YAxis 
                          tickFormatter={(value) => {
                            if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
                            if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
                            return value.toString()
                          }}
                        />
                        <RechartsTooltip 
                          formatter={(value: number) => formatCurrency(value)}
                          contentStyle={{
                            backgroundColor: 'oklch(0.99 0 0)',
                            border: '1px solid oklch(0.88 0.01 220)',
                            borderRadius: '8px'
                          }}
                        />
                        <Legend />
                        <Bar 
                          dataKey="assets" 
                          fill="oklch(0.48 0.08 210)" 
                          name="Total Assets" 
                          radius={[8, 8, 0, 0]}
                        />
                        <Bar 
                          dataKey="liabilities" 
                          fill="oklch(0.577 0.245 27.325)" 
                          name="Total Liabilities" 
                          radius={[8, 8, 0, 0]}
                        />
                        <Bar 
                          dataKey="net" 
                          fill="oklch(0.70 0.15 75)" 
                          name="Net Assets" 
                          radius={[8, 8, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <ChartPie className="mx-auto text-muted-foreground mb-4" size={48} />
                  <p className="text-sm text-muted-foreground">
                    Enter your assets to view visual charts
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="recipients" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="text-primary" size={20} />
                  Eight Categories of Zakat Recipients
                </CardTitle>
                <CardDescription>
                  As mentioned in Surah At-Tawbah (9:60)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {ZAKAT_RECIPIENTS.map((recipient, index) => (
                  <motion.div
                    key={recipient.category}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="border-l-4 border-l-primary/50 hover:shadow-sm transition-shadow">
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-start gap-3">
                          <recipient.icon 
                            className={`${recipient.color} mt-1 flex-shrink-0`} 
                            size={24} 
                          />
                          <div className="flex-1 space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-semibold text-sm leading-tight">
                                {index + 1}. {recipient.category}
                              </h3>
                              <span className="text-xs text-muted-foreground font-serif whitespace-nowrap">
                                {recipient.arabic}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {recipient.description}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-secondary/50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Info className="text-primary" size={16} />
                  Quranic Reference
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-muted-foreground">
                <div className="bg-background/80 p-3 rounded-lg border">
                  <p className="text-sm italic leading-relaxed">
                    "The alms are only for the poor and the needy, and those who collect them, and those whose hearts are to be reconciled, and to free the slaves and the debtors, and for the cause of Allah, and for the wayfarer; a duty imposed by Allah. Allah is Knower, Wise."
                  </p>
                  <p className="text-xs text-muted-foreground mt-2 text-right">
                    - Quran 9:60
                  </p>
                </div>
                <p>
                  Zakat must be distributed to one or more of these eight categories. It cannot be given to parents, grandparents, children, grandchildren, or the Prophet's descendants.
                </p>
                <p>
                  Scholars recommend researching and verifying organizations before donating to ensure Zakat reaches legitimate recipients.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default App