const Generator = require('yeoman-generator');

module.exports = class ChimiDEVGen extends Generator {
  constructor(args, opts) {
    super(args, opts);
    this.hasPackageJSON = false;
    this.hasBabelConfig = false;
    this.hasEditorConfig = false;
    this.hasESLintConfig = false;
    this.hasESLintIgnore = false;
    this.hasPrettierConfig = false;
    this.hasPrettierIgnore = false;
    this.hasJestConfig = false;
    this.configurationArray = [
      { key: 'hasPackageJSON', file: 'package.json' },
      { key: 'hasBabelConfig', file: '.babelrc' },
      { key: 'hasEditorConfig', file: '.editorconfig' },
      { key: 'hasESLintConfig', file: '.eslintrc' },
      { key: 'hasESLintIgnore', file: '.eslintignore' },
      { key: 'hasPrettierConfig', file: '.prettierrc' },
      { key: 'hasPrettierIgnore', file: '.prettierignore' },
      { key: 'hasJestConfig', file: 'jest.config.js' },
    ];
  }

  initializing() {
    this.configurationArray.forEach(
      ({ key, file }) =>
        (this[key] = this.fs.exists(this.destinationPath(file))),
    );
  }

  async prompting() {
    if (!this.hasPackageJSON) {
      // Prompt questions regarding package json
      this.packageAnswers = await this.prompt([
        {
          type: 'input',
          name: 'packageName',
          message: 'Name of this project',
          default: this.appname,
        },
        {
          type: 'input',
          name: 'desc',
          message: 'Description of this project',
          default: '',
        },
        {
          type: 'input',
          name: 'repoURL',
          message: 'Your repository url',
          default: `https://github.com/gituser/${this.appname}`,
        },
        {
          type: 'input',
          name: 'author',
          message: 'Author of this project',
        },
      ]);
    }
  }

  writing() {
    if (!this.hasPackageJSON) {
      this.log('Writing package.json file...');
      this.fs.copyTpl(
        this.templatePath('package.json.ejs'),
        this.destinationPath('package.json'),
        { ...this.packageAnswers },
      );
    }

    this.configurationArray.forEach(async ({ key, file }) => {
      if (file === 'package.json') return;
      if (this[key]) {
        this.log(
          `\x1b[33m${file} already exists. Please check if it's setup correctly.\x1b[0m`,
        );s
        return;
      }
      this.log(`Writing ${file} file...`);
      this.fs.copy(this.templatePath(file), this.destinationPath(file));
    });

    if (!this.fs.exists(this.destinationPath('src'))) {
      this.fs.copy(
        this.templatePath('index.js'),
        this.destinationPath('src/index.js'),
      );
    }
  }

  install() {
    this.log('Installing Dependencies...');
    const npmModules = [
      '@babel/cli@^7.0.0',
      '@babel/core@^7.0.0',
      '@babel/node@^7.0.0',
      '@babel/preset-env@^7.0.0',
      'babel-eslint@^10.0.0',
      'eslint@^5.0.0',
      'eslint-config-airbnb@^17.0.0',
      'eslint-config-prettier@^4.0.0',
      'eslint-plugin-jest@^22.0.0',
      'eslint-plugin-const-case@^1.0.0',
      'eslint-plugin-json@^1.0.0',
      'eslint-plugin-import@^2.0.0',
      'eslint-plugin-promise@^4.0.0',
      'eslint-plugin-node@^7.0.0',
      'jest@^24.0.0',
      'prettier@^1.0.0',
    ];
    this.npmInstall(npmModules, { 'save-dev': true });
  }
};
