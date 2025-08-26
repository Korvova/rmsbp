module.exports = {
  apps: [
    {
      name: 'filestash',
      script: '/var/www/rmsbp/filestash/filestash',
      args: '--port 8334 --config /var/www/rmsbp/config/filestash/config.json',
      env: { NODE_ENV: 'production' }
    },
    {
      name: 'rms-filesvc',
      script: '/usr/bin/node',
      args: '/var/www/rmsbp/services/filesvc/server.js',
      env: {
        NODE_ENV: 'production',
        HOST: '0.0.0.0',
        PORT: '8765',
        BASE_DIR: '/var/www/rmsbp/storage/Groups',
        FILESVC_SECRET: 'supersecret_change_me'
      }
    }
  ]
};
