import LinearPart from './LinearPart.class';
import { LinearStock, LinearWaste } from './LinearStock.class';

export interface CutListOperationSimple {
    reps        : number,
    stock_length: number,
    parts       : Array<LinearPart>,
    waste       : LinearWaste
}

export class LinearCutListOperation {
    reps: number = 1;
    stock: LinearStock;

    constructor(stock) {
        this.stock = stock;
    }

    get remaining()    { return this.stock.remaining; }
    get waste()        { return this.stock.getWaste(); }
    get stock_length() { return this.stock.length; }

    /**
     * Determine if a given part fits into this operation or not.
     * @param part The part to check
     * @returns {boolean} True if part will fit, false if it will not.
     */
    partFits(part: LinearPart): boolean {
        return this.stock.partFits(part);
    }

    /**
     * Add the given part to the operation.
     * @param part The part to be added.
     * @returns {void}
     */
    addPart(part: LinearPart): void {
        this.stock.addPart(part);
    }

    /**
     * Outputs the bits and bobs we actually care about
     * @returns {CutListOperationSimple} Simplified output.
     */
    getSimple(): CutListOperationSimple {
        return {
            reps: this.reps,
            stock_length: this.stock_length,
            parts: this.stock.parts,
            waste: this.waste
        };
    }

    /**
     * Generate a string to use for match comparisons
     * @returns {string} The value to match with other operations
     */
    getMatchStr(): string {
        let str = [
            `SL:${this.stock_length}`,
            `WM:${this.waste.material}`,
            `WK:${this.waste.kerf}`
        ];

        for (let i = 0; i < this.stock.parts.length; i++) {
            str.push(`P${i}:${this.stock.parts[i].length}`);
        }

        return str.join('-');
    }
}

export default LinearCutListOperation;