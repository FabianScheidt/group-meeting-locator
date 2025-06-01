class InputsHandler {
    INPUTS_WRAPPER = document.getElementById('inputs');
    ADD_INPUT_BUTTON = document.getElementById('add-input-button');
    personCount = 0;

    getInputs() {
        return Array.from(this.INPUTS_WRAPPER.querySelectorAll('input[type=text]'));
    }

    getValues() {
        return this.getInputs().map((input) => input.value.trim());
    }

    addInput(value = '') {
        const div = document.createElement('div');
        div.className = 'person-input';
        div.innerHTML = `
            <div class="top-row">
                <input type="text" placeholder="Location" id="person-${this.personCount}" value="${value}" />
                <button>X</button>
            </div>
            <div class="distance" id="distance-${this.personCount}">Distance: –</div>
            <div class="error-message" id="error-${this.personCount}"></div>
        `;
        const el = this.INPUTS_WRAPPER.appendChild(div);
        el.getElementsByTagName('input')[0].addEventListener('change', () => this.saveInputsToLocalStorage());
        el.getElementsByTagName('button')[0].addEventListener('click', () => {
            el.remove();
            this.saveInputsToLocalStorage();
        });
        this.personCount++;
    }

    loadInputsFromLocalStorage() {
        const saved = JSON.parse(localStorage.getItem('locations') || '[]');
        saved.forEach((value) => this.addInput(value));
    }

    saveInputsToLocalStorage() {
        const values = this.getValues();
        localStorage.setItem('locations', JSON.stringify(values));
    }

    initialize() {
        this.loadInputsFromLocalStorage();
        if (this.getInputs().length === 0) {
            this.addInput('');
        }
        this.ADD_INPUT_BUTTON.addEventListener('click', () => this.addInput());
    }

    setDistanceStr(idx, distanceStr) {
        this.INPUTS_WRAPPER.querySelectorAll('.distance')[idx].textContent = distanceStr;
    }

    setErrorStr(idx, distanceStr) {
        this.INPUTS_WRAPPER.querySelectorAll('.error-message')[idx].textContent = distanceStr;
    }
}
