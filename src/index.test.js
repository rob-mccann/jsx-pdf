import MockPDFMake from 'pdfmake';
import { createElement, createRenderer, toPDFMake } from '.';

jest.mock('pdfmake', () => jest.fn());

describe('#jsx-pdf', () => {
  describe('createRenderer', () => {
    beforeEach(() => {
      MockPDFMake.mockClear();
    });

    it('should return a function', () => {
      expect(createRenderer()).toBeInstanceOf(Function);
    });

    it('should call pdfmake constructor', () => {
      createRenderer();

      expect(MockPDFMake).toHaveBeenCalled();
    });

    it('should pass open-sans to pdfmake constructor', () => {
      createRenderer();

      expect(MockPDFMake).toHaveBeenCalledWith({
        OpenSans: {
          normal: expect.stringContaining('OpenSans-Regular.ttf'),
          bold: expect.stringContaining('OpenSans-Bold.ttf'),
          italics: expect.stringContaining('OpenSans-Italic.ttf'),
          bolditalics: expect.stringContaining('OpenSans-BoldItalic.ttf'),
        },
      });
    });

    it('should pass custom fonts to pdfmake constructor', () => {
      createRenderer({
        fontDescriptors: {
          Font1: {
            normal: 'fonts/Font1-Regular.ttf',
            bold: 'fonts/Font1-Medium.ttf',
            italics: 'fonts/Font1-Italic.ttf',
            bolditalics: 'fonts/Font1-MediumItalic.ttf',
          },
          Font2: {
            normal: 'fonts/Font2-Regular.ttf',
            bold: 'fonts/Font2-Medium.ttf',
            italics: 'fonts/Font2-Italic.ttf',
            bolditalics: 'fonts/Font2-MediumItalic.ttf',
          },
        },
      });

      expect(MockPDFMake).toHaveBeenCalledWith({
        OpenSans: {
          normal: expect.stringContaining('OpenSans-Regular.ttf'),
          bold: expect.stringContaining('OpenSans-Bold.ttf'),
          italics: expect.stringContaining('OpenSans-Italic.ttf'),
          bolditalics: expect.stringContaining('OpenSans-BoldItalic.ttf'),
        },
        Font1: {
          normal: 'fonts/Font1-Regular.ttf',
          bold: 'fonts/Font1-Medium.ttf',
          italics: 'fonts/Font1-Italic.ttf',
          bolditalics: 'fonts/Font1-MediumItalic.ttf',
        },
        Font2: {
          normal: 'fonts/Font2-Regular.ttf',
          bold: 'fonts/Font2-Medium.ttf',
          italics: 'fonts/Font2-Italic.ttf',
          bolditalics: 'fonts/Font2-MediumItalic.ttf',
        },
      });
    });

    describe('returned function', () => {
      beforeEach(() => {
        MockPDFMake.prototype.createPdfKitDocument = jest.fn();
      });

      it('should add style to pdfmake document', () => {
        const render = createRenderer();
        render(<document />);

        expect(MockPDFMake.prototype.createPdfKitDocument).toHaveBeenCalledWith(
          {
            defaultStyle: {
              font: 'OpenSans',
              fontSize: 12,
            },
          },
        );
      });

      it('should add custom style to pdfmake document', () => {
        const render = createRenderer({
          defaultStyle: {
            font: 'FontCustom',
            fontSize: 24,
          },
        });
        render(<document />);

        expect(MockPDFMake.prototype.createPdfKitDocument).toHaveBeenCalledWith(
          {
            defaultStyle: {
              font: 'FontCustom',
              fontSize: 24,
            },
          },
        );
      });
    });
  });

  describe('basics', () => {
    it('should return the pdfmake document definition for simple components', () => {
      expect(
        toPDFMake(
          <document>
            <content>hello</content>
          </document>,
        ),
      ).toEqual({
        content: {
          stack: ['hello'],
        },
      });
    });

    it('should return the pdfmake document definition for complex trees of components', () => {
      expect(
        toPDFMake(
          <document>
            <content>
              <text>first</text>
              <text>second</text>
            </content>
          </document>,
        ),
      ).toEqual({
        content: {
          stack: [{ text: 'first' }, { text: 'second' }],
        },
      });
    });

    it('should support numbers inside jsx', () => {
      expect(
        toPDFMake(
          <document>
            <content>{123}</content>
          </document>,
        ),
      ).toEqual({
        content: {
          stack: [123],
        },
      });
    });

    it('should concatenate consecutive numbers rather than adding them', () => {
      expect(
        toPDFMake(
          <document>
            <content>
              {123}
              {456}
            </content>
          </document>,
        ),
      ).toEqual({
        content: {
          stack: ['123456'],
        },
      });
    });
  });

  describe('component functions', () => {
    it('should traverse composite components', () => {
      const Component = () => <text>hello</text>;

      expect(
        toPDFMake(
          <document>
            <content>
              <Component />
            </content>
          </document>,
        ),
      ).toEqual({
        content: {
          stack: [{ text: 'hello' }],
        },
      });
    });

    it('should traverse nested composite components', () => {
      const ChildComponent = () => <text>hello</text>;
      const Component = () => (
        <stack>
          <ChildComponent />
        </stack>
      );

      expect(
        toPDFMake(
          <document>
            <content>
              <Component />
            </content>
          </document>,
        ),
      ).toEqual({
        content: {
          stack: [
            {
              stack: [{ text: 'hello' }],
            },
          ],
        },
      });
    });

    it('should support object', () => {
      const fragment = <text>test</text>;

      expect(
        toPDFMake(
          <document>
            <content>{fragment}</content>
          </document>,
        ),
      ).toEqual({
        content: {
          stack: [{ text: 'test' }],
        },
      });
    });

    it('should join resulting text elements together', () => {
      const Name = () => 'Mr. Test';

      expect(
        toPDFMake(
          <document>
            <content>
              <text>
                Hello <Name />!
              </text>
            </content>
          </document>,
        ),
      ).toEqual({
        content: {
          stack: [{ text: 'Hello Mr. Test!' }],
        },
      });
    });
  });

  it('should ignore falsy values', () => {
    expect(
      toPDFMake(
        <document>
          <content>
            Hello{null}
            {undefined}
            {''}
            {0}
            {NaN}
            {false}!
          </content>
        </document>,
      ),
    ).toEqual({
      content: {
        stack: ['Hello!'],
      },
    });
  });

  it('should ignore wrapped falsy values', () => {
    const Null = () => null;
    const Undefined = () => {};
    const Empty = () => '';
    const Zero = () => 0;
    const NAN = () => NaN;
    const False = () => () => false;

    expect(
      toPDFMake(
        <document>
          <content>
            <text>
              Hello<Null />
              <Undefined />
              <Empty />
              <Zero />
              <NAN />
              <False />!
            </text>
          </content>
        </document>,
      ),
    ).toEqual({
      content: {
        stack: [{ text: 'Hello!' }],
      },
    });
  });

  describe('higher order components', () => {
    it('should allow higher order components', () => {
      const Component = attributes => <text>{attributes.children}</text>;

      expect(
        toPDFMake(
          <document>
            <content>
              <Component>hello</Component>
            </content>
          </document>,
        ),
      ).toEqual({
        content: {
          stack: [{ text: 'hello' }],
        },
      });
    });
  });

  describe('context', () => {
    it('should pass context to children', () => {
      const Provider = (attributes, context, updateContext) => {
        updateContext({ mytest: 'test' });
        return attributes.children[0];
      };

      const MyContextualisedComponent = (attributes, context) => (
        <text>{context.mytest}</text>
      );

      expect(
        toPDFMake(
          <Provider>
            <document>
              <content>
                <MyContextualisedComponent />
              </content>
            </document>
          </Provider>,
        ),
      ).toEqual({
        content: {
          stack: [{ text: 'test' }],
        },
      });
    });

    it('should not pass context to siblings', () => {
      const Provider = (attributes, context, updateContext) => {
        updateContext({ mytest: 'this should not exist in the sibling' });
        return <text>first</text>;
      };

      const SiblingProvider = (attributes, context) => (
        <text>{context.mytest || 'it worked'}</text>
      );

      expect(
        toPDFMake(
          <document>
            <content>
              <Provider />
              <SiblingProvider />
            </content>
          </document>,
        ),
      ).toEqual({
        content: {
          stack: [{ text: 'first' }, { text: 'it worked' }],
        },
      });
    });

    it('should pass context to grandchildren', () => {
      const Provider = (attributes, context, updateContext) => {
        updateContext({ mytest: 'test' });
        return attributes.children[0];
      };

      const MyContextualisedComponent = (attributes, context) => (
        <text>{context.mytest}</text>
      );
      const MyParentComponent = () => <MyContextualisedComponent />;

      expect(
        toPDFMake(
          <Provider>
            <document>
              <content>
                <MyParentComponent />
              </content>
            </document>
          </Provider>,
        ),
      ).toEqual({
        content: {
          stack: [{ text: 'test' }],
        },
      });
    });
  });

  describe('document', () => {
    it('should set page margin', () => {
      expect(toPDFMake(<document margin={10} />)).toEqual({
        pageMargins: 10,
      });
    });

    it('should error if a top level element appears below the top level', () => {
      expect(() => {
        toPDFMake(
          <document>
            <content>
              <stack>
                <header />
              </stack>
            </content>
          </document>,
        );
      }).toThrow(Error, /immediate descendents/);
    });

    it('should error if document is not the root element', () => {
      expect(() => {
        toPDFMake(
          <stack>
            <text>foobar</text>
          </stack>,
        );
      }).toThrow(Error, /root/);
    });

    it('should error if a document appears below the top level', () => {
      expect(() => {
        toPDFMake(
          <document>
            <content>
              <document />
            </content>
          </document>,
        );
      }).toThrow(Error, /root/);
    });

    it('should not error if a top level element appears nested inside a function component', () => {
      const Nested = () => <content />;

      expect(() => {
        toPDFMake(
          <document>
            <Nested />
          </document>,
        );
      }).not.toThrow(Error);
    });

    it('should resolve functional top level elements', () => {
      const Component = () => (
        <content>
          <text>test</text>
        </content>
      );

      expect(
        toPDFMake(
          <document>
            <Component />
          </document>,
        ),
      ).toEqual({
        content: {
          stack: [{ text: 'test' }],
        },
      });
    });
  });

  describe('unordered list', () => {
    it('should be converted', () => {
      expect(
        toPDFMake(
          <document>
            <content>
              <ul>
                <text>item 1</text>
                <text>item 2</text>
              </ul>
            </content>
          </document>,
        ),
      ).toEqual({
        content: {
          stack: [
            {
              ul: [{ text: 'item 1' }, { text: 'item 2' }],
            },
          ],
        },
      });
    });

    it('should have passed attributes', () => {
      expect(
        toPDFMake(
          <document>
            <content>
              <ul
                type="square"
                separator={['(', ')']}
                start={50}
                color="blue"
                markerColor="red"
                reversed
              >
                <text>item 1</text>
                <text>item 2</text>
              </ul>
            </content>
          </document>,
        ),
      ).toEqual({
        content: {
          stack: [
            {
              ul: [{ text: 'item 1' }, { text: 'item 2' }],
              type: 'square',
              separator: ['(', ')'],
              start: 50,
              color: 'blue',
              markerColor: 'red',
              reversed: true,
            },
          ],
        },
      });
    });
  });

  describe('ordered list', () => {
    it('should be converted', () => {
      expect(
        toPDFMake(
          <document>
            <content>
              <ol>
                <text>item 1</text>
                <text>item 2</text>
              </ol>
            </content>
          </document>,
        ),
      ).toEqual({
        content: {
          stack: [
            {
              ol: [{ text: 'item 1' }, { text: 'item 2' }],
            },
          ],
        },
      });
    });

    it('should have passed attributes', () => {
      expect(
        toPDFMake(
          <document>
            <content>
              <ol
                type="lower-roman"
                separator={['(', ')']}
                start={50}
                color="blue"
                markerColor="red"
                reversed
              >
                <text>item 1</text>
                <text>item 2</text>
              </ol>
            </content>
          </document>,
        ),
      ).toEqual({
        content: {
          stack: [
            {
              ol: [{ text: 'item 1' }, { text: 'item 2' }],
              type: 'lower-roman',
              separator: ['(', ')'],
              start: 50,
              color: 'blue',
              markerColor: 'red',
              reversed: true,
            },
          ],
        },
      });
    });
  });
});
