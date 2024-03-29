Converting a Chrome extension that uses vanilla JavaScript to utilize Node.js primarily involves integrating a build system that allows you to use Node.js modules and features within your extension. This typically means setting up a workflow with tools like Webpack or Rollup to bundle your scripts, along with using Babel if you want to use ES6 features more extensively. Here's a basic guide on how to set this up with Webpack:

### 1. Initialize a Node.js Project

If you haven't already, initialize your project directory as a Node.js project:

```bash
npm init -y
```

### 2. Install Webpack and Babel

Install Webpack, Webpack CLI, Babel, and necessary loaders as dev dependencies:

```bash
npm install --save-dev webpack webpack-cli babel-loader @babel/core @babel/preset-env
```

### 3. Configure Webpack

Create a `webpack.config.js` file in your project root:

```javascript
const path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/index.js', // Your main script file
  output: {
    path: path.resolve(__dirname, 'dist'), // Output directory
    filename: 'bundle.js', // Output bundled file
  },
  module: {
    rules: [
      {
        test: /\.js$/, // Use babel-loader for .js files
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'], // Preset used for env setup
          },
        },
      },
    ],
  },
};
```

Adjust `entry` to point to your main JavaScript file. The `output` specifies where the bundled JavaScript file will be placed.

### 4. Configure Babel

Create a `.babelrc` file or add a `babel` section in your `package.json` to configure Babel. Here's an example `.babelrc` configuration:

```json
{
  "presets": ["@babel/preset-env"]
}
```

### 5. Adjust Your `manifest.json`

Point to the bundled JavaScript file (`bundle.js`) in your `manifest.json` instead of the original script file.

```json
"background": {
  "scripts": ["dist/bundle.js"]
},
```

### 6. Build Your Extension

Add a build script in your `package.json`:

```json
"scripts": {
  "build": "webpack --mode=production"
}
```

Run the build script to bundle your scripts:

```bash
npm run build
```

### 7. Load Your Extension

- Go to `chrome://extensions` in your Chrome browser.
- Enable "Developer mode".
- Click "Load unpacked" and select your project directory (make sure it includes the `dist` folder generated by Webpack).

### Note

This setup allows you to use Node.js modules and modern JavaScript features in your Chrome extension by bundling your scripts with Webpack. However, remember that the Chrome extension environment is different from Node.js, and not all Node.js APIs are available in extensions. You'll mostly be using Node.js for its module system and the ecosystem of packages available via npm.