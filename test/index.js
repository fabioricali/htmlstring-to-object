const parser = require('../');

describe('parser', function () {
    it('should ok', function () {

        const root = parser(`
            <main>
                <ul id="list" data-any="2">
                    <li onclick="console.log(5 <= 6)" data-o="cia">Hello World</li>
                </ul>
            </main>
        `);

        console.log(root)
        //console.log(root.childNodes[0].childNodes[0])

    })
});