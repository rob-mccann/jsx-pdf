import { expect } from 'chai';

import { toPDFMake } from './index';

describe('#jsx-pdf', () => {
   describe('document', () => {
       it('should add the children to the pdfmake content property', () => {
           expect(toPDFMake({
               elementName: 'document',
               attributes: {},
               children: ['foobar']
           }, {})).to.deep.equal({
               content: ['foobar']
           });
       });

       it('should set page margin', () => {
           expect(toPDFMake({
               elementName: 'document',
               attributes: {
                   margin: '10'
               }
           }, {})).to.deep.equal({
               pageMargins: '10'
           });
       });

       it('should traverse children', () => {
           expect(toPDFMake({
               elementName: 'document',
               children: [{
                   elementName: 'text',
                   children: ['foobar']
               }]
           }, {})).to.deep.equal({
               "content": [{
                    "text": ["foobar"]
               }]
           });
       });
   })
});
