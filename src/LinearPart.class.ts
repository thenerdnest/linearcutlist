export class LinearPart {
    length: number      = 0;
    label?: string|null = null;

    constructor(opts) {
        this.length = opts.length;
        this.label  = opts?.label
    }
}

export default LinearPart;