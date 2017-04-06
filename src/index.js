'use strict';

// libs
import fs from 'fs';
import path from 'path';
import emptyObject from 'fbjs/lib/emptyObject';
import omit from 'lodash/omit';
import pick from 'lodash/pick';
import compact from 'lodash/compact';

// react
import ReactFiberReconciler from 'react-dom/lib/ReactFiberReconciler';
import ReactGenericBatching from 'react-dom/lib/ReactGenericBatching';

// pdf
import PDFMake from 'pdfmake';
import OpenSans from './fonts';

const createContainer = (element) => {
    const doc = {
        content: [],
        defaultStyle: {
            font: 'OpenSans',
            fontSize: 10
        }
    };

    const container = {
        children: [],
        tag: 'CONTAINER',
        doc,
        firstPageSkipped: false,
    };

    const root = PDFRenderer.createContainer(container);
    PDFRenderer.updateContainer(element, root, null, null);

    return container;
};


const PDFRenderer = ReactFiberReconciler({
    getRootHostContext() {
        return emptyObject;
    },

    getChildHostContext() {
        return emptyObject;
    },

    prepareForCommit() {
        // noop
    },

    resetAfterCommit() {
        // noop
    },

    createInstance(
        type,
        props,
        rootContainerInstance,
    ) {
        return {
            type,
            props,
            children: [],
            rootContainerInstance,
            tag: 'INSTANCE',
        };
    },

    appendInitialChild(parentInstance, child) {
        const index = parentInstance.children.indexOf(child);
        if (index !== -1) {
            parentInstance.children.splice(index, 1);
        }
        parentInstance.children.push(child);
    },

    finalizeInitialChildren() {
        return false;
    },

    prepareUpdate() {
        return true;
    },

    commitUpdate(
        instance,
        type,
        oldProps,
        newProps,
        rootContainerInstance,
        internalInstanceHandle,
    ) {
        // noop
    },

    commitMount(
        instance,
        type,
        newProps,
        rootContainerInstance,
        internalInstanceHandle,
    ) {
        // noop
    },

    shouldSetTextContent() {
        return false;
    },

    resetTextContent(testElement) {
        // noop
    },

    createTextInstance(
        text,
    ) {
        return {
            text,
            tag: 'TEXT',
        };
    },

    commitTextUpdate(textInstance, oldText, newText) {
        textInstance.text = newText;
    },

    appendChild(parentInstance, child) {
        const index = parentInstance.children.indexOf(child);
        if (index !== -1) {
            parentInstance.children.splice(index, 1);
        }
        parentInstance.children.push(child);
    },

    insertBefore(parentInstance, child, beforeChild) {
        const index = parentInstance.children.indexOf(child);
        if (index !== -1) {
            parentInstance.children.splice(index, 1);
        }
        const beforeIndex = parentInstance.children.indexOf(beforeChild);
        parentInstance.children.splice(beforeIndex, 0, child);
    },

    removeChild(parentInstance, child) {
        const index = parentInstance.children.indexOf(child);
        parentInstance.children.splice(index, 1);
    },

    scheduleAnimationCallback(fn) {
        setTimeout(fn);
    },

    scheduleDeferredCallback(fn) {
        setTimeout(fn, 0, { timeRemaining: Infinity });
    },

    useSyncScheduling: true,

    getPublicInstance(inst) {
        return inst;
    },
});

function traverseComponentTree(inst) {
    const { doc } = inst.rootContainerInstance;
    const { children, ...props } = inst.props;

    let resolvedChildren = undefined;

    // go down the tree and resolve children elements. This is done up here as we choose to do different
    // things with children, based on the tag
    if (inst.children && inst.children.length) {
        resolvedChildren = compact(inst.children.map(toPDF)); // compact removes empty elements
    }

    /**
     * This is the meat. If you're in this file, you're probably looking for this.
     *
     * Converts the React-like syntax to something PDFMake understands.
     */
    switch (inst.type) {
        case 'document':
            if (props.size) {
                doc.pageSize = props.size;
            }

            if (props.margin) {
                doc.pageMargins = props.margin;
            }

            doc.info = pick(props, ['title', 'author', 'subject', 'keywords']);

            if (inst.children && inst.children.length) {
                doc.content = doc.content.concat(resolvedChildren || []);
            }

            return doc;
            break;
        case 'footer':
        case 'header':
            doc[inst.type] = [ { stack: [ ...resolvedChildren ], ...props } ];
            return false;
            break;
        case 'stack':
        case 'group':
            return { stack: resolvedChildren || children, ...props }; // children is only for TEXT tags
            break;
        case 'text':
            return { text: resolvedChildren || children, ...props }; // children is only for TEXT tags
            break;
        case 'columns':
            return { columns: resolvedChildren || [], ...props };
            break;
        case 'image':
            return { image: props.src, ...(omit(props, 'src')) };
        case 'table':
            return { table: { body: resolvedChildren, ...(pick(props, ['headerRows', 'widths'])) }, ...props };
            break;
        case 'row':
            return [ ...resolvedChildren ];
        case 'cell':
            return { stack: resolvedChildren, ...props };
            break;
        default:
            break;
    }


}

// is the tag a component or text object?
function toPDF(inst) {
    switch (inst.tag) {
        case 'TEXT':
            // if the component contains text only
            return inst.text;
        case 'INSTANCE':
            // if the component contains an instance of a component
            return traverseComponentTree(inst);
        default:
            throw new Error('Unexpected node type in toPDF: ' + inst.tag);
    }
}

const ReactPDFFiberRenderer = {
    render(element) {
        // Create the container and add the PDF template to the container
        const container = createContainer(element);

        // Recursively traverse the PDF template, converting the React-like syntax to pdfmake's syntax
        const doc2 = toPDF(container.children[0]);

        // the argument here contains a list of fonts on the filesystem. see fonts.js
        const pdf = (new PDFMake({
            OpenSans
        })).createPdfKitDocument(doc2);

        // return the stream for the caller to handle (usually by pushing straight to s3 or to the filesystem
        return pdf;
    },

    unstable_batchedUpdates: ReactGenericBatching.batchedUpdates,
};

export default ReactPDFFiberRenderer;