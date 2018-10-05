const NodeType = {
    ELEMENT_NODE: 1,
    TEXT_NODE: 3
};

// https://html.spec.whatwg.org/multipage/custom-elements.html#valid-custom-element-name
const kMarkupPattern = /<!--[^]*?(?=-->)-->|<(\/?)([a-z][-.0-9_a-z]*)\s*([^>]*?)(\/?)>/ig;
const kAttributePattern = /(^|\s)(.*?)\s*=\s*("([^"]+)"|'([^']+)'|(\S+))/ig;
const kSelfClosingElements = {
    meta: true,
    img: true,
    link: true,
    input: true,
    area: true,
    br: true,
    hr: true
};
const kElementsClosedByOpening = {
    li: {li: true},
    p: {p: true, div: true},
    td: {td: true, th: true},
    th: {td: true, th: true}
};
const kElementsClosedByClosing = {
    li: {ul: true, ol: true},
    a: {div: true},
    b: {div: true},
    i: {div: true},
    p: {div: true},
    td: {tr: true, table: true},
    th: {tr: true, table: true}
};
const kBlockTextElements = {
    script: true,
    noscript: true,
    style: true,
    pre: true
};

function last(arr) {
    return arr[arr.length - 1];
}

/**
 * Node Class as base class for TextNode and HTMLElement.
 */
class Node {
    constructor() {
        this.children = [];
    }
}


class Element extends Node {

    constructor(name, props) {
        super();
        this.type = name;
        this.props = Object.assign({}, props);
        this.children = [];
    }

    appendChild(node) {
        this.children.push(node);
        return node;
    }

}

/*
    {
        type: 'BUTTON',
        children: ['Click me'],
        props: {
            onclick: 'console.log($this)'
        },
        isSVG: false
    }
*/


function parse(data, options) {
    options = options || {};

    const root = new Element(null, {});
    let currentParent = root;
    const stack = [root];
    let lastTextPos = -1;
    let match;

    while (match = kMarkupPattern.exec(data)) {

        if (lastTextPos > -1) {
            if (lastTextPos + match[0].length < kMarkupPattern.lastIndex) {
                // if has content
                const text = data.substring(lastTextPos, kMarkupPattern.lastIndex - match[0].length);
                currentParent.appendChild(text);
            }
        }

        lastTextPos = kMarkupPattern.lastIndex;
        if (match[0][1] === '!') {
            // this is a comment
            continue;
        }

        if (options.lowerCaseTagName)
            match[2] = match[2].toLowerCase();

        if (!match[1]) {
            // not </ tags
            const props = {};
            for (let attMatch; attMatch = kAttributePattern.exec(match[3]);)
                props[attMatch[2]] = attMatch[4] || attMatch[5] || attMatch[6];

            if (!match[4] && kElementsClosedByOpening[currentParent.type]) {
                if (kElementsClosedByOpening[currentParent.type][match[2]]) {
                    stack.pop();
                    currentParent = last(stack);
                }
            }

            currentParent = currentParent.appendChild(new Element(match[2], props));
            stack.push(currentParent);

            if (kBlockTextElements[match[2]]) {
                // a little test to find next </script> or </style> ...
                const closeMarkup = '</' + match[2] + '>';
                const index = data.indexOf(closeMarkup, kMarkupPattern.lastIndex);

                if (options[match[2]]) {
                    let text;

                    if (index === -1) {
                        // there is no matching ending for the text element.
                        text = data.substr(kMarkupPattern.lastIndex);
                    } else {
                        text = data.substring(kMarkupPattern.lastIndex, index);
                    }

                    if (text.length > 0)
                        currentParent.appendChild(text);
                }

                if (index === -1) {
                    lastTextPos = kMarkupPattern.lastIndex = data.length + 1;
                } else {
                    lastTextPos = kMarkupPattern.lastIndex = index + closeMarkup.length;
                    match[1] = 'true';
                }
            }
        }
        if (match[1] || match[4] || kSelfClosingElements[match[2]]) {
            // </ or /> or <br> etc.
            while (true) {
                if (currentParent.type === match[2]) {
                    stack.pop();
                    currentParent = last(stack);
                    break;
                } else {
                    // Trying to close current tag, and move on
                    if (kElementsClosedByClosing[currentParent.type]) {
                        if (kElementsClosedByClosing[currentParent.type][match[2]]) {
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
    return root;
}

module.exports = parse;