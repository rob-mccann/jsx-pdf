/* eslint-env mocha */

import { expect } from 'chai';

import { toPDFMake, createElement } from './index';

describe('#jsx-pdf', () => {
  describe('createElement', () => {
    it('should pass the structured object for normal components', () => {
      const element = { // this is the same as <group>hello</group>
        elementName: 'group',
        children: ['foobar'],
        attributes: {},
      };
      expect(createElement(element)).to.equal(element);
    });

    it('should traverse composite components', () => {
      expect(createElement({
        elementName: () => createElement({ // this is the same as <group>hello</group>
          elementName: 'group',
          children: ['foobar'],
          attributes: {},
        }),
        children: [],
        attributes: {},
      })).to.deep.equal({ // this is the same as <group>hello</group>
        elementName: 'group',
        children: ['foobar'],
        attributes: {},
      });
    });

    it('should allow higher order components', () => {
      expect(createElement({
        // this is the same as <group>{ attributes.children }</group>
        elementName: attributes => createElement({
          elementName: 'group',
          children: attributes.children,
          attributes: {},
        }),
        children: ['higher order'],
        attributes: {},
      })).to.deep.equal({ // this is the same as <group>hello</group>
        elementName: 'group',
        children: ['higher order'],
        attributes: {},
      });
    });
  });
  describe('document', () => {
    it('should add the children to the pdfmake content property', () => {
      expect(toPDFMake(createElement({
        elementName: 'document',
        attributes: {},
        children: ['foobar'],
      }), {})).to.deep.equal({
        content: ['foobar'],
      });
    });

    it('should set page margin', () => {
      expect(toPDFMake(createElement({
        elementName: 'document',
        attributes: {
          margin: '10',
        },
      }), {})).to.deep.equal({
        pageMargins: '10',
      });
    });

    it('should traverse children', () => {
      expect(toPDFMake(createElement({
        elementName: 'document',
        children: [createElement({
          elementName: 'text',
          children: ['foobar'],
        })],
      }), {})).to.deep.equal({
        content: [{
          text: ['foobar'],
        }],
      });
    });
  });
});
