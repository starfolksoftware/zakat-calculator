# Planning Guide

A web application that helps Muslims accurately calculate their Zakat obligations by tracking various asset types and applying the correct Nisab threshold and calculation rules.

**Experience Qualities**: 
1. **Trustworthy** - The calculator must provide accurate, religiously compliant calculations that users can rely on for their spiritual obligations
2. **Accessible** - Clear explanations and guidance make Zakat calculation straightforward even for those unfamiliar with the detailed rules
3. **Respectful** - The design should reflect the spiritual nature of Zakat with dignified aesthetics and thoughtful interactions

**Complexity Level**: Light Application (multiple features with basic state)
- The app manages multiple asset categories, performs calculations, and persists user data, but remains focused on a single core purpose without requiring complex multi-view navigation or advanced features.

## Essential Features

### Asset Category Input
- **Functionality**: Users can input values for different asset types (cash, gold, silver, investments, business assets, crypto)
- **Purpose**: Zakat applies to different types of wealth, each requiring separate tracking
- **Trigger**: User navigates to asset input section or clicks to add/edit asset values
- **Progression**: View asset categories → Select category → Enter amount → Save → See updated total
- **Success criteria**: All values persist correctly, calculations update in real-time, input validation prevents invalid entries

### Nisab Threshold Calculation
- **Functionality**: Automatically fetches current gold/silver prices and calculates the Nisab threshold (minimum wealth requiring Zakat)
- **Purpose**: The Nisab determines whether Zakat is obligated and helps users understand if they've reached the threshold
- **Trigger**: App loads or user refreshes prices
- **Progression**: App loads → Fetch gold/silver prices → Calculate Nisab → Display threshold → Compare with user's total assets
- **Progression**: Manual entry selected → User enters current gold/silver price → Calculate Nisab → Display threshold
- **Success criteria**: Prices are current, threshold is accurately calculated, user can see if they've reached Nisab

### Multi-Currency Support
- **Functionality**: Supports 14+ major currencies with automatic exchange rate conversion
- **Purpose**: Users worldwide can calculate Zakat in their local currency for better understanding and planning
- **Trigger**: User selects their preferred currency from dropdown
- **Progression**: Select currency → Fetch exchange rates → Convert Nisab threshold → Display all values in selected currency
- **Success criteria**: Exchange rates update daily, accurate conversion, gold/silver prices in USD automatically convert to selected currency

### Zakat Amount Display
- **Functionality**: Calculates 2.5% of total zakatable assets once Nisab is reached
- **Purpose**: Provides the exact amount owed for Zakat
- **Trigger**: User enters assets totaling above Nisab threshold
- **Progression**: Assets entered → Total calculated → Compare to Nisab → If above Nisab → Calculate 2.5% → Display Zakat amount
- **Success criteria**: Accurate 2.5% calculation, clear display of amount owed, updates automatically as assets change

### Educational Guidance
- **Functionality**: Provides brief explanations of Zakat rules, Nisab, and which assets are zakatable
- **Purpose**: Helps users understand what to include and why, promoting confidence and religious understanding
- **Trigger**: User hovers/clicks info icons or views help section
- **Progression**: User encounters unfamiliar term → Clicks info icon → Reads explanation → Closes tooltip → Continues with confidence
- **Success criteria**: Information is accurate, concise, and accessible without cluttering the interface

### Data Persistence
- **Functionality**: Saves all entered asset values, currency preference, and exchange rates locally
- **Purpose**: Users can return to update their calculations throughout the year without re-entering data
- **Trigger**: Automatic save on any data change
- **Progression**: User enters data → Auto-save triggers → Data stored → User returns later → Data restored
- **Success criteria**: No data loss between sessions, seamless restoration on return visits, exchange rates cached for 24 hours

