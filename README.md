![Thon Docs Cover](https://static.thonlabs.io/images/readme-static/thon-docs-banner.png)

<div align="center">
<a href="https://discord.gg/K4b5Nd2yBW">Join our Discord</a>
</div>

<br />

<div align="center">

[![npm version](https://badgen.net/npm/v/thon?color=purple)](https://npm.im/thon) [![types included](https://badgen.net/npm/types/tslib?color=purple)](https://npm.im/thon) [![license MIT](https://badgen.net/npm/license/thon?color=purple)](https://github.com/guscsales/thon/blob/main/LICENSE)

</div>

---

## Motivation

Commonly inside a project or company exists an UI library or even some reusable components and those components are only rendered in shallow documentation without too much information. Writing documentation is something that needs to be soft and easy to avoid losing time day by day and everyone that opens the website can understand what is that library about. For this reason, Thon has been created, and it's possible to document your React components using only markdown and some CSS to make things beautiful.

## Getting started

It's simple to start using Thon, just need to follow a few steps.

## Install

```
npm install thon
```

or using yarn:

```
yarn add thon
```

## Initialize

Thon will create a folder called `.thon` and a file `.thonrc`. Those are respectively: the main folder to add your documentation and component modules there and the configuration file to allow you to have more customization on creating the main folder. You don't need to change the RC file unless you want

```
npx thon init
```

You can put another root folder on initialization, for example:

```
npx thon init --root="my-root-folder"
```

### Add the provider and component usage

On the root component of your app add the following provider and modules:

```jsx
import { ThonProvider } from 'thon';
import { modules } from '../.thon';

function App({ children }) {
  return <ThonProvider modules={modules}>{children}</ThonProvider>;
}
```

and you can render the markdown using the `RenderDocument`:

```jsx
import { useThon } from 'thon';

const buttonDoc = require('../.thon/button/button.md');

function MyComponent() {
  const { RenderDocument } = useThon();

  return <RenderDocument markdown={buttonDoc} />;
}
```

After all, just run your application normally.

### In the case of using NextJS

If you're using NextJS you need to update the `next.config.js` file to use Thon's plugin, basically needs only to update similar to the example below:

```javascript
const { withThon } = require('thon/build/next');

const nextConfig = { ... };

module.exports = withThon(nextConfig);
```

## Create documentations

Inside of `.thon` folder you can create sub-folders for each component, a markdown file and a react file with `thon` suffix before the extension. Those suffixes can be updated on `extension` inside `.thonrc` file.

Basically, to render the react component using the markdown, you must follow this pattern below:

| module    | The name of the file in the pascal case, e.g.: `my-component.thon.tsx` will be `MyComponent`   |
| --------- | ---------------------------------------------------------------------------------------------- |
| component | The variation that was exported on this module, e.g.: `export const Primary` will be `Primary` |

<pre>
<code>
```thon
{
  "module": "Button",
  "component": "Primary"
}
```
</code>
</pre>

### Starting with the React file

In this file, you can create all variations of your component and export them. Make sure you're not doing an `export default`.

**Let's create an example for a `Button` component with two variations.**

File: `./thon/button/button.thon.tsx` (or `jsx`):

```jsx
import Button from '../../components/button';

export const Primary = () => <Button type="primary">My Primary Button</Button>;

export const Secondary = () => (
  <Button type="secondary" onClick={() => console.log('You can add events!')}>
    My Secondary Button
  </Button>
);
```

Now you need the markdown to render this component.

File: `./thon/button/button.md`:

<pre>
<code>
# Primary

```thon
{
  "module": "Button",
  "component": "Primary"
}
```

# Secondary


```thon
{
  "module": "Button",
  "component": "Secondary"
}
```
</code>
</pre>

After finish all the creation of your files, run the `build` command:

```
npx thon build
```

## Authors

- Gustavo Sales ([@guscsales](https://twitter.com/guscsales))

## Special Thanks

- To [marked](https://github.com/markedjs/marked) team

## License

MIT
