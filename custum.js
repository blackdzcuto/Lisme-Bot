module.exports = async ({ api }) => {
  const logger = require('./utils/log')
  const configCustom = {
    autoRestart: {
      status: true,
      time: 40, //40p
      note: '40p là hợp lí'
    },
    accpetPending: {
      status: true,
      time: 30,
      note: 'Cách 30p check tin nhắn 1 lần để giảm thiểu acc bot bị block'
    }
  }
  function autoRestart(config) {
    if(config.status) {
      setInterval(async () => {
        logger(`Để tránh lỗi xảy ra, hệ thống sẽ tự khởi động lại!`, `[CUSTOM]`)
        process.exit(1)
      }, config.time * 60 * 1000)
    }
  }
  function accpetPending(config) {
    if(config.status) {
      setInterval(async () => {
          const list = [
              ...(await api.getThreadList(1, null, ['PENDING'])),
              ...(await api.getThreadList(1, null, ['OTHER']))
          ];
          if (list[0]) {
              api.sendMessage('Đây là tin nhắn tự động!', list[0].threadID);
          }
      }, config.time * 60 * 1000)
    }
  }
  autoRestart(configCustom.autoRestart)
  accpetPending(configCustom.accpetPending)
};
