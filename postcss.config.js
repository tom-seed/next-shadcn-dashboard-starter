module.exports = {
  plugins: {
    '@tailwindcss/postcss': {
      config: {
        theme: {
          extend: {
            fontFamily: {
              sans: ['outfit', 'sans-serif']
            }
          }
        }
      }
    }
  }
};
