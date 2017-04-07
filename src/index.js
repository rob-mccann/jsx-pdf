// libs
import flattenDeep from 'lodash/flattenDeep';
import omit from 'lodash/omit';
import pick from 'lodash/pick';
import compact from 'lodash/compact';

// pdf
import PDFMake from 'pdfmake';
import OpenSans from './fonts';

export function createElement(elementName, attributes, ...children) {
  const flatChildren = flattenDeep(children);

  if (typeof elementName === 'function') {
    return elementName({ ...attributes, children: flatChildren });
  }

  return {
    elementName,
    children: flatChildren,
    attributes: attributes || {},
  };
}

function traverse(children, doc) {
  if (!children || children.length === 0) {
    return [];
  }

  // eslint-disable-next-line no-use-before-define
  return compact(children.map(child => toPDFMake(child, doc))); // compact removes empty elements
}

export function toPDFMake(tag, doc) {
  if (typeof tag === 'string') { // text element
    return tag;
  }

  const { children, elementName, attributes = {} } = tag;

  if (!doc && elementName !== 'document') {
    throw new Error('The root element must resolve to a <document>');
  }

  // special case for document because we need the doc object before we traverse the children
  if (elementName === 'document') {
    if (doc) {
      throw new Error('<document> was already specified, you can only have one in the tree');
    }

    const resultDoc = {
      defaultStyle: {
        font: 'OpenSans',
        fontSize: 10,
      },
    };

    resultDoc.content = traverse(children, resultDoc) || [];

    if (attributes.size) {
      resultDoc.pageSize = attributes.size;
    }

    if (attributes.margin) {
      resultDoc.pageMargins = attributes.margin;
    }

    const info = pick(attributes, ['title', 'author', 'subject', 'keywords']);

    if (info.length > 0) {
      resultDoc.info = info;
    }

    return resultDoc;
  }

  const resolvedChildren = traverse(children, doc);

  /**
   * This is the meat. If you're in this file, you're probably looking for this.
   *
   * Converts the React-like syntax to something PDFMake understands.
   */
  switch (elementName) {
    case 'footer':
    case 'header':
      // eslint-disable-next-line no-param-reassign
      doc[elementName] = [{ stack: [...resolvedChildren], ...attributes }];
      return false;
    case 'stack':
    case 'group':
      return { stack: resolvedChildren, ...attributes }; // children is only for TEXT tags
    case 'text':
      return { text: resolvedChildren, ...attributes }; // children is only for TEXT tags
    case 'columns':
      return { columns: resolvedChildren || [], ...attributes };
    case 'image':
      return { image: attributes.src, ...(omit(attributes, 'src')) };
    case 'table':
      return { table: { body: resolvedChildren, ...(pick(attributes, ['headerRows', 'widths'])) }, ...attributes };
    case 'row':
      return [...resolvedChildren];
    case 'cell':
      return { stack: resolvedChildren, ...attributes };
    default:
      return false;
  }
}

export function render(elementJSON) {
  // Recursively traverse the PDF template, converting the React-like syntax to pdfmake's syntax
  const doc2 = toPDFMake(elementJSON);

  // the argument here contains a list of fonts on the filesystem. see fonts.js
  const pdf = (new PDFMake({
    OpenSans,
  })).createPdfKitDocument(doc2);

  // return the stream for the caller to handle (usually by pushing straight to s3
  // or to the filesystem
  return pdf;
}
