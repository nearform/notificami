module.exports = {
  extends: ['standard', 'standard-jsx', 'standard-react', 'prettier/react', 'prettier/standard'],
  rules: {
    'no-console': [1],
    'max-len': [1, { code: 120, comments: 120, ignoreTrailingComments: true }],
    // This is inserted to make this compatible with prettier.
    curly: 0,
    /*
      This is inserted to make this compatible with prettier.
      Once https://github.com/prettier/prettier/issues/3845 and https://github.com/prettier/prettier/issues/3847 are solved this might be not needed any more.
    */
    'react/prop-types': 0,
    'space-before-function-paren': 0,
    // This is because usually double quotes are more common in HTML/JSX tags.
    'jsx-quotes': [2, 'prefer-double'],
    // Let's make sure all JSX is clearly indicated by file extension.
    'react/jsx-filename-extension': [2, { extensions: ['.jsx'] }]
  },
  globals: {
    describe: true,
    test: true,
    jest: true,
    jsdom: true,
    expect: true,
    beforeEach: true,
    afterEach: true,
    beforeAll: true,
    afterAll: true
  }
}
