# Normalized price input

Import an array of up to 10,000 rows, at most 3 MB in the browser. Download the timestamped fictional example from the board. Invalid imports leave existing data intact. This research input contract is separate from the Unabated response schema.

| Field | Meaning |
| --- | --- |
| `id` | Unique price-record string |
| `league`, `eventId`, `event` | Stable league/event IDs and event display name |
| `marketId`, `market` | Canonical market ID shared across books and market display name |
| `selection` | Exact display/betslip description, including signed spread, total/prop threshold, team/player and direction |
| `period` | Exact period identity, such as full game or first half |
| `settlement` | Shared settlement identity including overtime/void rules; equivalence requires review |
| `line` | Shared numeric threshold or null; for spreads use a reviewed canonical threshold shared by both opposing outcomes, with signs preserved in `selection` |
| `kind` | `binary` or `three-way` |
| `outcomes` | Complete canonical outcome list, identical throughout the market |
| `outcome` | Selected canonical outcome, from `outcomes` |
| `book` | Source name; output restricted to `DraftKings` and `Polymarket US` |
| `odds` | Numeric American price, at least +100 or at most -100 |
| `observedAt` | Per-price ISO timestamp; never stamp an old quote with download time |
| `startsAt` | Exact event start ISO timestamp, identical within the market |
| `available` | Must explicitly be true for usable quotes |
| `noPush` | Must explicitly be true; integer lines and unresolved refunds need a fuller model |
| `verified` | User-supplied review flag; true required for card eligibility |
| `evidenceUrl`, `evidenceCheckedAt` | Source and ISO review time, at most one hour old |
| `feePerDollar` | Nonnegative all-in fee per dollar risked; required and explicitly verified for Polymarket US |
| `usMarketVerified`, `feesVerified`, `liquidityVerified` | All true required for Polymarket US; global contracts cannot be relabeled |
| `isDemo` | True for fictional demonstration inputs, always excluded from real slips |
| `modelProbability` | Optional user estimate strictly between 0 and 1; displayed separately, not an app simulation |
| `deepLink` | Optional exact returned/imported HTTPS selection link; preload remains untested |

For each complete reference book, convert American prices to implied probabilities and divide by their sum. Average the selected outcome's normalized probability across at least two books. This proportional no-vig estimate is not an independent forecast: books can copy one another and carry common bias.

Estimated return per dollar risked is `estimate * decimal payout - 1 - feePerDollar`. Minimum estimated value defaults to 2%. Push-capable markets are blocked. A delayed-snapshot gap is a research signal and may disappear before execution.

Spreads, team totals and props require reviewed canonical IDs and outcome mapping from the importer. No automatic entity matching, settlement inference, stats lookup, injury lookup or arbitrage claim is made. The verified flag records a researcher's review; it does not prove the linked source supports the claim.
