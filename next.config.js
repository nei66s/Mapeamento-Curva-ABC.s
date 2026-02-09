const path = require('path')

module.exports = {
	outputFileTracingRoot: path.resolve(__dirname),
	// change build output directory to avoid OneDrive locks on `.next`
	distDir: 'build',
}
