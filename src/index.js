// TODO remove after PR #6 is merged
/* eslint-disable no-param-reassign */

// libs
import omit from 'lodash/omit';
import pick from 'lodash/pick';
import compact from 'lodash/compact';

// pdf
import PDFMake from 'pdfmake';
import OpenSans from './fonts';

export function createElement(tag) {
  const { elementName, attributes, children } = tag;

  if (typeof elementName === 'function') {
    attributes.children = children;
    return elementName(attributes);
  }

  return tag;
}

export function toPDFMake(tag, doc) {
  if (typeof tag === 'string') { // text element
    return tag;
  }

  const { children, elementName, attributes = {} } = tag;

  let resolvedChildren;

  // go down the tree and resolve children elements. This is done up here as we
  // choose to do different things with children, based on the tag.
  if (children && children.length) {
    // compact removes empty elements
    resolvedChildren = compact(children.map(child => toPDFMake(child, doc)));
  }

  /**
   * This is the meat. If you're in this file, you're probably looking for this.
   *
   * Converts the React-like syntax to something PDFMake understands.
   */
  switch (elementName) {
    // eslint-disable-next-line no-case-declarations
    case 'document':
      if (attributes.size) {
        doc.pageSize = attributes.size;
      }

      if (attributes.margin) {
        doc.pageMargins = attributes.margin;
      }

      const info = pick(attributes, ['title', 'author', 'subject', 'keywords']);

      if (info.length > 0) {
        doc.info = info;
      }

      if (children && children.length) {
        doc.content = (doc.content || []).concat(resolvedChildren || []);
      }

      return doc;
    case 'footer':
    case 'header':
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
  const doc = {
    content: [],
    defaultStyle: {
      font: 'OpenSans',
      fontSize: 10,
    },
  };

    // Recursively traverse the PDF template, converting the React-like syntax to pdfmake's syntax
  const doc2 = toPDFMake(elementJSON, doc);

    // the argument here contains a list of fonts on the filesystem. see fonts.js
  const pdf = (new PDFMake({
    OpenSans,
  })).createPdfKitDocument(doc2);

  // return the stream for the caller to handle (usually by pushing straight to s3
  // or to the filesystem
  return pdf;
}
