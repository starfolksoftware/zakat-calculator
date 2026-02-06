import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

interface Currency {
  code: string
  symbol: string
  name: string
}

interface ExchangeRates {
  [key: string]: number
}

interface ExchangeRateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currencies: Currency[]
  currentRates: ExchangeRates
  onSave: (rates: ExchangeRates) => void
}

export function ExchangeRateDialog({
  open,
  onOpenChange,
  currencies,
  currentRates,
  onSave,
}: ExchangeRateDialogProps) {
  const [rates, setRates] = useState<ExchangeRates>(currentRates)

  // Sync local state when currentRates prop changes or dialog opens
  useEffect(() => {
    if (open) {
      setRates(currentRates)
    }
  }, [open, currentRates])

  const handleRateChange = (currencyCode: string, value: string) => {
    const numValue = parseFloat(value)
    // Allow empty values or valid numbers >= 0.01
    if (value === '' || (!isNaN(numValue) && numValue >= 0.01)) {
      setRates((prev) => ({
        ...prev,
        [currencyCode]: value === '' ? 0 : numValue,
      }))
    }
  }

  const handleSave = () => {
    // Validate that all rates are positive numbers >= 0.01
    const invalidRates = Object.entries(rates).filter(
      ([code, rate]) => code !== 'USD' && (typeof rate !== 'number' || rate < 0.01 || isNaN(rate))
    )

    if (invalidRates.length > 0) {
      toast.error('Please enter valid exchange rates (at least 0.01) for all currencies')
      return
    }

    // Ensure USD is always 1
    const finalRates = { ...rates, USD: 1 }
    onSave(finalRates)
    onOpenChange(false)
    toast.success('Exchange rates updated successfully')
  }

  const handleCancel = () => {
    setRates(currentRates)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Set Exchange Rates</DialogTitle>
          <DialogDescription>
            Enter exchange rates relative to USD (1 USD = X currency). USD is always 1.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-3 items-center gap-4 font-semibold text-sm text-muted-foreground">
            <div>Currency</div>
            <div className="col-span-2">Exchange Rate (per 1 USD)</div>
          </div>
          
          {currencies.map((currency) => (
            <div key={currency.code} className="grid grid-cols-3 items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="font-medium">{currency.code}</span>
                <span className="text-sm text-muted-foreground">
                  {currency.symbol}
                </span>
              </div>
              <div className="col-span-2">
                {currency.code === 'USD' ? (
                  <Input
                    type="number"
                    value="1"
                    disabled
                    className="bg-muted"
                  />
                ) : (
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={rates[currency.code] || ''}
                    onChange={(e) => handleRateChange(currency.code, e.target.value)}
                    placeholder={`Enter rate for ${currency.code}`}
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Exchange Rates
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