## Edge Case Handling
- **Empty State**: Show welcoming guide explaining Zakat and encouraging users to start entering assets
- **Below Nisab**: Clearly communicate that Zakat is not obligated but show how close they are to the threshold
- **Invalid Input**: Prevent negative numbers, non-numeric entries; provide helpful error messages
- **Network Failure**: If exchange rate fetch fails, use cached rates and show update timestamp
- **Currency Switch**: When switching currencies, preserve asset values (don't auto-convert existing entries)
- **Very Large Numbers**: Handle formatting for large asset values with proper comma/space separation and currency-specific formatting

## Design Direction
The design should evoke a sense of spiritual dignity, clarity, and trustworthiness—combining Islamic geometric patterns with modern minimalism to create an interface that feels both sacred and accessible.

## Color Selection
A rich teal and gold palette inspired by Islamic art, balanced with neutral tones for readability and sophistication.

- **Primary Color**: Deep Teal (oklch(0.48 0.08 210)) - Represents wisdom, spirituality, and trust; used for primary actions and important UI elements
- **Secondary Colors**: Warm cream background (oklch(0.97 0.01 85)) for softness; Dark slate (oklch(0.25 0.02 220)) for important text and structure
- **Accent Color**: Rich Gold (oklch(0.70 0.15 75)) - Represents value and sacred duty; used for highlighting Zakat amounts and key metrics
- **Foreground/Background Pairings**: 
  - Background (Warm Cream oklch(0.97 0.01 85)): Dark Slate text (oklch(0.25 0.02 220)) - Ratio 11.2:1 ✓
  - Primary (Deep Teal oklch(0.48 0.08 210)): White text (oklch(1 0 0)) - Ratio 5.8:1 ✓
  - Accent (Rich Gold oklch(0.70 0.15 75)): Dark Slate text (oklch(0.25 0.02 220)) - Ratio 5.2:1 ✓
  - Card (White oklch(0.99 0 0)): Dark Slate text (oklch(0.25 0.02 220)) - Ratio 13.1:1 ✓

## Font Selection
Typography should balance traditional elegance with modern clarity, reflecting both the spiritual significance and practical utility of the application.

- **Typographic Hierarchy**: 
  - H1 (App Title): Amiri 700 / 32px / normal letter spacing - Elegant Arabic-style serif for the main heading
  - H2 (Section Headers): Inter 600 / 20px / tight letter spacing - Clean, professional section divisions
  - H3 (Asset Categories): Inter 500 / 16px / normal letter spacing
  - Body (Descriptions): Inter 400 / 15px / relaxed line height (1.6)
  - Numbers (Asset Values): JetBrains Mono 500 / 18px / tabular figures - Clear, precise financial display
  - Labels: Inter 500 / 14px / slight letter spacing (0.01em)

## Animations
Animations should be subtle and purposeful, reinforcing the calculated nature of the app while adding moments of delight when milestones are reached. Gentle transitions guide focus, while celebratory micro-interactions acknowledge when Nisab is reached.

- Smooth number counting animations when calculating totals
- Gentle fade and slide transitions between states
- Subtle scale and glow effect when Nisab threshold is crossed
- Smooth expansion/collapse for educational tooltips
- Delicate pulse animation on the Zakat amount when first displayed

## Component Selection
- **Components**: 
  - Card for asset category containers with subtle shadows and borders
  - Input for numeric asset entry with currency formatting
  - Select dropdown for currency selection with currency symbols and codes
  - Tooltip for educational information on hover/click
  - Badge for displaying Nisab status (reached/not reached)
  - Separator for dividing sections cleanly
  - Button for primary actions (calculate, refresh prices, clear data)
  - Progress indicator showing how close user is to Nisab threshold
  - Alert for important notifications (below Nisab, calculation complete)
- **Customizations**: 
  - Custom Islamic geometric pattern background using CSS gradients and shapes
  - Custom number input with currency symbol and auto-formatting
  - Custom "Nisab meter" component showing progress toward threshold
  - Animated counter component for displaying calculated Zakat
- **States**: 
  - Inputs: Soft border in default, teal border with subtle glow on focus, red border for validation errors
  - Buttons: Teal primary with white text, hover darkens slightly with subtle lift effect, active state scales down
  - Cards: White with soft shadow, hover lifts slightly, active/selected shows teal left border accent
- **Icon Selection**: 
  - Coins for cash/money categories
  - Scales for balance/calculation
  - TrendUp for investments
  - Storefront for business assets
  - Globe for currency and exchange rate information
  - Info for educational tooltips
  - ArrowsClockwise for refreshing exchange rates
  - CheckCircle when Nisab is reached
- **Spacing**: 
  - Container padding: 6 (1.5rem)
  - Card padding: 5 (1.25rem)
  - Section gaps: 8 (2rem)
  - Form element gaps: 4 (1rem)
  - Input internal padding: 3 (0.75rem)
- **Mobile**: 
  - Stack asset category cards vertically on mobile
  - Increase touch targets to minimum 44px
  - Collapse secondary information into expandable sections
  - Make Nisab threshold sticky at top on mobile
  - Simplify educational tooltips to bottom sheets on mobile
