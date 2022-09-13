import LinearPart from './LinearPart.class';

export interface LinearWaste {
    material: number,
    kerf    : number
}

const sortBy = (key: string, direction: string = 'desc') => {
    let sortAval = (direction === 'desc') ? -1 : 1;
    let sortBval = (direction === 'desc') ? 1 : -1;
    return (a, b) => (a[key] > b[key]) ? sortAval : ((b[key] > a[key]) ? sortBval : 0);
};

export class LinearStock extends LinearPart {
    kerf      : number            = 0;
    parts     : Array<LinearPart> = [];
    remaining?: number;

    constructor(opts) {
        super(opts);

        this.kerf      = opts?.kerf;
        this.remaining = opts.length;

        if (Array.isArray(opts.parts)) {
            opts.parts.forEach(part => this.addPart(part));
        }
    }

    /**
     * This essentially copies this LinearStock item without carrying over the cuts/wastes.
     * @returns Duplicate Stock object, without the cuts.
     */
    duplicate(): LinearStock {
        const newStock = new LinearStock({
            length: this.length,
            label : this.label,
            kerf  : this.kerf
        });

        return newStock;
    }

    /**
     * Reporting on the amount of wasted material
     * @returns {LinearWaste} Wasted material, and amount wasted due to kerf.
     */
    getWaste(): LinearWaste {
        return {
            material: this.getLengthRemaining(),    // total amount of wood remaining
            kerf    : this.kerf * this.parts.length // how much of waste was due to kerf
        };
    }

    /**
     * Calculate the amount of material that can be utilized from this stock.
     * @returns {number} The amount of material remaining.
     */
    getLengthRemaining(): number {
        // If there are no parts, do no math, just return the length of the stock.
        if (this.parts.length === 0) return this.length;

        // Count up the amount of material used by the parts currently.
        const usedMaterial: number = this.parts.reduce((accum, part) => {
            accum += part.length + this.kerf;
            return accum;
        }, 0);

        // Return the original length, less the material used
        return this.length - usedMaterial;
    }

    /**
     * Determine if a given part fits into this Stock item or not.
     * @param part The part to check
     * @returns {boolean} True if part will fit, false if it will not.
     */
    partFits(part: LinearPart): boolean {
        return (part.length <= this.getLengthRemaining());
    }

    /**
     * Add the given part to the list of parts, update length remaining.
     * @param part The part to be added.
     * @returns {void}
     */
    addPart(part: LinearPart): void {
        // Check if there's room to add this part first.
        if (!this.partFits(part)) throw new Error(`Part does not fit into stock item!`);

        // If there is room, we can add the part
        this.parts.push(part);

        // Sort parts in descending order
        this.parts.sort(sortBy('length', 'desc'));

        // Update the amount of remaining material
        this.remaining = this.getLengthRemaining();
    }
}

export default LinearStock;