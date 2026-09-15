# sunseeker-zone-card

A custom Lovelace card for the [Sunseeker](https://www.home-assistant.io/integrations/sunseeker/) integration that provides a zone-by-zone view and editor for your robot mower's zone settings.

<img width="910" height="810" alt="image" src="https://github.com/user-attachments/assets/e78211f8-6a69-4fd0-a67d-90aabe5ffe41" />
---

## Features

- **Zone list** — automatically discovers all zones exposed by the Sunseeker integration and renders each one as a collapsible section.
- **Per-zone entity controls** — for every entity whose friendly name matches a zone, the card renders an appropriate inline control:
  - `select` entities → drop-down with translated option labels (EN / DA / DE / FR / FI / PL)
  - `number` entities → numeric input with min/max/step constraints and unit label
  - `switch` entities → checkbox toggle
  - All other entities → read-only state value with unit
- **View / Edit modes** — in view mode, controls reflect live state and changes are applied immediately. Switching to Edit mode buffers all changes locally and only applies them when you press *Save*, letting you adjust multiple settings at once before committing.
- **Optional zone on/off switch** — a top-level switch entity (e.g. to enable/disable all zones) can be displayed above the zone list with a configurable display name.
- **Collapsible zones** — each zone can be individually expanded or collapsed; the entire card can also be collapsed by clicking the header.
- **`collapsedCard` default** — the card can be configured to start collapsed, useful when you want it out of the way on a busy dashboard.
- **Gen2 zigzag support** — when `robot_generation` is set to `gen2`, the card automatically shows or hides zigzag angle/active slot entities based on the zone's cutting pattern setting. If the cutting pattern is not *Zigzag*, the zigzag slot controls are hidden to keep the zone view clean. The visibility updates immediately when you change the cutting pattern in Edit mode.
- **Localised UI** — Edit / Save / Cancel button labels and select-option labels are translated for English, Danish, German, French, Finnish, and Polish, matching the user's Home Assistant language setting.
- **Visual editor** — full support for the Lovelace UI editor; no YAML required.

---

## Supported languages

The card automatically picks the language from your Home Assistant profile. UI labels (Edit / Save / Cancel) and select-option values are translated for the following languages:

| Code | Language |
|------|----------|
| `en` | English |
| `da` | Danish |
| `de` | German |
| `fr` | French |
| `fi` | Finnish |
| `pl` | Polish |

Any other language falls back to English.

---

## Requirements

- Home Assistant with the **Sunseeker** integration configured.
- A `select` entity whose `options` attribute lists the zone names (e.g. `select.sunseeker_zone`).
- Zone-specific entities whose friendly names contain both the device prefix and the zone name, so the card can group them automatically.

---

## Installation

### HACS (recommended)

1. Open HACS in your Home Assistant instance.
2. Go to **Frontend** and click **+ Explore & download repositories**.
3. Search for **sunseeker-zone-card** and select it.
4. Click **Download** and confirm.
5. Reload your browser.

### Manual

1. Copy `sunseeker-zone-card.js` into your `/config/www/sunseeker-zone-card/` directory (or any subfolder of `www/`).
2. Add the resource in **Settings → Dashboards → Resources**:
   - URL: `/local/sunseeker-zone-card/sunseeker-zone-card.js`
   - Resource type: **JavaScript module**
3. Reload your browser or the Lovelace resources.

---

## Configuration

| Key | Type | Default | Description |
|---|---|---|---|
| `entity` | `string` | **required** | Entity ID of the Sunseeker zone select entity (e.g. `select.sunseeker_zone`). |
| `header` | `string` | `"Zones"` | Card header title. |
| `switch_entity` | `string` | — | Optional entity ID of a switch to show at the top of the card (e.g. a zone-enable toggle). |
| `switch_name` | `string` | friendly name | Display label for the optional switch. Falls back to the entity's friendly name. |
| `collapsedCard` | `boolean` | `false` | Start the card in a collapsed state. |
| `robot_generation` | `string` | `"gen1"` | Set to `"gen2"` for Gen2 mowers. Enables zigzag slot show/hide logic and hides legacy *cutting angle* entities that are not used by Gen2 devices. |

### Minimal YAML example

```yaml
type: custom:sunseeker-zone-card
entity: select.sunseeker_zone
```

### Full YAML example

```yaml
type: custom:sunseeker-zone-card
entity: select.sunseeker_zone
header: Mowing Zones
switch_entity: switch.sunseeker_zones_enabled
switch_name: Zones enabled
collapsedCard: false
robot_generation: gen2
```

---

## Version history

| Version | Notes |
|---|---|
| 1.0.6 | Initial release |
| 1.0.7 | Gen2 support: entity filtering, zigzag sort order, cutting angle hiding |
| 1.0.8 | Gen2 zigzag show/hide by cutting pattern; edit-mode reactivity; multi-mower device scoping; Finnish and Polish translations |
| 1.0.9 | Gen2 zigzag not allways shown |

