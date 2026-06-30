# Stock Percent Calculator

Stock Percent Calculator is a Chrome extension for quickly calculating fee-inclusive stock target prices and return rates.

Enter a buy price and target return rate to calculate the fee-inclusive target price, or enter a target price to calculate the actual return rate. Your latest inputs are saved in Chrome local storage, so they remain available when you reopen the popup.

![Stock Percent Calculator marquee](store-assets/marquee-promo-tile-1400x560.png)

## Screenshot

![Stock Percent Calculator screenshot](store-assets/screenshot-1280x800.png)

## Features

- Calculate a target price from a buy price and desired return rate
- Reverse-calculate the actual return rate from a target price
- Enter a position quantity to calculate total net profit
- Switch between upward and downward price movement
- Quick return buttons for `-10%`, `-5%`, `-3%`, `-1%`, `+1%`, `+3%`, `+5%`, and `+10%`
- Default `0.025%` fee with selectable fee presets
- Custom fee input
- Fee-adjusted net profit display
- Key-level table for common price changes, target prices, and net profit
- Automatic input persistence and reset support

## Installation

1. Open `chrome://extensions` in Chrome.
2. Enable **Developer mode** in the top-right corner.
3. Click **Load unpacked**.
4. Select this project folder.
5. Click the **Stock Percent Calculator** icon in the browser toolbar.

## Usage

1. Enter your buy price in `Buy Price`.
2. Enter the desired return rate in `Change`, or use one of the quick return buttons.
3. Enter your share count in `Quantity` to calculate total net profit.
4. Check the calculated `Target` price and `Net Profit`.
5. Enter a target price directly to reverse-calculate `Change`.
6. Choose a fee preset in `Fee`, or enter a custom fee rate.
7. Open `View key levels` to see target prices for common return levels.
8. Click `Clear` to reset the inputs and saved values.

## Calculation

When entering a return rate:

```text
target price = buy price * (1 + (return rate + directional fee rate) / 100)
```

When entering a target price:

```text
displayed return rate = ((target price - buy price) / buy price * 100) - directional fee rate
```

Net profit is shown after applying the fee amount based on the buy price. If a quantity is entered, net profit is multiplied by that quantity.

## Project Structure

```text
.
├── manifest.json        # Chrome Extension Manifest V3 configuration
├── popup.html           # Extension popup UI
├── popup.css            # Popup styles
├── popup.js             # Calculation, persistence, and event logic
├── icon16.png           # Extension icons
├── icon48.png
├── icon128.png
├── store-assets/        # README and Chrome Web Store images
│   ├── marquee-promo-tile-1400x560.png
│   ├── screenshot-1280x800.png
│   └── small-promo-tile-440x280.png
└── test/
    └── popup.test.mjs   # Node-based behavior tests
```

## Testing

Run the tests with Node.js. No package installation is required.

```bash
node test/popup.test.mjs
```

The tests cover the popup HTML structure, manifest permissions, calculation logic, save/restore behavior, and reset behavior.

## Permissions

This extension only uses the following Chrome permission:

- `storage`: Saves the latest inputs, return direction, and fee setting locally.

## Tech Stack

- Chrome Extension Manifest V3
- HTML
- CSS
- Vanilla JavaScript
- Node.js built-in test runtime
