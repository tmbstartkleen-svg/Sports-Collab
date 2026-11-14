// Security response headers for public read-only app and API routes.
// No inline third-party script or remote AI SDK is loaded.
export default {
  async headers() {
    return [
      {source:'/(.*)',headers:[
        {key:'X-Content-Type-Options',value:'nosniff'},
        {key:'Referrer-Policy',value:'no-referrer'},
        {key:'X-Frame-Options',value:'DENY'},
        {key:'Permissions-Policy',value:'camera=(), microphone=(), geolocation=(), payment=()'},
        {key:'Strict-Transport-Security',value:'max-age=31536000; includeSubDomains'}
      ]}
    ];
  }
};
