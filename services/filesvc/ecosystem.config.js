module.exports = {
  apps: [
    {
      name: "rms-filesvc",
      script: "/opt/rms-filesvc/server.js",
      exec_mode: "fork",
      instances: 1,
      watch: false,
      env: {
        HOST: "0.0.0.0",
        PORT: "8765",
        BASE_DIR: "/var/www/rmsbp/storage/Groups",
        FILESVC_SECRET: "supersecret_change_me"
      },
      max_memory_restart: "200M",
      time: true,
      out_file: "/var/log/rms-filesvc.out.log",
      error_file: "/var/log/rms-filesvc.err.log"
    }
  ]
};
