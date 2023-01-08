const { spawn } = require('child_process'),
  { readFileSync } = require('fs-extra'),
  http = require('http'),
  axios = require('axios'),
  semver = require('semver'),
  logger = require('./utils/log'),
  config = require('./config.json'),
  dashboard = http.createServer(function (_0x15fcx12, _0x15fcx13) {
    _0x15fcx13.writeHead(200, 'Lisme', { 'Content-Type': 'text/plain' })
    _0x15fcx13.write(
      'Xin chào! Lisme-bot được dựa trên source code Miraiv2 được D-Jukie làm lại và duy trì bởi ItoKami.'
    )
    _0x15fcx13.end()
  })
dashboard.listen(8080)
logger('Opened server site...', '[ Starting ]')
function startBot(_0x15fcx20) {
  _0x15fcx20 ? logger(_0x15fcx20, '[ Starting ]') : ''
  const _0x15fcx30 = spawn(
    'node',
    ['--trace-warnings', '--async-stack-traces', 'main.js'],
    {
      cwd: __dirname,
      stdio: 'inherit',
      shell: true,
    }
  )
  _0x15fcx30.on('close', async (_0x15fcx31) => {
    var _0x15fcx34 = 'codeExit'.replace('codeExit', _0x15fcx31)
    if (_0x15fcx31 == 1) {
      return startBot('Restarting...')
    } else {
      if (_0x15fcx34.indexOf(2) == 0) {
        await new Promise((_0x15fcx35) => {
          return setTimeout(
            _0x15fcx35,
            parseInt(_0x15fcx34.replace(2, '')) * 1000
          )
        })
        startBot('Open ...')
      } else {
        return
      }
    }
  })
  _0x15fcx30.on('error', function (_0x15fcx36) {
    logger('An error occurred: ' + JSON.stringify(_0x15fcx36), '[ Starting ]')
  })
}
axios
  .get(
    'https://raw.githubusercontent.com/nlong5096/Lisme-Bot/main/package.json'
  )
  .then((_0x15fcx39) => {
    logger(_0x15fcx39.data.name, '[ NAME ]')
    logger('Version: ' + _0x15fcx39.data.version, '[ VERSION ]')
    logger(_0x15fcx39.data.description, '[ DESCRIPTION ]')
  })
startBot()
