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

## PDF

The library is a thin layer built on top of [pdfmake](http://pdfmake.org/). It currently supports a subset of pdfmake's features; most of the time, simply translating tags and attributes into pdfmake document definition format.

## Components

Similar to modern front-end frameworks, you can define your own components using declarative syntax.

#### Basic example:

```
import { createElement } from 'jsx-to-pdf';

const Greeting = ({ name }) => (
  <text>Hello, {name}!</text>
);

const doc = (
  <document>
    <content>
      <Greeting name="Bob" />
    </content>
  </document>
);
```

#### List example:

```
import { createElement } from 'jsx-to-pdf';

const GroupGreeting = ({ names }) => (
  <group>
    {names.map(name => (
      <Greeting name={name} />
    ))}
  </group>
);

const doc = (
  <document>
    <content>
      <GroupGreeting names={['Bob', 'Alice']} />
    </content>
  </document>
);
```

#### Inline If example:

```
import { createElement } from 'jsx-to-pdf';

const Signature = () => (
  <text>JSX-TO-PDF, Inc.</text>
);

const SignedGreeting = ({ name }) => (
  <group>
    {name && <Greeting name={name} />}
    <Signature />
  </group>
);

const doc = (
  <document>
    <content>
      <SignedGreeting />
    </content>
  </document>
);
```

#### Inline If-Else example:

```
import { createElement } from 'jsx-to-pdf';

const AnonymousGreeting = () => (
  <text>We don't know you.</text>
);

const SignedGreeting = ({ name }) => (
  <group>
    {name ? <Greeting name={name} /> : <AnonymousGreeting />}
    <Signature />
  </group>
);

const doc = (
  <document>
    <content>
      <SignedGreeting />
    </content>
  </document>
);
```

#### Element variable example:

```
import { createElement } from 'jsx-to-pdf';

const SignedGreeting = ({ name }) => {
  let greeting;

  if (name) {
    greeting = (
      <Greeting name={name} />
    );
  } else {
    greeting = (
      <AnonymousGreeting />
    );
  }

  return (
    <group>
      {greeting}
      <Signature />
    </group>
  );
}

const doc = (
  <document>
    <content>
      <SignedGreeting />
    </content>
  </document>
);
```

### Styling

Styling can be done by adding appropriate attributes to tags. Supported attributes can be found [here](http://pdfmake.org/playground.html). It might be a good idea to group style-related attributes together and use the spread syntax.

```
import { createElement } from 'jsx-to-pdf';

const Greeting = ({ name }) => {
  const styles = {
    italics: true,
    fontSize: 10,
  };

  return (
    <text {...styles}>Hello, {name}!</text>
  );
};

const doc = (
  <document>
    <content>
      <Greeting name="Bob" />
    </content>
  </document>
);
```

### Context

Each component has access to global context and can update it if necessary.

```
import { createElement } from 'jsx-to-pdf';

const AllowedUsersProvider = (attributes, context, updateContext) => {
  updateContext({
    allowedUsers: ['Alice'],
  });

  return attributes.children[0];
};

const SecureGreeting = ({ name }, { allowedUsers }) => (
  allowedUsers.includes(name) ? (
    <text>Hello, {name}!</text>
  ) : (
    <text>You are not allowed.</text>
  )
);

const doc = (
  <AllowedUsersProvider>
    <document>
      <content>
        <SecureGreeting name="Bob" />
      </content>
    </document>
  </AllowedUsersProvider>
);
```

## API

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