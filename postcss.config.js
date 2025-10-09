module.exports = {
  plugins: {
    '@tailwindcss/postcss': {
      config: {
        theme: {
          colors: {
            red_coral: {
              light: '#00E4F8',
              base: '#00B7C7',
              dark: '#008995'
            },
            yellow_gold: {
              light: '#FFFFFF',
              base: '#B4E2F9',
              dark: '#50BBF1'
            },
            navy: {
              light: '#FFFFFF',
              base: '#F8F6F1',
              dark: '#CFC19F'
            },
            teal: {
              light: '#FEFEFC',
              base: '#EDDEA9',
              dark: '#DBBD55'
            },
            green: {
              light: '#FDE0D3',
              base: '#FBA279',
              dark: '#F8631E'
            }
          },
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
