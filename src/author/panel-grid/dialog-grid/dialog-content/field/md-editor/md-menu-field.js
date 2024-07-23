class Field {
    constructor(options) {
        this.options = options;
    }

    /**
    Read the field's value from its DOM node.
    */
    read(dom) { return dom.value; }

    /**
    A field-type-specific validation function.
    */
    validateType(value) { return null; }

    validate(value) {
        if (!value && this.options.required)
            return "Required field";
        return this.validateType(value) || (this.options.validate ? this.options.validate(value) : null);
    }

    clean(value) {
        return this.options.clean ? this.options.clean(value) : value;
    }
}

class TextField extends Field {
    render() {
        const input = document.createElement("input");
        input.placeholder = this.options.label;
        input.value = this.options.value || "";
        input.autocomplete = "off";
        input.type = "text";
        return input;
    }
}

export { TextField }
