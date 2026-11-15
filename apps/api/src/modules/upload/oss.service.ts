import { BadGatewayException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomUUID } from 'crypto';
import { ErrorCode } from '@online-school/shared-types';

export interface StsCredentials {
  accessKeyId: string;
  accessKeySecret: string;
  securityToken: string;
  expiration: string;
}

/**
 * 阿里云 OSS/STS 轻量封装：不引入 SDK，用 node:crypto 手动签名。
 * - STS AssumeRole（RPC 风格 HMAC-SHA1 签名）→ 小程序直传临时凭证
 * - OSS V1 GET 签名 → 播放/下载临时 URL
 */
@Injectable()
export class OssService {
  constructor(private readonly config: ConfigService) {}

  private get accessKeyId() {
    return this.config.get<string>('oss.accessKeyId') || '';
  }
  private get accessKeySecret() {
    return this.config.get<string>('oss.accessKeySecret') || '';
  }
  private get bucket() {
    return this.config.get<string>('oss.bucket') || '';
  }
  private get region() {
    return this.config.get<string>('oss.region') || '';
  }
  private get roleArn() {
    return this.config.get<string>('oss.roleArn') || '';
  }

  /** OSS 直传与签名是否可用（STS 还需额外配置 roleArn） */
  get isOssConfigured(): boolean {
    return Boolean(this.accessKeyId && this.accessKeySecret && this.bucket && this.region);
  }

  get isStsConfigured(): boolean {
    return this.isOssConfigured && Boolean(this.roleArn);
  }

  /** 判断存储的 file_url 是否指向本 OSS bucket（mock 本地 URL 返回 false） */
  isOssUrl(fileUrl: string): boolean {
    if (!this.isOssConfigured) return false;
    try {
      const url = new URL(fileUrl);
      return url.hostname === `${this.bucket}.${this.region}.aliyuncs.com`;
    } catch {
      return false;
    }
  }

  private percentEncode(value: string): string {
    return encodeURIComponent(value)
      .replace(/\+/g, '%20')
      .replace(/\*/g, '%2A')
      .replace(/%7E/g, '~');
  }

  /**
   * STS AssumeRole，签发仅允许向 `${prefix}/` 下 PutObject 的临时凭证。
   */
  async assumeRole(prefix: string, durationSeconds = 900): Promise<StsCredentials> {
    const policy = JSON.stringify({
      Version: '1',
      Statement: [
        {
          Effect: 'Allow',
          Action: ['oss:PutObject'],
          Resource: [`acs:oss:*:*:${this.bucket}/${prefix}/*`],
        },
      ],
    });

    const params: Record<string, string> = {
      Action: 'AssumeRole',
      Version: '2015-04-01',
      Format: 'JSON',
      AccessKeyId: this.accessKeyId,
      SignatureMethod: 'HMAC-SHA1',
      SignatureVersion: '1.0',
      SignatureNonce: randomUUID(),
      Timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
      DurationSeconds: String(durationSeconds),
      RoleArn: this.roleArn,
      RoleSessionName: 'online-school-upload',
      Policy: policy,
    };

    const canonical = Object.keys(params)
      .sort()
      .map((k) => `${this.percentEncode(k)}=${this.percentEncode(params[k])}`)
      .join('&');
    const stringToSign = `GET&${this.percentEncode('/')}&${this.percentEncode(canonical)}`;
    const signature = createHmac('sha1', `${this.accessKeySecret}&`)
      .update(stringToSign)
      .digest('base64');

    // 配置的 region 为 OSS 风格（oss-cn-hangzhou），STS 端点需去掉 oss- 前缀
    const stsRegion = this.region.replace(/^oss-/, '');
    const endpoint = `https://sts.${stsRegion}.aliyuncs.com/?${canonical}&Signature=${this.percentEncode(signature)}`;
    let body: any;
    try {
      const res = await fetch(endpoint);
      const text = await res.text();
      try {
        body = JSON.parse(text);
      } catch {
        // 阿里云错误可能以 XML 返回，提取 Code/Message
        const code = text.match(/<Code>([^<]+)<\/Code>/)?.[1];
        const msg = text.match(/<Message>([^<]+)<\/Message>/)?.[1];
        throw new Error(code ? `${code}${msg ? `: ${msg}` : ''}` : `STS HTTP ${res.status}`);
      }
      if (!res.ok || !body?.Credentials) {
        throw new Error(
          `${body?.Code || ''}${body?.Message ? `: ${body.Message}` : ''}`.trim() ||
            `STS HTTP ${res.status}`,
        );
      }
    } catch (err) {
      throw new BadGatewayException({
        code: ErrorCode.UNKNOWN_ERROR,
        message: `获取上传凭证失败: ${err instanceof Error ? err.message : String(err)}`,
      });
    }

    return {
      accessKeyId: body.Credentials.AccessKeyId,
      accessKeySecret: body.Credentials.AccessKeySecret,
      securityToken: body.Credentials.SecurityToken,
      expiration: body.Credentials.Expiration,
    };
  }

  /**
   * OSS V1 签名 GET URL。非本 bucket 的 URL（mock 本地文件）原样返回。
   */
  signGetUrl(fileUrl: string, expiresInSeconds = 3600): string {
    if (!this.isOssUrl(fileUrl)) {
      return fileUrl;
    }
    const url = new URL(fileUrl);
    const objectKey = decodeURIComponent(url.pathname).replace(/^\//, '');
    const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const stringToSign = `GET\n\n\n${expires}\n/${this.bucket}/${objectKey}`;
    const signature = createHmac('sha1', this.accessKeySecret)
      .update(stringToSign)
      .digest('base64');
    url.searchParams.set('OSSAccessKeyId', this.accessKeyId);
    url.searchParams.set('Expires', String(expires));
    url.searchParams.set('Signature', signature);
    return url.toString();
  }
}
