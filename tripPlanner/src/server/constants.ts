import { DEV_SERVER_PORT, IS_DEV, DEV_SERVER_HTTPS_PORT, APP_NAME } from '../../vite.config';
export const SERVER_PORT: number = IS_DEV ? DEV_SERVER_PORT : 3001;
export const IS_RENDER_TO_STREAM: boolean = true;
export const DEV_HTTPS_SERVER:Number = DEV_SERVER_HTTPS_PORT;
export const STATS_FILE_PATH:string = `./${APP_NAME}/stats.json`;
export const KEY_FILE_PATH:string = IS_DEV?'./config/dev.yatra.com-key.pem':'';
export const CERT_FILE_PATH:string = IS_DEV?'./config/dev.yatra.com.pem':'';