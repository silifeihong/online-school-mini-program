/**
 * @wangeditor/editor-for-vue 的 package.json exports 未暴露类型入口，
 * moduleResolution: bundler 下 vue-tsc 无法解析其 dist/src/index.d.ts（库的已知问题）。
 * 这里补模块声明；Editor/Toolbar 的 props 约束由 wangeditor 运行时保证。
 */
declare module '@wangeditor/editor-for-vue' {
  import type { DefineComponent } from 'vue';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const Editor: DefineComponent<any, any, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const Toolbar: DefineComponent<any, any, any>;
}
