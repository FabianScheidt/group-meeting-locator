class SettingsHandler {
    SETTINGS_WRAPPER = document.getElementById('settings');
    USE_COST_INPUT = document.getElementById('use-cost');

    getSettingsValue(selector) {
        return parseFloat(this.SETTINGS_WRAPPER.querySelector(selector).value);
    }

    getSettings() {
        return {
            calculateCost: this.USE_COST_INPUT.checked,
            costPerKilometer: this.getSettingsValue('#cost-per-km'),
            threshold1: this.getSettingsValue('#threshold1'),
            threshold1Cost: this.getSettingsValue('#cost1'),
            threshold2: this.getSettingsValue('#threshold2'),
            threshold2Cost: this.getSettingsValue('#cost2'),
        };
    }
}
