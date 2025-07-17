const OPTION_TRANSLATIONS = {
    "Slow": {
        "da": "Langsom",
        "de": "Langsam",
        "fr": "Lent"
    },
    "Normal": {
        "da": "Normal",
        "de": "Normal",
        "fr": "Normal"
    },
    "Fast": {
        "da": "Hurtig",
        "de": "Schnell",
        "fr": "Rapide"
    },
    "Narrow": {
        "da": "Smal",
        "de": "Schmal",
        "fr": "Étroite"
    },
    "Wide": {
        "da": "Bred",
        "de": "Breit",
        "fr": "Large"
    },
    "Change pattern": {
        "da": "Skift mønster",
        "de": "Muster ändern",
        "fr": "Changer le motif"
    },
    "User defined": {
        "da": "Brugerdefineret",
        "de": "Benutzerdefiniert",
        "fr": "Défini par l'utilisateur"
    }
};

// Helper to get user's language from Home Assistant
function getUserLanguage(hass) {
    return (hass && hass.language) ? hass.language.split("-")[0] : "en";
}

class SunseekerZoneCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._zones = [];
        this._collapsed = {};
        this._hass = null;
        this._initialized = false
    }

    setConfig(config) {
        this._config = config;
        this._entity = config.entity;
        this._initialized = true
    }

    set hass(hass) {
        this._hass = hass;
        this._updateZones();
        this._render();
    }

    static getConfigElement() {
        return document.createElement("sunseeker-zone-card-editor");
    }

    _updateZones() {
        if (!this._hass || !this._entity) return;
        const stateObj = this._hass.states[this._entity];
        if (stateObj && stateObj.attributes.options) {
            this._zones = stateObj.attributes.options;
            // Initialize collapse state
            this._zones.forEach(zone => {
                if (!(zone in this._collapsed)) this._collapsed[zone] = true;
            });
        } else {
            this._zones = [];
        }
    }

    _toggleCollapse(zone) {
        this._collapsed[zone] = !this._collapsed[zone];
        this._render();
    }

    _handleSelectChange(event) {
        const entityId = event.target.getAttribute("data-entity");
        const value = event.target.value;
        if (this._hass && entityId) {
            this._hass.callService("select", "select_option", {
                entity_id: entityId,
                option: value,
            });
        }
    }

    _handleNumberChange(event) {
        const entityId = event.target.getAttribute("data-entity");
        const value = parseFloat(event.target.value);
        if (this._hass && entityId && !isNaN(value)) {
            this._hass.callService("number", "set_value", {
                entity_id: entityId,
                value: value,
            });
        }
    }

    _handleSwitchChange(event) {
        const entityId = event.target.getAttribute("data-entity");
        const turnOn = event.target.checked;
        if (this._hass && entityId) {
            this._hass.callService("switch", turnOn ? "turn_on" : "turn_off", {
                entity_id: entityId,
            });
        }
    }

    _render() {
        if (!this.shadowRoot) return;
        const hass = this._hass;
        const entity = this._entity;
        const zones = this._zones || [];
        const collapsed = this._collapsed;
        const header = (this._config && this._config.header) ? this._config.header : "Zones";

        // Entity picker for config mode (only select.*)
        let picker = "";
        if (this._config && this._config.editable) {
            picker = `
                <ha-entity-picker
                    .hass="${hass}"
                    .value="${entity || ""}"
                    .includeDomains=${JSON.stringify(["select"])}
                    @value-changed="${e => {
                    this._entity = e.detail.value;
                    this._updateZones();
                    this._render();
                }}"
                ></ha-entity-picker>
            `;
        }

        let content = `
            <style>
                :host {
                    --ha-card-bg: var(--card-background-color);
                    --ha-card-border: var(--divider-color);
                    --ha-card-header: var(--primary-color);
                    --ha-card-text: var(--primary-text-color);
                    --ha-card-subtle: var(--secondary-background-color, #222);
                    --ha-card-accent: var(--primary-color);
                    display: block;
                }
                .card-container {
                    border: 2px solid var(--ha-card-border);
                    border-radius: 12px;
                    background: var(--ha-card-bg);
                    box-shadow: 0 2px 6px rgba(25, 118, 210, 0.08);
                    max-width: 420px;
                    margin: 0 auto;
                    padding-bottom: 8px;
                    padding-top: 12px; /* Add top padding */
                    padding-left: 12px; /* Add left padding */
                    padding-right: 12px; /* Add right padding */
                }
                .card-header {
                    text-align: center;
                    font-size: 1.3em;
                    font-weight: bold;
                    margin-bottom: 16px;
                    color: var(--ha-card-text);
                }
                .zone-block {
                    border: 2px solid var(--ha-card-border);
                    border-radius: 12px;
                    margin-bottom: 18px;
                    background: var(--ha-card-bg);
                    box-shadow: 0 2px 6px rgba(25, 118, 210, 0.08);
                    max-width: 400px;
                    margin-left: auto;
                    margin-right: auto;
                    transition: box-shadow 0.2s;
                }
                .zone-header {
                    font-weight: bold;
                    padding: 12px 16px;
                    cursor: pointer;
                    user-select: none;
                    background: var(--ha-card-subtle);
                    border-radius: 12px 12px 0 0;
                    color: var(--ha-card-text);
                    font-size: 1.1em;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                .zone-header:hover {
                    background: var(--ha-card-accent);
                    color: var(--ha-card-bg);
                }
                .zone-entities {
                    padding: 10px 16px 12px 16px;
                    display: none;
                    background: var(--ha-card-bg);
                    border-radius: 0 0 12px 12px;
                }
                .zone-block.open .zone-entities {
                    display: block;
                }
                .entity-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 4px 0;
                    border-bottom: 1px solid var(--ha-card-border);
                    font-size: 1em;
                    color: var(--ha-card-text);
                }
                .entity-row:last-child {
                    border-bottom: none;
                }
                .entity-label {
                    text-align: left;
                    flex: 1;
                    padding-right: 12px;
                    color: var(--ha-card-text);
                }
                .entity-value {
                    text-align: right;
                    flex: 0 0 auto;
                    color: var(--ha-card-text);
                }
                select, input[type="number"] {
                    background: var(--ha-card-subtle);
                    color: var(--ha-card-text);
                    border: 1px solid var(--ha-card-border);
                    border-radius: 6px;
                    padding: 2px 6px;
                }
                input[type="checkbox"] {
                    accent-color: var(--ha-card-accent);
                }
                .no-entities {
                    color: var(--ha-card-text);
                    opacity: 0.6;
                    font-style: italic;
                    padding: 4px 0;
                }
            </style>
            <div class="card-container">
                <div class="card-header">${header}</div>
                ${picker}
                ${zones
                    .filter(zone => zone.toLowerCase() !== "global")
                    .map(zone => {
                        const zoneLc = zone.toLowerCase();
                        // Get the prefix from the selected entity's friendly_name
                        let prefix = null;
                        let debugLines = [];
                        if (entity && hass.states[entity]?.attributes?.friendly_name) {
                            const selectedFriendly = hass.states[entity].attributes.friendly_name.toLowerCase();
                            const zoneIndex = selectedFriendly.indexOf(zoneLc);
                            const lastSpaceIndex = selectedFriendly.lastIndexOf(" ");
                            //debugLines.push(`<div style="color: #1976d2; font-size: 0.95em;">zoneindex <b>${zoneIndex}</b>: <b>${lastSpaceIndex ?? "(none)"}</b></div>`);
                            if (lastSpaceIndex !== -1) {
                                prefix = selectedFriendly.substring(0, lastSpaceIndex);
                            } else if (zoneIndex !== -1) {
                                prefix = selectedFriendly.substring(0, zoneIndex).replace(/\s+$/, "");
                            }
                            //debugLines.push(`<div style="color: #1976d2; font-size: 0.95em;">Selected entity friendlyname for zone <b>${zone}</b>: <b>${selectedFriendly ?? "(none)"}</b></div>`);
                            //debugLines.push(`<div style="color: #1976d2; font-size: 0.95em;">Selected entity prefix for zone <b>${zone}</b>: <b>${prefix ?? "(none)"}</b></div>`);
                        }

                        // Filter entities by prefix before zone name in friendly_name
                        const matches = Object.values(hass.states).filter(e => {
                            const friendly = (e.attributes.friendly_name || e.entity_id).toLowerCase();
                            const zoneIndex = friendly.indexOf(zoneLc);
                            if (zoneIndex === -1 || !prefix) {
                                //debugLines.push(`<div style="color: #888; font-size: 0.9em;">Entity <b>${friendly}</b>: zone not found or no prefix</div>`);
                                return false;
                            }
                            // debugLines.push(`<div style="color: #888; font-size: 0.9em;">Entity <b>${friendly}</b>: prefix: ${prefix}</div>`);
                            if (friendly.includes(prefix)) {
                                return true
                            } else {
                                return false
                            }
                        });
                        return `
                            <div class="zone-block${collapsed[zone] ? "" : " open"}">
                                <div class="zone-header" onclick="this.getRootNode().host._toggleCollapse('${zone}')">
                                    <span>${zone}</span>
                                    <span>${collapsed[zone] ? "&#9654;" : "&#9660;"}</span>
                                </div>
                                <div class="zone-entities">
                                    ${debugLines.join("")}
                                    ${
                                        matches.length
                                            ? matches.map(e => {
                                                const friendly = e.attributes.friendly_name || e.entity_id;
                                                let afterZone = friendly;
                                                const zoneIndex = friendly.toLowerCase().indexOf(zoneLc);
                                                if (zoneIndex !== -1) {
                                                    afterZone = friendly.substring(zoneIndex + zone.length).trim();
                                                    afterZone = afterZone.replace(/^[-_:.,\s]+/, "");
                                                }
                                                const domain = e.entity_id.split(".")[0];
                                                if (domain === "select") {
                                                    const options = e.attributes.options || [];
                                                    const current = e.state;
                                                    const lang = getUserLanguage(hass);
                                                    return `
                                                        <div class="entity-row">
                                                            <span class="entity-label">${afterZone}:</span>
                                                            <span class="entity-value">
                                                                <select data-entity="${e.entity_id}" onchange="this.getRootNode().host._handleSelectChange(event)">
                                                                    ${options.map(opt => {
                                                                        const translated = OPTION_TRANSLATIONS[opt]?.[lang] || opt;
                                                                        return `<option value="${opt}"${opt === current ? " selected" : ""}>${translated}</option>`;
                                                                    }).join("")}
                                                                </select>
                                                            </span>
                                                        </div>
                                                    `;
                                                } else if (domain === "number") {
                                                    const min = e.attributes.min || 0;
                                                    const max = e.attributes.max || 100;
                                                    const step = e.attributes.step || 1;
                                                    const unit = e.attributes.unit_of_measurement ? ` ${e.attributes.unit_of_measurement}` : "";
                                                    return `
                                                        <div class="entity-row">
                                                            <span class="entity-label">${afterZone}:</span>
                                                            <span class="entity-value" style="display: flex; align-items: center; justify-content: flex-end;">
                                                                <input type="number" data-entity="${e.entity_id}" min="${min}" max="${max}" step="${step}" value="${e.state}" onchange="this.getRootNode().host._handleNumberChange(event)" style="text-align: right; width: 70px;" />
                                                                <span style="margin-left: 6px;">${unit}</span>
                                                            </span>
                                                        </div>
                                                    `;
                                                } else if (domain === "switch") {
                                                    const checked = e.state === "on" ? "checked" : "";
                                                    return `
                                                        <div class="entity-row">
                                                            <span class="entity-label">${afterZone}:</span>
                                                            <span class="entity-value">
                                                                <input type="checkbox" data-entity="${e.entity_id}" ${checked} onchange="this.getRootNode().host._handleSwitchChange(event)" />
                                                            </span>
                                                        </div>
                                                    `;
                                                } else {
                                                    // sensor and fallback
                                                    const unit = e.attributes.unit_of_measurement ? ` ${e.attributes.unit_of_measurement}` : "";
                                                    return `
                                                        <div class="entity-row">
                                                            <span class="entity-label">${afterZone}:</span>
                                                            <span class="entity-value">${e.state}${unit}</span>
                                                        </div>
                                                    `;
                                                }
                                            }).join("")
                                            : `<div class="no-entities">No matching entities</div>`
                                    }
                                </div>
                            </div>
                        `;
                    }).join("")}
            </div>
        `;
        this.shadowRoot.innerHTML = content;
    }
}

