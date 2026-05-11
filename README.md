# sunseeker-zone-card

A custom Lovelace card for the [Sunseeker](https://www.home-assistant.io/integrations/sunseeker/) integration that provides a zone-by-zone view and editor for your robot mower's zone settings.

<img width="907" height="728" alt="image" src="https://github.com/user-attachments/assets/62f3cdc7-2cc9-4d4f-80ec-d49c00af9554" />

---

## Features

- **Zone list** — automatically discovers all zones exposed by the Sunseeker integration and renders each one as a collapsible section.
- **Per-zone entity controls** — for every entity whose friendly name matches a zone, the card renders an appropriate inline control:
  - `select` entities → drop-down with translated option labels (EN / DA / DE / FR)
  - `number` entities → numeric input with min/max/step constraints and unit label
  - `switch` entities → checkbox toggle
  - All other entities → read-only state value with unit
- **View / Edit modes** — in view mode, controls reflect live state and changes are applied immediately. Switching to Edit mode buffers all changes locally and only applies them when you press *Save*, letting you adjust multiple settings at once before committing.
- **Optional zone on/off switch** — a top-level switch entity (e.g. to enable/disable all zones) can be displayed above the zone list with a configurable display name.
- **Collapsible zones** — each zone can be individually expanded or collapsed; the entire card can also be collapsed by clicking the header.
- **`collapsedCard` default** — the card can be configured to start collapsed, useful when you want it out of the way on a busy dashboard.
- **Localised UI** — Edit / Save / Cancel button labels and select-option labels are translated for English, Danish, German, and French, matching the user's Home Assistant language setting.
- **Visual editor** — full support for the Lovelace UI editor; no YAML required.

---

## Requirements

- Home Assistant with the **Sunseeker** integration configured.
- A `select` entity whose `options` attribute lists the zone names (e.g. `select.sunseeker_zone`).
- Zone-specific entities whose friendly names contain both the device prefix and the zone name, so the card can group them automatically.

---

## Installation

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
```

---

## Version history

| Version | Notes |
|---|---|
| 1.0.6 | Current release |
