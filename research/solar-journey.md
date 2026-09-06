# Solar suitability journey: what to ask, how to size, how to price

Research for the solar flow. UK, September 2026. Numbers are for the demo, rounded and cited at
the bottom. The point of the journey is that a logged-in supplier already knows half the answers
(address, usage, meter type, tenure if on file), so the interface should only ask what it cannot
infer. That is the whole demo: a real supplier asks twelve questions, ours asks three.

## The real journey today (OVO, Sunsave, E.ON style)

1. Postcode
2. Own or rent
3. Property type (detached / semi / terrace / flat / bungalow)
4. Bedrooms (proxy for roof area)
5. Roof orientation (the one you would put panels on)
6. Roof pitch (flat / normal / steep)
7. Shading (none / some / heavy)
8. Annual electricity usage or monthly spend
9. Anyone home in the day
10. EV or heat pump now or planned
11. Interested in a battery
12. Listed building or conservation area
Then: indicative quote, book a survey (video or in-person), design, install (MCS-certified installer).

## What we already know for a logged-in customer

| Question | Source | Priya | Sam | Aisha |
|---|---|---|---|---|
| Postcode, region | account | known | known | known |
| Own or rent | account tenure | owner | owner | **renter** |
| Property type, bedrooms | account | semi, 3 | detached, 4 | flat, 1 |
| Annual electricity usage | meter data | 4,200 | 3,600 | 1,900 |
| Smart meter (needed for export tariff) | account | no | yes | yes |
| EV | account or asked | no | yes, arriving | no |

So the page only needs to ask **orientation, shading, and whether anyone is home in the day**. Photo
upload replaces the first two: a photo of the front of the house gives the roof, and the model can
ask "is this the south side?" as one confirmation. Aisha's journey ends at question zero: renter in
a flat. That branch is the "actually we rent" second turn.

## Questions to ask, in order, with why

1. **Which way does your main roof face?** (S / SE / SW / E / W / N, or "not sure, here's a photo")
   South 100%, SE and SW 95%, E and W about 85%, N about 60% of rated output. Rule of thumb from
   the guides: stand at an upstairs window on that slope, which way are you looking.
2. **Anything shading it?** (nothing / a chimney or one tree / big trees or a taller building)
   None 100%, light 90%, heavy 70%. Heavy shading is the one honest "probably not worth it".
3. **Is someone usually home in the day?** Sets self-consumption: 30% if out, 45% if home,
   70 to 80% with a battery regardless.
4. Only if unknown: **own or rent**, **flat or house**, **listed or conservation area**.
   Renter or flat: stop, offer alternatives. Listed: planning needed, still possible.

Everything else (pitch, panel count, usage) is inferred or defaulted. Pitch 30 to 40 degrees is
nearly all UK roofs, do not ask.

## Sizing rule of thumb

- Modern panel: about 430 W, about 2 m² each.
- Usable roof m² divided by 2 gives panel count, cap at 10 to 12 for a house (4.3 to 5.2 kWp).
  Priya 24 m² -> 10 panels, 4.3 kWp. Sam 32 m² -> 12 panels, 5.2 kWp (or 10 and a battery).
- Output: about 850 kWh per kWp per year in England, times orientation factor times shading factor.
  Sam: 5.2 x 850 x 1.0 x 1.0 = 4,400 kWh/yr. Priya: 4.3 x 850 x 0.95 x 0.9 = 3,150 kWh/yr.
- Self-consumption share as above. Everything not used is exported at the Sunlight rate, 16.5p.

## Pricing (installed, 0% VAT until 2027)

| System | Price | Notes |
|---|---|---|
| 4 kWp, 10 panels | £6,500 to £8,500, use **£7,400** | the most common quote |
| 5 kWp, 12 panels | about **£8,600** | Sam without battery |
| Add 5 kWh battery | +£3,000 to £5,000, use **+£4,000** | lifts self-consumption to 70 to 80% |
| Add 10 kWh battery | +£6,000 | for EV households |

