module.exports = {
  extends: ['standard', 'prettier/standard'],
  rules: {
    'no-console': [1],
    'max-len': [1, { code: 120, comments: 120, ignoreTrailingComments: true }],
    // This is inserted to make this compatible with prettier.
    curly: 0,
    /*
      This is inserted to make this compatible with prettier.
      Once https://github.com/prettier/prettier/issues/3845 and https://github.com/prettier/prettier/issues/3847 are solved this might be not needed any more.
    */
    'space-before-function-paren': 0
  },
  globals: {
    describe: true,
    test: true,
    expect: true,
    beforeEach: true,
    afterEach: true,
    beforeAll: true,
    afterAll: true
  }
}
