const path = require('path')
const preprocess = require('svelte-preprocess')
const { ESBuildPlugin } = require('esbuild-loader')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const { 
    MiniHtmlWebpackPlugin,
    generateAttributes,
    generateCSSReferences,
    generateJSReferences 
} = require('mini-html-webpack-plugin')
const { WebpackPluginServe } = require('webpack-plugin-serve')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const WebpackBar = require('webpackbar')
const DotenvPlugin = require('dotenv-webpack')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')

exports.devServer = () => ({
  watch: true,
  plugins: [
    new WebpackPluginServe({
      port: 3003,
      static: path.resolve(process.cwd(), 'dist'),
      historyFallback: true
    })
  ]
})

exports.page = ({ title }) => ({
  plugins: [new MiniHtmlWebpackPlugin({ publicPath: '', context: { title },
        template: ({
            css,
            js,
            publicPath,
            title,
            htmlAttributes,
            cssAttributes,
            jsAttributes
        }) => {
            const htmlAttrs = generateAttributes(htmlAttributes);

            const cssTags = generateCSSReferences({
                files: css,
                attributes: cssAttributes,
                publicPath
            });

            const jsTags = generateJSReferences({
                files: js,
                attributes: jsAttributes,
                publicPath
            });

            return `<!DOCTYPE html>
                <html${htmlAttrs}>
                <head>
                    <meta charset="UTF-8">
                    <title>${title}</title>
                    ${cssTags}
                </head>
                <body>
                    <div id="local-payment-wrapper"></div>
                    ${jsTags}
                    <script type="text/javascript">
                        const wrapper = document.getElementById('local-payment-wrapper');

                        document.addEventListener("DOMContentLoaded", () => {
                            loadSvelteElement(wrapper, { name: 'Dinamic' });
                        });
                    </script>
                </body>
                <style>
                    #local-payment-wrapper {
                        display: flex;
                        justify-content: center;
                    }
                </style>
                </html>`
            ;
        }
    })]
})

exports.generateSourceMaps = ({ type }) => ({ devtool: type })

exports.loadImages = ({ limit } = {}) => ({
  module: {
    rules: [
      {
        test: /\.(png|jpg|gif|webp)$/,
        type: 'asset',
        parser: { dataUrlCondition: { maxSize: limit } }
      }
    ]
  }
})

exports.optimize = () => ({
  optimization: {
    minimize: true,
    minimizer: [`...`, new CssMinimizerPlugin()]
  }
})

exports.analyze = () => ({
  plugins: [
    new BundleAnalyzerPlugin({
      generateStatsFile: true
    })
  ]
})

exports.typescript = () => ({
  module: { rules: [{ test: /\.ts$/, use: 'ts-loader', exclude: /node_modules/ }] }
})

exports.loadSvg = () => ({
  module: { rules: [{ test: /\.svg$/, type: 'asset' }] }
})

exports.postcss = () => ({
  loader: 'postcss-loader'
})

exports.extractCSS = ({ options = {}, loaders = [] } = {}) => {
  return {
    module: {
      rules: [
        {
          test: /\.(p?css)$/,
          use: [{ loader: MiniCssExtractPlugin.loader, options }, 'css-loader'].concat(
            loaders
          ),
          sideEffects: true
        }
      ]
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: '[name].css'
      })
    ]
  }
}

exports.svelte = mode => {
  const prod = mode === 'production'

  return {
    resolve: {
      alias: {
        svelte: path.dirname(require.resolve('svelte/package.json'))
      },
      extensions: ['.mjs', '.js', '.svelte', '.ts'],
      mainFields: ['svelte', 'browser', 'module', 'main']
    },
    module: {
      rules: [
        {
          test: /\.svelte$/,
          use: {
            loader: 'svelte-loader',
            options: {
              compilerOptions: {
                dev: !prod
              },
              emitCss: false,
              hotReload: !prod,
              preprocess: preprocess({
                postcss: true,
                typescript: true
              })
            }
          }
        },
        {
          test: /node_modules\/svelte\/.*\.mjs$/,
          resolve: {
            fullySpecified: false
          }
        }
      ]
    }
  }
}

exports.esbuild = () => {
  return {
    module: {
      rules: [
        {
          test: /\.js$/,
          loader: 'esbuild-loader',
          options: {
            target: 'es2015'
          }
        },
        {
          test: /\.ts$/,
          loader: 'esbuild-loader',
          options: {
            loader: 'ts',
            target: 'es2015'
          }
        }
      ]
    },
    plugins: [new ESBuildPlugin()]
  }
}

exports.cleanDist = () => ({
  plugins: [new CleanWebpackPlugin()]
})

exports.useWebpackBar = () => ({
  plugins: [new WebpackBar()]
})

exports.useDotenv = () => ({
  plugins: [new DotenvPlugin()]
})