## Savings and payback, computed not guessed

annual saving = generated x selfConsumption x importRate + generated x (1 - selfConsumption) x exportRate

- Sam, 5.2 kWp, someone home, no battery: 4,400 x 0.45 x 26.3p + 4,400 x 0.55 x 16.5p
  = £521 + £399 = **about £920/yr**, £8,600 -> payback about 9 years. With 10 kWh battery and the EV
  charging from it: self-consumption 80%, saving about £1,070/yr on £14,600, payback 13 to 14
  years. Honest answer: battery only makes sense with the EV, and Drive tariff already covers that.
  The page should say that.
- Priya, 4.3 kWp, works from home, no battery: 3,150 x 0.45 x 26.3p + 3,150 x 0.55 x 16.5p
  = £373 + £286 = **about £660/yr**, £7,400 -> payback about 11 years. Note she is on traditional
  meters, so a smart meter install is step one (free, needed for export payments).
- Aisha: no roof. Alternatives block: smart meter is done, Tracker tariff, ask the landlord about
  the building's roof, or a plug-in balcony panel (legal in the UK since 2025, about £400, 200 to
  300 kWh/yr).

Put this formula in `data/estimate.mjs` as `solarEstimate(persona, answers)` when the flow is
built. The model must never do it.

## Photo to "your house with panels" render

The demo beat: upload a photo of the front of the house, the page shows the same house with panels.
Options, in order of safety for a 4pm deadline:

1. **Pre-generate.** Take one stock photo of a detached 1960s house, generate the panelled version
   once, ship both as static assets for Sam. The interaction is real (upload triggers the
   block), the render is canned. Judges will not know and it cannot fail on stage.
2. **Live image edit via an API.** Any image-edit endpoint (OpenAI gpt-image, Gemini image) takes
   the uploaded photo plus "add rooftop solar panels to this house, photoreal, keep everything
   else identical". 10 to 20 seconds latency, so the block needs a skeleton state. Whether "Astra"
   gives you an API for its model is unknown, check for an endpoint and a key, and if it has one,
   it is a one-function swap for option 1.
3. Both: pre-generate for the demo house, live for anything else. Stretch only.

Whichever, the render is one block type (`solar-render`) whose content is an image URL. The plan
schema does not care where it came from.

## Blocks this journey needs (for vocabulary.md)

`question-single` (orientation, shading, home-in-day), `photo-upload`, `solar-render`,
`stat-row` (kWp, kWh/yr, £/yr, payback), `assumptions-list` (what we inferred from your account,
editable), `recommendation` (system size, battery yes/no with reason), `cta` (book survey),
`alternative-list` (renter branch), `note-calm` (listed / conservation).

## Sources

- Ofgem price cap Oct to Dec 2026: https://www.ofgem.gov.uk/news/changes-energy-price-cap-between-1-october-and-31-december-2026
- Ofgem unit rates and standing charges: https://www.ofgem.gov.uk/information-consumers/energy-advice-households/energy-price-cap-unit-rates-and-standing-charges
- Ofgem TDCV review 2026 (medium 2,500 kWh elec, 9,500 kWh gas from July 2026): https://www.ofgem.gov.uk/sites/default/files/2026-05/Review%20of%20typical%20domestic%20consumption%20values%20decision.pdf
- Solar costs 2026: https://heatable.co.uk/solar/advice/solar-panel-costs and https://www.solarinfo.uk/solar-system-cost/4kw and https://greatbritishenergy.com/solar-panel-costs/
- Roof suitability checklist: https://www.sunsave.energy/solar-panels-advice/installation/roof-suitability and https://solar-and-heating.ovo.com/blog/is-my-home-suitable-for-solar-panels
- Orientation percentages and shading: https://www.renewableenergyhub.co.uk/blog/roof-suitability-solar-panels-uk
