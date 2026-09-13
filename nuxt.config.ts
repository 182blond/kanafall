const baseURL = process.env.NUXT_APP_BASE_URL || '/'

export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  ssr: false,
  devtools: { enabled: false },
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/main.css'],
  typescript: { strict: true },
  app: {
    baseURL,
    head: {
      title: 'Kanafall · El bosque de las letras',
      htmlAttrs: { lang: 'es' },
      meta: [
        {
          name: 'description',
          content: 'Un pequeño espíritu, hiragana, katakana y una aventura que empieza con tu teclado.',
        },
      ],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: `${baseURL}favicon.svg` }],
    },
  },
})
