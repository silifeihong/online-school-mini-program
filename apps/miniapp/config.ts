/**
 * 小程序全局环境配置
 *
 * 切换 ENV 即可在开发/生产 API 地址间切换；
 * dev 地址为本机局域网 IP，仅用于开发者工具/真机调试，请勿在正式发布时使用。
 */

type EnvName = 'dev' | 'prod';

/** 当前环境：发布前改为 'prod' 并填写正式域名（需在微信公众平台配置 request 合法域名） */
export const ENV: EnvName = 'dev';

const API_HOSTS: Record<EnvName, string> = {
  dev: 'http://192.168.31.154:3000',
  prod: '', // TODO: 填写正式环境 API 域名（https）
};

/** API 基础地址（含版本前缀） */
export const BASE_URL = `${API_HOSTS[ENV]}/api/v1`;
