
const log4js = require('log4js');
log4js.configure({
  appenders: { logs: { type: 'file', filename: 'logs.log' } },
  categories: { default: { appenders: ['logs'], level: 'info' } }
});
const logger = log4js.getLogger('cheese');
var watchman = require('fb-watchman');
var client = new watchman.Client();

var dir_of_interest = "G:\\我的雲端硬碟\\igphoto";//G:\\我的雲端硬碟\\igphoto

client.capabilityCheck({optional:[]},
  function (error, resp) {
    if (error) {
      console.log(error);
      client.end();
      return;
    }

    // Initiate the watch
    client.command(['watch-project', dir_of_interest],
      function (error, resp) {
        if (error) {
          console.error('Error initiating watch:', error);
          return;
        }

        // It is considered to be best practice to show any 'warning' or
        // 'error' information to the user, as it may suggest steps
        // for remediation
        if ('warning' in resp) {
          console.log('warning: ', resp.warning);
        }

        // `watch-project` can consolidate the watch for your
        // dir_of_interest with another watch at a higher level in the
        // tree, so it is very important to record the `relative_path`
        // returned in resp

        console.log('watch established on ', resp.watch,
                    ' relative_path', resp.relative_path);
                    make_subscription(client,resp.watch,'\\')          
      });
  });


  // `watch` is obtained from `resp.watch` in the `watch-project` response.
// `relative_path` is obtained from `resp.relative_path` in the
// `watch-project` response.
function make_subscription(client, watch, relative_path) {
  sub = {
    // Match any `.js` file in the dir_of_interest
   // expression: ["allof", ["match", "*.js"]],
    // Which fields we're interested in
    fields: ["name", "size", "mtime_ms", "exists", "type"]
  };
  if (relative_path) {
    sub.relative_root = relative_path;
  }

  client.command(['subscribe', watch, 'mysubscription', sub],
    function (error, resp) {
      if (error) {
        // Probably an error in the subscription criteria
        console.error('failed to subscribe: ', error);
        return;
      }
      console.log('subscription ' + resp.subscribe + ' established');
    });

  // Subscription results are emitted via the subscription event.
  // Note that this emits for all subscriptions.  If you have
  // subscriptions with different `fields` you will need to check
  // the subscription name and handle the differing data accordingly.
  // `resp`  looks like this in practice:
  //
  // { root: '/private/tmp/foo',
  //   subscription: 'mysubscription',
  //   files: [ { name: 'node_modules/fb-watchman/index.js',
  //       size: 4768,
  //       exists: true,
  //       type: 'f' } ] }
  client.on('subscription', function (resp) {
    console.log(resp)
    if (resp.subscription !== 'mysubscription') return;

    resp.files.forEach(async function (file) {
      // convert Int64 instance to javascript integer
      const mtime_ms = +file.mtime_ms;
      console.log(file);
      let logString=`${file.type==='d'?'資料夾':'檔案'} =>${file.name}(${file.exists?'修改':'刪除'} - ${mtime_ms})`
      console.log( logString);
      logger.info(logString);
      console.log('----------------------------------------');
    });
  });
}