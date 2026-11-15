import request from './request';

export type UploadKind = 'cover' | 'video' | 'document' | 'material';

export interface UploadResult {
  url: string;
  filename: string;
  size: number;
}

interface StsCredentials {
  accessKeyId: string;
  accessKeySecret: string;
  securityToken: string;
  expiration: string;
}

type StsResponse =
  | {
      mode: 'oss';
      credentials: StsCredentials;
      bucket: string;
      region: string;
      prefix: string;
    }
  | { mode: 'mock' };

/** 前端大小限制：图片 30MB、视频 500MB、文档/资料 100MB */
const SIZE_LIMITS: Record<UploadKind, number> = {
  cover: 30 * 1024 * 1024,
  video: 500 * 1024 * 1024,
  document: 100 * 1024 * 1024,
  material: 100 * 1024 * 1024,
};

export const SIZE_HINTS: Record<UploadKind, string> = {
  cover: '建议 16:9，支持 JPG / PNG，最大 30MB',
  video: '支持 MP4，最大 500MB',
  document: '支持 PDF / Word / PPT，最大 100MB',
  material: '支持 PDF / Word / PPT，最大 100MB',
};

// STS 凭证缓存（有效期内复用，避免每次上传都 AssumeRole）
let stsCache: { kind: UploadKind; data: StsResponse; fetchedAt: number } | null = null;

async function getSts(kind: UploadKind): Promise<StsResponse> {
  const cached = stsCache;
  if (
    cached &&
    cached.kind === kind &&
    cached.data.mode === 'oss' &&
    Date.now() - cached.fetchedAt < 10 * 60 * 1000
  ) {
    return cached.data;
  }
  const data = await request.post<StsResponse>('/admin/uploads/sts', { kind });
  stsCache = { kind, data, fetchedAt: Date.now() };
  return data;
}

/** Web Crypto HMAC-SHA1 → base64 */
async function hmacSha1Base64(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  const bytes = new Uint8Array(sig);
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

function formatSize(size: number): string {
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)}MB`;
  if (size >= 1024) return `${(size / 1024).toFixed(1)}KB`;
  return `${size}B`;
}

/** OSS 浏览器直传 PUT（手动 V1 签名 + STS token，XHR 以支持进度） */
function putToOss(
  sts: Extract<StsResponse, { mode: 'oss' }>,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const ext = file.name.includes('.') ? file.name.split('.').pop() : '';
      const key = `${sts.prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext ? `.${ext}` : ''}`;
      const contentType = file.type || 'application/octet-stream';
      const expires = Math.floor(Date.now() / 1000) + 900;
      // 浏览器禁止 XHR 设置 Date/Authorization 之外的受限头（Date 被静默忽略），
      // 故采用 URL 查询签名：security-token 作为子资源参与 CanonicalizedResource 签名
      const canonical = `/${sts.bucket}/${key}?security-token=${sts.credentials.securityToken}`;
      const stringToSign = `PUT\n\n${contentType}\n${expires}\n${canonical}`;
      const signature = await hmacSha1Base64(sts.credentials.accessKeySecret, stringToSign);

      const url = `https://${sts.bucket}.${sts.region}.aliyuncs.com/${key}`;
      const signedUrl =
        `${url}?OSSAccessKeyId=${encodeURIComponent(sts.credentials.accessKeyId)}` +
        `&Expires=${expires}` +
        `&Signature=${encodeURIComponent(signature)}` +
        `&security-token=${encodeURIComponent(sts.credentials.securityToken)}`;
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', signedUrl);
      xhr.setRequestHeader('Content-Type', contentType);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve(url);
        else reject(new Error(`OSS 上传失败 (${xhr.status})`));
      };
      xhr.onerror = () => reject(new Error('OSS 上传网络错误'));
      xhr.send(file);
    } catch (err) {
      reject(err);
    }
  });
}

/** mock 上传：multipart 落盘服务端 uploads/ */
function putToMock(kind: UploadKind, file: File): Promise<UploadResult> {
  const form = new FormData();
  form.append('kind', kind);
  form.append('file', file);
  return request.post('/admin/uploads/mock', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 0, // 大文件不设超时
  });
}

/**
 * 统一上传入口：先探测 STS，OSS 可用则浏览器直传（带进度），否则 mock 落盘。
 * 返回 { url, filename, size }，filename/size 用于表单回显。
 */
export async function uploadFile(
  kind: UploadKind,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<UploadResult> {
  const limit = SIZE_LIMITS[kind];
  if (file.size > limit) {
    throw new Error(`文件超过大小限制（${formatSize(limit)}）`);
  }

  const sts = await getSts(kind);
  if (sts.mode === 'oss') {
    const url = await putToOss(sts, file, onProgress);
    return { url, filename: file.name, size: file.size };
  }
  return putToMock(kind, file);
}

export { formatSize };
