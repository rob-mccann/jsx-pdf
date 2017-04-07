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

    it('should support object', () => {
      const fragment = <text>test</text>;

      expect(<group>{fragment}</group>).to.deep.equal({
        elementName: 'group',
        children: [{
          elementName: 'text',
          children: ['test'],
          attributes: {},
        }],
        attributes: {},
      });
    });
  });

  describe('document', () => {
    it('should add the children to the pdfmake content property', () => {
      expect(toPDFMake(
        (<document>
          <content>foobar</content>
        </document>),
      )).to.deep.equal({
        content: {
          stack: ['foobar'],
        },
        defaultStyle: {
          font: 'OpenSans',
          fontSize: 10,
        },
      });
    });

    it('should set page margin', () => {
      expect(toPDFMake(
        (<document margin={10} />),
      )).to.deep.equal({
        pageMargins: 10,
        defaultStyle: {
          font: 'OpenSans',
          fontSize: 10,
        },
      });
    });

    it('should traverse children', () => {
      expect(toPDFMake(
        (<document>
          <content>
            <text>foobar</text>
          </content>
        </document>),
      )).to.deep.equal({
        content: {
          stack: [
            { text: ['foobar'] },
          ],
        },
        defaultStyle: {
          font: 'OpenSans',
          fontSize: 10,
        },
      });
    });

    it('should error if a top level element appears below the top level', () => {
      expect(() => {
        toPDFMake(
          <document>
            <content>
              <group><header /></group>
            </content>
          </document>,
        );
      }).to.throw(Error, /immediate descendents/);
    });

    it('should error if document is not the root element', () => {
      expect(() => {
        toPDFMake(<group><text>foobar</text></group>);
      }).to.throw(Error, /root/);
    });

    it('should error if a document appears below the top level', () => {
      expect(() => {
        toPDFMake(<document><content><document /></content></document>);
      }).to.throw(Error, /root/);
    });
  });
});
