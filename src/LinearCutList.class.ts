import LinearPart from './LinearPart.class';
import LinearStock from './LinearStock.class';
import { LinearCutListOperation, CutListOperationSimple } from './LinearCutListOperation.class';
import { response } from 'express';

export interface CutList {
    total_parts     : number,
    total_operations: number,
    cuts            : Array<CutListOperationSimple>,
    yield           : number
}

export interface CutListInputLinearStock {
    length         : number,
    label?         : string,
    quantity?      : number|null,
    remainingStock?: number
}

export interface CutListInputLinearPart extends LinearPart {
    quantity?: number // defaults to 1 if not specified
}

export interface CutListInput {
    kerf : number,
    stock: Array<CutListInputLinearStock>,
    parts: Array<CutListInputLinearPart>
}

export class LinearCutList {
    input: CutListInput;
    stock: Array<LinearStock> = [];
    parts: Array<LinearPart>  = [];

    constructor(input: CutListInput) {
        this.input = input; // store for later use...

        // Add the linear stock available
        for (const stock of this.input.stock) {
            this.stock.push(new LinearStock({ ...stock, kerf: this.input.kerf }));
            stock.remainingStock = (!stock.quantity) ? -1 : 0;
        }

        // Add the parts needed.
        for (const part of this.input.parts) {
            const quantity = part.quantity || 1;
            for (let i = 0; i < quantity; i++) {
                this.parts.push(new LinearPart({
                    length: part.length,
                    label : part.label
                }));
            }
        }

        const sortBy = (key: string, direction: string = 'desc') => {
            let sortAval = (direction === 'desc') ? -1 : 1;
            let sortBval = (direction === 'desc') ? 1 : -1;
            return (a, b) => (a[key] > b[key]) ? sortAval : ((b[key] > a[key]) ? sortBval : 0);
        };

        // sort stock by length ASC
        this.stock.sort(sortBy('length', 'asc'));

        // sort parts by length DESC
        this.parts.sort(sortBy('length', 'desc'));
    }

    /**
     * Locate and return the most appropriate stock item to cut the given part from.
     */
    pullStock(part: LinearPart): LinearStock {
        // find first available stock item that the part fits into.
        const stockItem = this.stock.find(stock => stock.partFits(part));

        if (stockItem) return stockItem;

        // If stock item was not found... see if we can add stock as needed (unlimited)
        let newStock = null;
        for (const stock of this.input.stock) {
            if (stock.length < part.length) continue; // skip, too short!

            // Remaining stock less than 0 means unlimited
            // Remaining stock above 0 means stock is available to use
            // So remainingStock === 0 would be the scenario where we throw Out of stock!
            if (stock.remainingStock < 0 || stock.remainingStock > 0) {
                newStock = new LinearStock({ ...stock, kerf: this.input.kerf });
                stock.remainingStock--;
            }
        }

        // If we haven't found stock yet, then we don't have stock available!
        if (!newStock) throw new Error('Out of stock!');

        return newStock;
    }

    getCuts(): Array<CutListOperationSimple> {
        const partsLeft = this.parts.concat(); // clone of this.parts

        const operations: Array<LinearCutListOperation> = [];
        let op: LinearCutListOperation;

        while (partsLeft.length) {
            const part = partsLeft.shift();

            // Attempt to find operation with enough remaining for this part.
            const operation = operations.find(o => o.partFits(part));

            // if we have an operation already in progress that the part fits in, use that.
            if (operation) {
                operation.addPart(part);
                continue; // proceed to the next part
            }

            // Beyond this point, we know a new operation is needed!

            // Attempt to pull a new stock item
            const stock = this.pullStock(part); // throws if Out of Stock!
            const newOperation = new LinearCutListOperation(stock);
            newOperation.addPart(part);
            operations.push(newOperation);
        }

        // Reduce the operations by finding matches and incrementing reps
        const opsMap = new Map();

        for (const op of operations) {
            const matchStr = op.getMatchStr();
            if (!opsMap.has(matchStr)) {     // If it doesn't have the match string, add it
                opsMap.set(matchStr, op);
            } else {                         // Otherwise load it and increment the reps.
                opsMap.get(matchStr).reps++;
            }
        }

        return Array.from(opsMap.values()).map(o => o.getSimple());

        // return operations.map(o => o.getSimple());

        // return [
        //     {
        //         reps: 2,
        //         stock_length: 96,
        //         parts: [
        //             { length: 56.75, label: 'Post stretcher' },
        //             { length: 20,    label: 'Floor support' }
        //         ],
        //         waste: {
        //             material: 19,
        //             kerf: 0.25
        //         }
        //     },
        //     {
        //         reps: 4,
        //         stock_length: 96,
        //         parts: [
        //             { length: 53, label: 'Side floor joist' }
        //         ],
        //         waste: {
        //             material: 42.875,
        //             kerf: 0.125
        //         }
        //     }
        // ]
    }

    static generate(input: CutListInput): CutList {
        const cuts = new LinearCutList(input);
        // console.log(JSON.stringify(cuts, null, 2));

        const output = {
            total_parts: cuts.parts.length,
            total_operations: 0,
            total_stock: [],
            cuts: cuts.getCuts(),
            yield: 0
        };

        output.total_operations = output.cuts.length;

        const stockMap = output.cuts.reduce((accum, cut) => {
            if (!accum.has(cut.stock_length)) accum.set(cut.stock_length, { length: cut.stock_length, count: 0 });
            accum.get(cut.stock_length).count += cut.reps;
            return accum;
        }, new Map());

        output.total_stock = Array.from(stockMap.values());

        // Calculate yield
        const partsTotal = cuts.parts.reduce((accum, part) => {
            accum += part.length;
            return accum;
        }, 0);

        const stockTotal = output.cuts.reduce((accum, stock) => {
            accum += stock.stock_length * stock.reps;
            return accum;
        }, 0);

        output.yield = (partsTotal / stockTotal) * 100;

        return output;
    }
}

export default LinearCutList;