/* eslint-env mocha */

import { expect } from 'chai';

import { toPDFMake, createElement } from './index';

describe('#jsx-pdf', () => {
  describe('createElement', () => {
    it('should pass the structured object for normal components', () => {
      expect(<group>hello</group>).to.deep.equal({
        elementName: 'group',
        children: ['hello'],
        attributes: {},
      });
    });

    it('should pass the structured object for complex trees of components', () => {
      expect(
        (<group>
          <text>first</text>
          <text>second</text>
        </group>),
      ).to.deep.equal({
        elementName: 'group',
        children: [
          {
            elementName: 'text',
            children: ['first'],
            attributes: {},
          },
          {
            elementName: 'text',
            children: ['second'],
            attributes: {},
          },
        ],
        attributes: {},
      });
    });

    it('should traverse composite components', () => {
      const Component = () => (<group>hello</group>);

      expect(<Component />).to.deep.equal({
        elementName: 'group',
        children: ['hello'],
        attributes: {},
      });
    });

    it('should allow higher order components', () => {
      const Component = attributes => (<group>{attributes.children}</group>);

      expect(<Component>hello</Component>).to.deep.equal({
        elementName: 'group',
        children: ['hello'],
        attributes: {},
      });
    });
  });

  describe('document', () => {
    it('should add the children to the pdfmake content property', () => {
      expect(toPDFMake(
        (<document>foobar</document>),
        {},
      )).to.deep.equal({
        content: ['foobar'],
      });
    });

    it('should set page margin', () => {
      expect(toPDFMake(
        (<document margin={10} />),
        {},
      )).to.deep.equal({
        pageMargins: 10,
      });
    });

    it('should traverse children', () => {
      expect(toPDFMake(
        (<document><text>foobar</text></document>),
        {},
      )).to.deep.equal({
        content: [{
          text: ['foobar'],
        }],
      });
    });
  });
});
