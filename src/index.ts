import * as express from 'express';
import LinearCutList from './LinearCutList.class';

abstract class App {
    static get port(): number { return 3000 }

    static init(): any {
        switch (process.argv[2]) {
            case 'start-server':  return App.start_server();
            default: return App.display_help();
        }
    }

    static start_server(): void {
        const server = express();

        // Define the routes
        server.get('/cutlist/linear', App.genLinearCutList);
        server.get('/cutlist/linearviewer', App.genLinearCutListViewer);

        // Listen on the port
        server.listen(App.port, () => console.log(`Listening on port ${App.port}`));
    }

    static genLinearCutList(req: express.Request, res: express.Response) {
        // res.json(LinearCutList.generate({
        //     kerf: 0.125,
        //     stock: [
        //         { length: 96, quantity: null, label: '2x4' }
        //     ],
        //     parts: [
        //         { length: 53,    quantity: 4, label: 'Side floor joist' },
        //         { length: 56.75, quantity: 2, label: 'Post stretcher'   },
        //         { length: 20,    quantity: 2, label: 'Floor support'    }
        //     ]
        // }));
        res.json(LinearCutList.generate({
            kerf: 0.125,
            stock: [
                { length: 96, quantity: null, label: '2x4' }
            ],
            parts: [
                { length: 20,     quantity: 2, label: 'P1' },
                { length: 25,     quantity: 2, label: 'P2' },
                { length: 53,     quantity: 4, label: 'P3' },
                { length: 57,     quantity: 2, label: 'P4' },
                { length: 60,     quantity: 4, label: 'P5' },
                { length: 62.25,  quantity: 4, label: 'P6' },
                { length: 53,     quantity: 1, label: 'P7' },
                { length: 47.5,   quantity: 1, label: 'P8' },
                { length: 53,     quantity: 1, label: 'P9' },
                { length: 59,     quantity: 1, label: 'P10' },
                { length: 46.438, quantity: 2, label: 'P11' },
                { length: 49,     quantity: 1, label: 'P12' },
                { length: 31.75,  quantity: 1, label: 'P13' },
                { length: 28.75,  quantity: 1, label: 'P14' },
                { length: 41.5,   quantity: 1, label: 'P15' },
                { length: 19,     quantity: 1, label: 'P16' },
                { length: 24.625, quantity: 1, label: 'P17' }
            ]
        }));
    }

    static genLinearCutListViewer(req: express.Request, res: express.Response) {
        const cuts = LinearCutList.generate({
            kerf: 0.125,
            stock: [
                { length: 96, quantity: null, label: '2x4' }
            ],
            parts: [
                { length: 20,     quantity: 2, label: 'P1' },
                { length: 25,     quantity: 2, label: 'P2' },
                { length: 53,     quantity: 6, label: 'P3' },
                { length: 57,     quantity: 2, label: 'P4' },
                { length: 60,     quantity: 4, label: 'P5' },
                { length: 62.25,  quantity: 4, label: 'P6' },
                { length: 47.5,   quantity: 1, label: 'P7' },
                { length: 59,     quantity: 1, label: 'P8' },
                { length: 46.438, quantity: 2, label: 'P9' },
                { length: 49,     quantity: 1, label: 'P10' },
                { length: 31.75,  quantity: 1, label: 'P11' },
                { length: 28.75,  quantity: 1, label: 'P12' },
                { length: 41.5,   quantity: 1, label: 'P13' },
                { length: 19,     quantity: 1, label: 'P14' },
                { length: 24.625, quantity: 1, label: 'P15' }
            ]
        });

        let html = `<table>`;

        html += [
            'reps',
            'stock_length',
            'wasted_material',
            'parts'
        ].map(x => `<th>${x}</th>`).join(``)

        for (let cut of cuts.cuts) {
            const cols = [
                cut.reps,
                cut.stock_length,
                cut.waste.material,
                cut.parts.map(p => p.length).join(' - ')
            ].map(x => `<td>${x}</td>`).join('\n');

            html += `<tr>${cols}</tr>`;
        }

        html += `</table>`

        res.send(html);
    }

    static display_help() { console.log('Usage: index.ts [ start-server ]') }
}

App.init();