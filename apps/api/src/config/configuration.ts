export default () => {
  // 关键凭据缺失时快速失败，杜绝回退到代码里的公开默认值
  if (!process.env.JWT_SECRET) {
    throw new Error('缺少 JWT_SECRET：请在 .env.local 中配置（可用 openssl rand -hex 32 生成）');
  }
  return {
  database: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '3306', 10),
    username: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASSWORD || '',
    name: process.env.DATABASE_NAME || 'online_school',
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '2h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  email: {
    provider: process.env.EMAIL_PROVIDER || 'mock',
    accessKeyId: process.env.ALIYUN_EMAIL_ACCESS_KEY_ID || '',
    accessKeySecret: process.env.ALIYUN_EMAIL_ACCESS_KEY_SECRET || '',
    accountName: process.env.ALIYUN_EMAIL_ACCOUNT_NAME || '',
    fromAlias: process.env.ALIYUN_EMAIL_FROM_ALIAS || '网校',
  },
  wechat: {
    appid: process.env.WECHAT_APPID || '',
    secret: process.env.WECHAT_SECRET || '',
  },
  oss: {
    accessKeyId: process.env.ALI_OSS_ACCESS_KEY_ID || '',
    accessKeySecret: process.env.ALI_OSS_ACCESS_KEY_SECRET || '',
    bucket: process.env.ALI_OSS_BUCKET || '',
    region: process.env.ALI_OSS_REGION || '',
    // STS AssumeRole 所需 RAM 角色 ARN，缺失则上传走 mock 模式
    roleArn: process.env.ALI_STS_ROLE_ARN || '',
    // mock 模式下生成绝对 URL 用的对外基地址；缺省回退请求 origin
    publicBaseUrl: process.env.PUBLIC_BASE_URL || '',
  },
  };
};
