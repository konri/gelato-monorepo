import FtpDeploy from 'ftp-deploy'
import dotenv from 'dotenv'
import process from 'process'

const FtpDeploy = require('ftp-deploy');
const ftpDeploy = new FtpDeploy();

const config = {
  user: process.env.FTP_USER,
  password: process.env.FTP_PASSWORD,
  host: process.env.FTP_HOST,
  port: 21,
  localRoot: __dirname + '/out', // Change from 'dist' to 'out'
  remoteRoot: '/path/to/remote',
  include: ['*', '**/*'],
  deleteRemote: true,
};

ftpDeploy.deploy(config, (err) => {
  if (err) console.error(err);
  else console.log('Deployed successfully!');
});
