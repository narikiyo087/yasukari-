module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // pages/test.tsx などのページを Jest がテストと誤認しないよう __tests__ 配下に限定する
  roots: ['<rootDir>/__tests__'],
};
