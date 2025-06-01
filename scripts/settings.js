class SettingsHandler {
    SETTINGS_WRAPPER = document.getElementById('settings');

    getSettingsValue(selector) {
        return parseFloat(this.SETTINGS_WRAPPER.querySelector(selector).value);
    }

    getSettings() {
        return {
            costPerKilometer: this.getSettingsValue('#cost-per-km'),
            threshold1: this.getSettingsValue('#threshold1'),
            threshold1Cost: this.getSettingsValue('#cost1'),
            threshold2: this.getSettingsValue('#threshold2'),
            threshold2Cost: this.getSettingsValue('#cost2'),
        };
    }
}