class SunseekerZoneCardEditor extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._initialized = false
    }

    setConfig(config) {
        this._config = config;
        this._entity = config.entity || "";
        this._header = config.header || "Zones";
        this._render();
        this._initialized = true;
    }

    set hass(hass) {
        this._hass = hass;
        if (this._initialized) {
            this._updateDom(); // Only update DOM, not full render
        }
    }

    _onEntityChanged(ev) {
        this._entity = ev.target.value;
        this._emitConfig();
    }

    _onHeaderChanged(ev) {
        const input = ev.target;
        const value = input.value;
        const selectionStart = input.selectionStart;
        const selectionEnd = input.selectionEnd;
        this._header = value;
        this._emitConfig();
        // Restore focus and cursor position after render
        requestAnimationFrame(() => {
            const inputEl = this.shadowRoot.getElementById("zone-header");
            if (inputEl) {
                inputEl.focus();
                inputEl.setSelectionRange(selectionStart, selectionEnd);
            }
        });
    }

    _emitConfig() {
        this.dispatchEvent(new CustomEvent("config-changed", {
            detail: {
                config: {
                    type: "custom:sunseeker-zone-card",
                    entity: this._entity || "",
                    header: this._header || "Zones",
                }
            }
        }));
    }

    _render() {
        if (!this.shadowRoot) return;
        const hass = this._hass;
        const entity = this._entity;
        const header = this._header;

        // Get all select entities for picker
        let selectEntities = [];
        if (hass) {
            selectEntities = Object.keys(hass.states).filter(eid => eid.startsWith("select."));
        }

        this.shadowRoot.innerHTML = `
            <style>
                .editor-container {
                    background: var(--card-background-color);
                    color: var(--primary-text-color);
                    border-radius: 12px;
                    box-shadow: 0 2px 6px rgba(25, 118, 210, 0.08);
                    padding: 24px 18px 18px 18px;
                    max-width: 420px;
                    margin: 0 auto;
                }
                .editor-title {
                    text-align: center;
                    font-size: 1.4em;
                    font-weight: bold;
                    margin-bottom: 18px;
                    color: var(--primary-color);
                }
                .editor-field {
                    margin-bottom: 18px;
                    display: flex;
                    flex-direction: column;
                }
                label {
                    font-weight: bold;
                    margin-bottom: 4px;
                    color: var(--primary-color);
                }
                select, input[type="text"] {
                    padding: 8px;
                    border-radius: 6px;
                    border: 1px solid var(--divider-color);
                    background: var(--secondary-background-color, #222);
                    color: var(--primary-text-color);
                    font-size: 1em;
                }
                select:focus, input[type="text"]:focus {
                    outline: 2px solid var(--primary-color);
                }
                .preview {
                    margin-top: 24px;
                    padding: 12px;
                    background: var(--secondary-background-color, #222);
                    border-radius: 8px;
                    color: var(--primary-text-color);
                    font-size: 1em;
                }
                .preview-label {
                    font-weight: bold;
                    color: var(--primary-color);
                }
            </style>
            <div class="editor-container">
                <div class="editor-title">Sunseeker Zone Card Editor</div>
                <div class="editor-field">
                    <label for="zone-entity">Zone entity</label>
                    <select id="zone-entity">
                        <option value="">Select entity...</option>
                        ${selectEntities.map(eid =>
                            `<option value="${eid}"${eid === entity ? " selected" : ""}>${hass.states[eid].attributes.friendly_name || eid}</option>`
                        ).join("")}
                    </select>
                </div>
                <div class="editor-field">
                    <label for="zone-header">Header</label>
                    <input type="text" id="zone-header" value="${header}" />
                </div>
                <div class="preview">
                    <span class="preview-label">Preview:</span><br>
                    <span>Header: <b>${header}</b></span><br>
                    <span>Entity: <b>${entity ? (hass?.states[entity]?.attributes?.friendly_name || entity) : "None selected"}</b></span>
                </div>
            </div>
        `;

        // Add event listeners for live editing
        this.shadowRoot.getElementById("zone-entity")?.addEventListener("change", this._onEntityChanged.bind(this));
        this.shadowRoot.getElementById("zone-header")?.addEventListener("input", this._onHeaderChanged.bind(this));
    }
}

// Register the editor for Home Assistant card config UI
if (!customElements.get("sunseeker-zone-card-editor")) {
    customElements.define("sunseeker-zone-card-editor", SunseekerZoneCardEditor);
}

SunseekerZoneCard.getConfigElement = function() {
    return document.createElement("sunseeker-zone-card-editor");
};

customElements.define("sunseeker-zone-card", SunseekerZoneCard);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "sunseeker-zone-card",
  name: "Sunseeker Zone Card",
  preview: false,
  description: "Custom card to control the mowers zone settings",
});
