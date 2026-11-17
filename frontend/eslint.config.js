import js from '@eslint/js';
import pluginVue from 'eslint-plugin-vue';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  // 1. 검사에서 제외할 폴더 지정 (빌드 결과물 등)
  { 
    ignores: ['node_modules', 'dist'] 
  },
  
  // 2. 브라우저 및 Node.js 전역 변수 설정 (콘솔, 윈도우 등 에러 방지)
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  
  // 3. 자바스크립트 및 타입스크립트 기본 추천 규칙 적용
  js.configs.recommended,
  ...tseslint.configs.recommended,
  
  // 4. Vue 파일용 규칙 적용
  ...pluginVue.configs['flat/essential'],
  
  // 5. Vue 내에서 TypeScript 구문을 해석하기 위한 파서 지정
  {
    files: ['*.vue', '**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        sourceType: 'module',
      },
    },
  },

  // 6. Prettier와 충돌하는 스타일 규칙을 모두 끕니다.
  eslintConfigPrettier
);