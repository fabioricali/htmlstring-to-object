const parser = require('../');

describe('parser', function () {
    it('should ok', function () {

        const root = parser('<ul id="list" data-any="2"><li data-o="cia">Hello World</li></ul>');

        console.log(root)
        //console.log(root.childNodes[0].childNodes[0])

    })
});