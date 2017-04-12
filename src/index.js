// libs
import flattenDeep from 'lodash/flattenDeep';
import omit from 'lodash/omit';
import pick from 'lodash/pick';
import compact from 'lodash/compact';

// pdf
import PDFMake from 'pdfmake';
import OpenSans from './fonts';

const isTextElement = tag => typeof tag === 'string' || typeof tag === 'number';
const isTopLevelElement = elementName => ['header', 'content', 'footer'].includes(elementName);

function updateContext(context, overrides) {
  return Object.assign(context, overrides);
}

function createContext(parentContext = {}) {
  return { ...parentContext };
}

export function createElement(elementName, attributes, ...children) {
  const flatChildren = flattenDeep(children);
  return {
    elementName,
    children: flatChildren,
    attributes: attributes || {},
  };
}

function resolve(tag, context) {
  let resolvedTag = tag;
  while (typeof resolvedTag.elementName === 'function') {
    resolvedTag = resolvedTag.elementName(
      { ...resolvedTag.attributes, children: resolvedTag.children },
      context,
      updateContext.bind(null, context),
    );
  }

  return resolvedTag;
}

function resolveChildren(tag, parentContext, isTopLevel) {
  const resolvedTag = resolve(tag, parentContext);

  if (isTextElement(resolvedTag)) {
    return resolvedTag;
  }

  const { elementName, children = [], attributes } = resolvedTag;

  if (!isTopLevel && isTopLevelElement(elementName)) {
    throw new Error('<header>, <content> and <footer> elements can only appear as immediate descendents of the <document>');
  }

  if (isTopLevel && !isTopLevelElement(elementName)) {
    throw new Error(`The <document> element can only contain <header>, <content>, and <footer> elements but found ${elementName}`);
  }

  const resolvedChildren = compact(
    children.map(child => resolveChildren(child, createContext(parentContext))),
  );

  /**
   * This is the meat. If you're in this file, you're probably looking for this.
   *
   * Converts the React-like syntax to something PDFMake understands.
   */
  switch (elementName) {
    case 'header':
    case 'content':
    case 'footer':
    case 'stack':
    case 'group':
    case 'cell':
      return { stack: resolvedChildren, ...attributes };
    case 'text':
    case 'columns':
      return { [elementName]: resolvedChildren, ...attributes };
    case 'image':
      return { image: attributes.src, ...(omit(attributes, 'src')) };
    case 'table':
      return { table: { body: resolvedChildren, ...(pick(attributes, ['headerRows', 'widths'])) }, ...attributes };
    case 'row':
      return [...resolvedChildren];
    case 'document':
      throw new Error('<document> can only appear as the root element');
    default:
      return false;
  }
}

export function toPDFMake(tag) {
  const context = createContext();
  const resolvedTag = resolve(tag, context);
  const { children, elementName, attributes = {} } = resolvedTag;

  if (elementName !== 'document') {
    throw new Error(`The root element must resolve to a <document>, actually resolved to ${elementName}`);
  }

  const result = {
    defaultStyle: {
      font: 'OpenSans',
      fontSize: 10,
    },
  };

  children.forEach((child) => {
    const resolvedChild = resolve(child, context);
    result[resolvedChild.elementName] = resolveChildren(resolvedChild, context, true);
  });

  if (attributes.size) {
    result.pageSize = attributes.size;
  }

  if (attributes.margin) {
    result.pageMargins = attributes.margin;
  }

  const info = pick(attributes, ['title', 'author', 'subject', 'keywords']);

  if (info.length > 0) {
    result.info = info;
  }

  return result;
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
