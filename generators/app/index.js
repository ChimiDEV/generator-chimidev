const gitconfig = require('gitconfig');
const Generator = require('yeoman-generator');

module.exports = class CloudGen extends Generator {
  constructor(args, opts) {
    super(args, opts);
    this.hasPackageJSON = false;
    this.hasNPMConfig = false;
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
      { key: 'hasGitIgnore', file: '.gitignore' },
    ];

    this.scripts = {
      lint: 'eslint .',
      'lint:fix': 'eslint --fix .',
      format: 'prettier --write "**/*.{md,yaml,yml,js,json}"',
      test: 'LOG_LEVEL=debug jest',
      prebuild: 'rm -rf dist',
      build: 'babel --out-dir dist src',
      qa: 'npm run lint:fix && npm run format && npm run test',
    };

    this.npmModules = [
      '@babel/cli@^7.0.0',
      '@babel/core@^7.0.0',
      '@babel/node@^7.0.0',
      '@babel/preset-env@^7.0.0',
      'babel-eslint@^10.0.0',
      'eslint@^6.0.0',
      'eslint-config-airbnb-base@^14.0.0',
      'eslint-config-prettier@^6.0.0',
      'eslint-plugin-jest@^23.0.0',
      'eslint-plugin-json@^2.0.0',
      'eslint-plugin-import@^2.0.0',
      'eslint-plugin-promise@^4.0.0',
      'eslint-plugin-node@^11.0.0',
      'jest@^25.0.0',
      'prettier@^2.0.0',
      'core-js@^3.0.0',
    ];
  }

  async initializing() {
    this.configurationArray.forEach(
      ({ key, file }) =>
        (this[key] = this.fs.exists(this.destinationPath(file))),
    );

    const {
      remote: { origin: { url: repoOrigin } = {} } = {},
    } = await gitconfig.get({
      location: 'local',
    });

    if (repoOrigin) {
      //git@ssh origin or https origin
      // git@ssh.git.tech.rz.db.de:iot-data/a/b/repo.git
      this.gitRepoURL = !repoOrigin.startsWith('https')
        ? `https://git.tech.rz.db.de/${repoOrigin
            .split(':')[1]
            .replace('.git', '')}`
        : repoOrigin;
    }
  }

  async prompting() {
    if (!this.hasPackageJSON) {
      // Prompt questions regarding package json
      this.packageAnswers = await this.prompt([
        {
          type: 'input',
          name: 'packageName',
          message: 'Name of this project',
          default: this.appname.replace(/\s/g, '-'),
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
          default:
            this.gitRepoURL ||
            `https://git.tech.rz.db.de/${this.user.git.name()}/${this.appname.replace(
              /\s/g,
              '-',
            )}`,
        },
        {
          type: 'input',
          name: 'author',
          message: 'Author of this project',
          default: `${this.user.git.name() || 'Name'} <${
            this.user.git.email() || 'email@address.com'
          }>`,
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

    // Add Package JSON Scripts:
    const packageJSON = this.fs.readJSON(this.destinationPath('package.json'));
    // Work around: Fixes the &gt; anf &lt; Problem in Author...
    packageJSON.author = (packageJSON.author || '')
      .replace(/(&lt;)/g, '<')
      .replace(/(&gt;)/g, '>');

    if (!packageJSON.scripts) packageJSON.scripts = {};

    Object.entries(this.scripts).forEach(([scriptName, command]) => {
      if (packageJSON.scripts[scriptName]) {
        this.log(
          `\x1b[33m$NPM script '${scriptName}' already exists. Please check if it's setup correctly.\x1b[0m`,
        );
        return;
      }
      this.log(`Adding NPM script '${scriptName}'`);
      packageJSON.scripts[scriptName] = command;
    });

    this.fs.writeJSON(
      this.destinationPath('package.json'),
      packageJSON,
      null,
      2,
    );

    // Add Config Files
    this.configurationArray.forEach(async ({ key, file }) => {
      if (file === 'package.json') return;
      if (this[key]) {
        this.log(
          `\x1b[33m${file} already exists. Please check if it's setup correctly.\x1b[0m`,
        );
        return;
      }
      this.log(`Writing ${file} file...`);

      if (file === '.gitignore') {
        this.fs.copy(
          this.templatePath(`${file}.template`),
          this.destinationPath(file),
        );
        return;
      }

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
    this.npmInstall(this.npmModules, { 'save-dev': true });
  }
};
