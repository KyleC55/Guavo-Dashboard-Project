const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
    app.use(
        '/api/adminGQL',
        createProxyMiddleware({
            target: 'http://localhost:8000',
            changeOrigin: true,
            pathRewrite: { '^/api/adminGQL': '/adminGQL' },
            onProxyReq(proxyReq, req) {
                const auth = req.headers['authorization'] || req.headers['Authorization'];
                if (auth) proxyReq.setHeader('authorization', auth);
                proxyReq.setHeader('x-apollo-operation-name', 'op');
            },
            logLevel: 'debug',
        })
    );
};
