module.exports = {
    // テスト環境を設定
    testEnvironment: 'jsdom',  
  
    // テストのマッチパターン
    testMatch: ['**/src/**/*.{test,spec}.ts?(x)', '**/src/**/*.test.ts?(x)'], 
  
    // TypeScript のサポート (もし TypeScript を使っていれば)
    transform: {
      '^.+\\.(ts|tsx)$': 'ts-jest',
    },
  
    // その他の設定（例：カバレッジ報告）
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageProvider: 'v8',
  
    // 型チェックの設定 (TypeScriptを使っている場合)
    preset: 'ts-jest',
  };