// https://html.spec.whatwg.org/multipage/custom-elements.html#valid-custom-element-name
const markupPattern = /<!--[^]*?(?=-->)-->|<(\/?)([a-z][-.0-9_a-z]*)\s*([^>]*?)(\/?)>/ig;
const attributePattern = /(^|\s)([\w-:]+)\s*=\s*("([^"]+)"|'([^']+)'|(\S+))/ig;

const selfClosingElements = {
    meta: true,
    img: true,
    link: true,
    input: true,
    area: true,
    br: true,
    hr: true
};

const elementsClosedByOpening = {
    li: {li: true},
    p: {p: true, div: true},
    td: {td: true, th: true},
    th: {td: true, th: true}
};

const elementsClosedByClosing = {
    li: {ul: true, ol: true},
    a: {div: true},
    b: {div: true},
    i: {div: true},
    p: {div: true},
    td: {tr: true, table: true},
    th: {tr: true, table: true}
};

function last(arr) {
    return arr[arr.length - 1];
}

function removeNLS(str) {
    return str.replace(/\n\s+/gm, '')
}

class Element {

    constructor(name, props, isSVG) {
        this.type = name;
        this.props = Object.assign({}, props);
        this.children = [];
        this.isSVG = isSVG || /^svg$/.test(name);
    }

    appendChild(node) {
        this.children.push(node);
        return node;
    }

}

function parse(data) {

    const root = new Element(null, {});
    const stack = [root];
    let currentParent = root;
    let lastTextPos = -1;
    let match;
    let props;

    while (match = markupPattern.exec(data)) {

        if (lastTextPos > -1) {
            if (lastTextPos > -1 && lastTextPos + match[0].length < markupPattern.lastIndex) {
                // remove new line space
                const text = removeNLS(data.substring(lastTextPos, markupPattern.lastIndex - match[0].length));
                // if has content
                if (text)
                    currentParent.appendChild(text);
            }
        }

        lastTextPos = markupPattern.lastIndex;
        if (match[0][1] === '!') {
            // this is a comment
            continue;
        }

        if (!match[1]) {
            // not </ tags
            props = {};

            for (let attMatch; attMatch = attributePattern.exec(match[3]);) {
                props[attMatch[2]] = attMatch[4] || attMatch[5] || attMatch[6];
            }

            if (!match[4] && elementsClosedByOpening[currentParent.type]) {
                if (elementsClosedByOpening[currentParent.type][match[2]]) {
                    stack.pop();
                    currentParent = last(stack);
                }
            }

            currentParent = currentParent.appendChild(new Element(match[2], props, currentParent.isSVG));
            stack.push(currentParent);
        }

        if (match[1] || match[4] || selfClosingElements[match[2]]) {
            // </ or /> or <br> etc.
            while (true) {
                if (currentParent.type === match[2]) {
                    stack.pop();
                    currentParent = last(stack);
                    break;
                } else {
                    // Trying to close current tag, and move on
                    if (elementsClosedByClosing[currentParent.type]) {
                        if (elementsClosedByClosing[currentParent.type][match[2]]) {
                            stack.pop();
                            currentParent = last(stack);
                            continue;
                        }
                    }
                    // Use aggressive strategy to handle unmatching markups.
                    break;
                }
            }
        }
    }

    if (root.children.length > 1) {
        root.type = 'dz-root';
    } else if (root.children.length) {
        return root.children[0];
    }

    return root;
}

module.exports = parse;