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

const BUTTON_TRANSLATIONS = {
    "Submit": {
        "da": "Gem",
        "de": "Speichern",
        "fr": "Enregistrer"
    },
    "Cancel": {
        "da": "Annuller",
        "de": "Abbrechen",
        "fr": "Annuler"
    },
    "Edit": {
        "da": "Rediger",
        "de": "Bearbeiten",
        "fr": "Modifier"
    }
};

function getButtonLabel(key, hass) {
    const lang = getUserLanguage(hass);
    return BUTTON_TRANSLATIONS[key]?.[lang] || key;
}

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
        this._lzones = 0;
        this._editMode = false;
        this._localState = {};
    }

    setConfig(config) {
        this._config = config;
        this._entity = config.entity;
        this._editMode = false;
        this._collapsedCard = config.collapsedCard ?? false;
        this._render();
    }

    set hass(hass) {
        this._hass = hass;
        this._updateZones();
        if (!this._editMode) {
            if (this._lzones != this._zones.length) {
                this._render();
            } else {
                this._updateDom();
            }
            this._lzones = this._zones.length;
        }
    }

    _updateDom() {
        if (!this.shadowRoot || !this._hass || !this._zones || this._editMode) return;

        // --- Update the switch entity state ---
        const switchEntityId = this._config?.switch_entity;
        if (switchEntityId) {
            const switchObj = this._hass.states[switchEntityId];
            const switchInput = this.shadowRoot.querySelector(`input[type="checkbox"][data-entity="${switchEntityId}"]`);
            if (switchObj && switchInput) {
                switchInput.checked = switchObj.state === "on";
            }
        }

        this._zones.forEach(zone => {
            const zoneLc = zone.toLowerCase();
            const zoneBlock = this.shadowRoot.querySelector(`.zone-block[data-zone="${zoneLc}"]`);
            if (!zoneBlock) return;

            zoneBlock.querySelectorAll(".entity-row").forEach(row => {
                const entityId = row.querySelector("[data-entity]")?.getAttribute("data-entity");
                if (!entityId) return;
                const stateObj = this._hass.states[entityId];
                if (!stateObj) return;

                const selectEl = row.querySelector("select[data-entity]");
                if (selectEl) {
                    selectEl.value = stateObj.state;
                }

                const numberEl = row.querySelector("input[type='number'][data-entity]");
                if (numberEl) {
                    numberEl.value = stateObj.state;
                }

                const switchEl = row.querySelector("input[type='checkbox'][data-entity]");
                if (switchEl) {
                    switchEl.checked = stateObj.state === "on";
                }

                const valueEl = row.querySelector(".entity-value");
                if (valueEl && !selectEl && !numberEl && !switchEl) {
                    const unit = stateObj.attributes.unit_of_measurement ? ` ${stateObj.attributes.unit_of_measurement}` : "";
                    valueEl.textContent = `${stateObj.state}${unit}`;
                }
            });
        });
    }

    _updateZones() {
        if (!this._hass || !this._entity) return;
        const stateObj = this._hass.states[this._entity];
        if (stateObj && stateObj.attributes.options) {
            this._zones = stateObj.attributes.options;
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
        if (this._editMode) {
            const entityId = event.target.getAttribute("data-entity");
            const value = event.target.value;
            this._localState[entityId] = value;
        } else {
            const entityId = event.target.getAttribute("data-entity");
            const value = event.target.value;
            if (this._hass && entityId) {
                this._hass.callService("select", "select_option", {
                    entity_id: entityId,
                    option: value,
                });
            }
        }
    }

    _handleNumberChange(event) {
        if (this._editMode) {
            const entityId = event.target.getAttribute("data-entity");
            const value = parseFloat(event.target.value);
            this._localState[entityId] = value;
        } else {
            const entityId = event.target.getAttribute("data-entity");
            const value = parseFloat(event.target.value);
            if (this._hass && entityId && !isNaN(value)) {
                this._hass.callService("number", "set_value", {
                    entity_id: entityId,
                    value: value,
                });
            }
        }
    }

    _handleSwitchChange(event) {
        if (this._editMode) {
            const entityId = event.target.getAttribute("data-entity");
            const turnOn = event.target.checked;
            this._localState[entityId] = turnOn ? "on" : "off";
        } else {
            const entityId = event.target.getAttribute("data-entity");
            const turnOn = event.target.checked;
            if (this._hass && entityId) {
                this._hass.callService("switch", turnOn ? "turn_on" : "turn_off", {
                    entity_id: entityId,
                });
            }
        }
    }

    _enterEditMode() {
        this._editMode = true;
        this._localState = {};
        this._render();
    }

    _cancelEdit() {
        this._editMode = false;
        this._localState = {};
        this._render();
    }

    _submitEdit() {
        // Apply all changes in _localState
        Object.entries(this._localState).forEach(([entityId, value]) => {
            const domain = entityId.split(".")[0];
            if (domain === "select") {
                this._hass.callService("select", "select_option", {
                    entity_id: entityId,
                    option: value,
                });
            } else if (domain === "number") {
                this._hass.callService("number", "set_value", {
                    entity_id: entityId,
                    value: value,
                });
            } else if (domain === "switch") {
                this._hass.callService("switch", value === "on" ? "turn_on" : "turn_off", {
                    entity_id: entityId,
                });
            }
        });
        this._editMode = false;
        this._localState = {};
        this._render();
    }

    _toggleCardCollapse() {
        this._collapsedCard = !this._collapsedCard;
        this._render();
    }

    _render() {
        if (!this.shadowRoot) return;
        const hass = this._hass;
        const entity = this._entity;
        const zones = this._zones || [];
        const collapsed = this._collapsed;
        const header = (this._config && this._config.header) ? this._config.header : "Zones";
        const readonly = !this._editMode ? "disabled" : "";

        const switchEntityId = this._config?.switch_entity;
        const switchObj = hass?.states?.[switchEntityId];
        let switchHtml = "";
        if (switchObj) {
            const checked = this._editMode
                ? (this._localState[switchEntityId] === undefined
                    ? switchObj.state === "on"
                    : this._localState[switchEntityId] === "on")
                : switchObj.state === "on";
            const friendly = this._config?.switch_name || switchObj.attributes.friendly_name || switchEntityId;
            switchHtml = `
            <div class="switch-row" style="display:${this._collapsedCard ? "none" : "flex"}; align-items: center; justify-content: center; margin-bottom: 16px;">
                <label style="margin-right: 12px;">${friendly}</label>
                <input type="checkbox" data-entity="${switchEntityId}" ${checked ? "checked" : ""} ${readonly} onchange="this.getRootNode().host._handleSwitchChange(event)" />
            </div>
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
                margin: 0 auto;
                padding-bottom: 8px;
                padding-top: 12px;
                padding-left: 12px;
                padding-right: 12px;
            }
            .card-header {
                text-align: center;
                font-size: 1.3em;
                font-weight: bold;
                margin-bottom: 16px;
                color: var(--ha-card-text);
                cursor: pointer;
                user-select: none;
            }
            .card-header:hover {
                background: var(--ha-card-accent);
                color: var(--ha-card-bg);
            }
            .card-collapsed .zone-block,
            .card-collapsed .switch-row,
            .card-collapsed .edit-row {
                display: none !important;
            }
            .zone-block {
                border: 2px solid var(--ha-card-border);
                border-radius: 12px;
                margin-bottom: 18px;
                background: var(--ha-card-bg);
                box-shadow: 0 2px 6px rgba(25, 118, 210, 0.08);
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
        <div class="card-container${this._collapsedCard ? ' card-collapsed' : ''}">
            <div class="card-header" ${header ? `onclick="this.getRootNode().host._toggleCardCollapse()"` : ""}>
                ${header}
                <span style="margin-left:8px;">${this._collapsedCard ? "&#9654;" : "&#9660;"}</span>
            </div>
            ${switchHtml}
            ${zones
                .filter(zone => zone.toLowerCase() !== "global")
                .map(zone => {
                    const zoneLc = zone.toLowerCase();
                    let prefix = null;
                    let debugLines = [];
                    if (entity && hass.states[entity]?.attributes?.friendly_name) {
                        const selectedFriendly = hass.states[entity].attributes.friendly_name.toLowerCase();
                        const zoneIndex = selectedFriendly.indexOf(zoneLc);
                        const lastSpaceIndex = selectedFriendly.lastIndexOf(" ");
                        if (lastSpaceIndex !== -1) {
                            prefix = selectedFriendly.substring(0, lastSpaceIndex);
                        } else if (zoneIndex !== -1) {
                            prefix = selectedFriendly.substring(0, zoneIndex).replace(/\s+$/, "");
                        }
                    }

                    const matches = Object.values(hass.states).filter(e => {
                        const friendly = (e.attributes.friendly_name || e.entity_id).toLowerCase();
                        const zoneIndex = friendly.indexOf(zoneLc);
                        if (zoneIndex === -1 || !prefix) {
                            return false;
                        }
                        if (friendly.includes(prefix)) {
                            return true;
                        } else {
                            return false;
                        }
                    });
                    return `
                        <div class="zone-block${collapsed[zone] ? "" : " open"}" data-zone="${zoneLc}">
                            <div class="zone-header" onclick="this.getRootNode().host._toggleCollapse('${zone}')">
                                <span>${zone}</span>
                                <span>${collapsed[zone] ? "&#9654;" : "&#9660;"}</span>
                            </div>
                            <div class="zone-entities">
                                ${debugLines.join("")}
                                ${matches.length
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
                                    const current = this._editMode
                                        ? (this._localState[e.entity_id] === undefined
                                            ? e.state
                                            : this._localState[e.entity_id])
                                        : e.state;
                                    const lang = getUserLanguage(hass);
                                    return `
                                                    <div class="entity-row">
                                                        <span class="entity-label">${afterZone}:</span>
                                                        <span class="entity-value">
                                                            <select data-entity="${e.entity_id}" ${readonly} onchange="this.getRootNode().host._handleSelectChange(event)">
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
                                    const value = this._editMode
                                        ? (this._localState[e.entity_id] === undefined
                                            ? e.state
                                            : this._localState[e.entity_id])
                                        : e.state;
                                    return `
                                                    <div class="entity-row">
                                                        <span class="entity-label">${afterZone}:</span>
                                                        <span class="entity-value" style="display: flex; align-items: center; justify-content: flex-end;">
                                                            <input type="number" data-entity="${e.entity_id}" min="${min}" max="${max}" step="${step}" value="${value}" ${readonly} onchange="this.getRootNode().host._handleNumberChange(event)" style="text-align: right; width: 70px;" />
                                                            <span style="margin-left: 6px;">${unit}</span>
                                                        </span>
                                                    </div>
                                                `;
                                } else if (domain === "switch") {
                                    const checked = this._editMode
                                        ? (this._localState[e.entity_id] === undefined
                                            ? e.state === "on"
                                            : this._localState[e.entity_id] === "on")
                                        : e.state === "on";
                                    return `
                                                    <div class="entity-row">
                                                        <span class="entity-label">${afterZone}:</span>
                                                        <span class="entity-value">
                                                            <input type="checkbox" data-entity="${e.entity_id}" ${checked ? "checked" : ""} ${readonly} onchange="this.getRootNode().host._handleSwitchChange(event)" />
                                                        </span>
                                                    </div>
                                                `;
                                } else {
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
            <div class="edit-row" style="text-align: center; margin-top: 18px;${this._collapsedCard ? " display:none;" : ""}">
                ${this._editMode
                ? `
                            <button style="margin-right: 8px;" onclick="this.getRootNode().host._submitEdit()">${getButtonLabel("Submit", hass)}</button>
                            <button onclick="this.getRootNode().host._cancelEdit()">${getButtonLabel("Cancel", hass)}</button>
                          `
                : `<button onclick="this.getRootNode().host._enterEditMode()">${getButtonLabel("Edit", hass)}</button>`
            }
            </div>
        </div>
    `;
        this.shadowRoot.innerHTML = content;
    }
}

class SunseekerZoneCardEditor extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._initialized = false;
    }

    setConfig(config) {
        this._config = config;
        this._entity = config.entity || "";
        this._header = config.header || "Zones";
        this._switch_entity = config.switch_entity || "";
        this._switch_name = config.switch_name || "";
        this._collapsedCard = config.collapsedCard ?? false;
        this._render();
        this._initialized = true;
    }

    set hass(hass) {
        this._hass = hass;
        if (this._initialized) {
            this._updateDom();
        }
    }

    _updateDom() {
        if (!this.shadowRoot) return;
        const entity = this._entity;
        const header = this._header;
        const switch_entity = this._switch_entity;
        const switch_name = this._switch_name;
        const collapsedCard = this._collapsedCard;
        const hass = this._hass;

        const previewEl = this.shadowRoot.querySelector(".preview");
        if (previewEl) {
            previewEl.innerHTML = `
                <span class="preview-label">Preview:</span><br>
                <span>Header: <b>${header}</b></span><br>
                <span>Zone entity: <b>${entity ? (hass?.states[entity]?.attributes?.friendly_name || entity) : "None selected"}</b></span><br>
                <span>Zone on/off Switch entity: <b>${switch_entity ? (hass?.states[switch_entity]?.attributes?.friendly_name || switch_entity) : "None selected"}</b></span><br>
                <span>Switch display name: <b>${switch_name || "(default)"}</b></span><br>
                <span>Show collapsed: <b>${collapsedCard ? "Yes" : "No"}</b></span>
            `;
        }

        // Update entity pickers if needed
        const selectEl = this.shadowRoot.getElementById("zone-entity");
        if (selectEl && hass) {
            const selectEntities = Object.keys(hass.states).filter(eid => eid.startsWith("select."));
            if (selectEl.options.length - 1 !== selectEntities.length) {
                selectEl.innerHTML = `
                    <option value="">Select entity...</option>
                    ${selectEntities.map(eid =>
                        `<option value="${eid}"${eid === entity ? " selected" : ""}>${hass.states[eid].attributes.friendly_name || eid}</option>`
                    ).join("")}
                `;
            }
        }
        const switchEl = this.shadowRoot.getElementById("switch-entity");
        if (switchEl && hass) {
            const switchEntities = Object.keys(hass.states).filter(eid => eid.startsWith("switch."));
            if (switchEl.options.length - 1 !== switchEntities.length) {
                switchEl.innerHTML = `
                    <option value="">Select switch...</option>
                    ${switchEntities.map(eid =>
                        `<option value="${eid}"${eid === switch_entity ? " selected" : ""}>${hass.states[eid].attributes.friendly_name || eid}</option>`
                    ).join("")}
                `;
            }
        }
        // Update switch name input
        const switchNameInput = this.shadowRoot.getElementById("switch-name");
        if (switchNameInput && switchNameInput.value !== switch_name) {
            switchNameInput.value = switch_name;
        }
        // Update collapsed checkbox
        const collapsedCheckbox = this.shadowRoot.getElementById("collapsed-card");
        if (collapsedCheckbox) {
            collapsedCheckbox.checked = collapsedCard;
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
        requestAnimationFrame(() => {
            const inputEl = this.shadowRoot.getElementById("zone-header");
            if (inputEl) {
                inputEl.focus();
                inputEl.setSelectionRange(selectionStart, selectionEnd);
            }
        });
    }

    _onSwitchChanged(ev) {
        this._switch_entity = ev.target.value;
        this._emitConfig();
    }

    _onSwitchNameChanged(ev) {
        const input = ev.target;
        const value = input.value;
        const selectionStart = input.selectionStart;
        const selectionEnd = input.selectionEnd;
        this._switch_name = value;
        this._emitConfig();
        requestAnimationFrame(() => {
            const inputEl = this.shadowRoot.getElementById("switch-name");
            if (inputEl) {
                inputEl.focus();
                inputEl.setSelectionRange(selectionStart, selectionEnd);
            }
        });
    }

    _onCollapsedChanged(ev) {
        this._collapsedCard = ev.target.checked;
        this._emitConfig();
    }

    _emitConfig() {
        this.dispatchEvent(new CustomEvent("config-changed", {
            detail: {
                config: {
                    type: "custom:sunseeker-zone-card",
                    entity: this._entity || "",
                    header: this._header || "Zones",
                    switch_entity: this._switch_entity || "",
                    switch_name: this._switch_name || "",
                    collapsedCard: this._collapsedCard || false,
                }
            }
        }));
    }

    _render() {
        if (!this.shadowRoot) return;
        const hass = this._hass;
        const entity = this._entity;
        const header = this._header;
        const switch_entity = this._switch_entity;
        const switch_name = this._switch_name;
        const collapsedCard = this._collapsedCard;

        // Get all select and switch entities for pickers
        let selectEntities = [];
        let switchEntities = [];
        if (hass) {
            selectEntities = Object.keys(hass.states).filter(eid => eid.startsWith("select."));
            switchEntities = Object.keys(hass.states).filter(eid => eid.startsWith("switch."));
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
                .checkbox-row {
                    display: flex;
                    align-items: center;
                    margin-bottom: 18px;
                }
                .checkbox-row label {
                    margin-left: 8px;
                    font-weight: normal;
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
                    <label for="switch-entity">Zone on/off Switch entity</label>
                    <select id="switch-entity">
                        <option value="">Select switch...</option>
                        ${switchEntities.map(eid =>
                            `<option value="${eid}"${eid === switch_entity ? " selected" : ""}>${hass.states[eid].attributes.friendly_name || eid}</option>`
                        ).join("")}
                    </select>
                </div>
                <div class="editor-field">
                    <label for="switch-name">Switch display name</label>
                    <input type="text" id="switch-name" value="${switch_name || ""}" />
                </div>
                <div class="editor-field">
                    <label for="zone-header">Header</label>
                    <input type="text" id="zone-header" value="${header}" />
                </div>
                <div class="checkbox-row">
                    <input type="checkbox" id="collapsed-card" ${collapsedCard ? "checked" : ""} />
                    <label for="collapsed-card">Show collapsed</label>
                </div>
                <div class="preview">
                    <span class="preview-label">Preview:</span><br>
                    <span>Header: <b>${header}</b></span><br>
                    <span>Zone entity: <b>${entity ? (hass?.states[entity]?.attributes?.friendly_name || entity) : "None selected"}</b></span><br>
                    <span>Zone on/off Switch entity: <b>${switch_entity ? (hass?.states[switch_entity]?.attributes?.friendly_name || switch_entity) : "None selected"}</b></span><br>
                    <span>Switch display name: <b>${switch_name || "(default)"}</b></span><br>
                    <span>Show collapsed: <b>${collapsedCard ? "Yes" : "No"}</b></span>
                </div>
                <div class="editor-field">
                    <label for="zone-header">Header</label>
                    <input type="text" id="zone-header" value="${header}" />
                </div>
                <div class="version">version: 1.0.4</div>
            </div>
        `;

        // Add event listeners for live editing
        this.shadowRoot.getElementById("zone-entity")?.addEventListener("change", this._onEntityChanged.bind(this));
        this.shadowRoot.getElementById("switch-entity")?.addEventListener("change", this._onSwitchChanged.bind(this));
        this.shadowRoot.getElementById("switch-name")?.addEventListener("input", this._onSwitchNameChanged.bind(this));
        this.shadowRoot.getElementById("zone-header")?.addEventListener("input", this._onHeaderChanged.bind(this));
        this.shadowRoot.getElementById("collapsed-card")?.addEventListener("change", this._onCollapsedChanged.bind(this));
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
