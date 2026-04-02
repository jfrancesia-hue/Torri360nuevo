module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@toori360/shared$': '<rootDir>/../../../packages/shared/src/index.ts',
    '^@toori360/db$': '<rootDir>/../../../packages/db/src/index.ts',
    '^@prisma/client(.*)$': '<rootDir>/../../../packages/db/node_modules/@prisma/client$1',
  },
};
