# jsx-to-pdf

This library allows you to generate PDFs using a react-like JSX syntax.

```
const pdf = render(
  <document>
    <content>This will appear in my PDF!</content>
  </document>
);

this.headers['Content-Type'] = 'application/pdf';
this.body = pdf;
```
