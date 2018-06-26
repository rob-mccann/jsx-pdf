# jsx-to-pdf

This library allows you to generate PDFs using a react-like JSX syntax.

```
import { createElement, createRenderer } from 'jsx-to-pdf';

const render = createRenderer();

const pdf = render(
  <document>
    <content>This will appear in my PDF!</content>
  </document>
);

this.headers['Content-Type'] = 'application/pdf';
this.body = pdf;
```

### createRenderer

It's a factory function that optionally takes fonts and default document style as parameters and returns a render function.

#### fontDescriptors

While the library uses OpenSans as a default font, additional fonts can be passed to the factory. Font paths have to be absolute.

```
const render = createRenderer({
  fontDescriptors: {
    Roboto: {
      normal: '/home/bob/fonts/Roboto-Regular.ttf',
      bold: '/home/bob/fonts/Roboto-Medium.ttf',
      italics: '/home/bob/fonts/Roboto-Italic.ttf',
      bolditalics: '/home/bob/fonts/Roboto-MediumItalic.ttf'
    }
  }
}
```

#### defaultStyle

The library defaults to using OpenSans 14pt, which can be overridden in the factory function.

```
const render = createRenderer({
  defaultStyle: {
    font: 'Roboto',
    fontSize: 14
  }
}
```

### createElement

This function converts JSX to object representation. Every time JSX syntax is used, the function has to be made available. The functionality directly depends on `plugin-transform-react-jsx` package and Babel set up in the project.

Example `.babelrc` file:
```
{
  "presets" : [
    ["env", {
      "targets": {
        "node": "6"
      }
    }]
  ],
  "plugins": [
    ["transform-react-jsx", { 
      "pragma": "createElement"
    }]
  ]
}
```