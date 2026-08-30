import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  name: 'project/ignores',
  ignores: [
    '.nuxt/**',
    '.output/**',
    '_site/**',
    '_packages/**',
    'node_modules/**',
    'output/**',
    'assets/js/**'
  ]
}, {
  name: 'project/rules',
  rules: {
    'vue/multi-word-component-names': 'off'
  }
})
