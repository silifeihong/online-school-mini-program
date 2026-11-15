/**
 * 业务错误码定义
 */

export enum ErrorCode {
  // 通用错误 (10000-10999)
  SUCCESS = 0,
  UNKNOWN_ERROR = 10000,
  PARAM_ERROR = 10001,
  UNAUTHORIZED = 10002,
  FORBIDDEN = 10003,
  NOT_FOUND = 10004,

  // 认证相关 (11000-11999)
  EMAIL_EXISTS = 11000,
  EMAIL_NOT_VERIFIED = 11001,
  INVALID_CREDENTIALS = 11002,
  TOKEN_EXPIRED = 11003,
  TOKEN_INVALID = 11004,
  EMAIL_CODE_INVALID = 11005,
  EMAIL_CODE_EXPIRED = 11006,
  EMAIL_CODE_TOO_FREQUENT = 11007,

  // 用户相关 (12000-12999)
  USER_NOT_FOUND = 12000,
  USER_DISABLED = 12001,
  PROFILE_NOT_COMPLETED = 12002,

  // 管理员相关 (13000-13999)
  ADMIN_NOT_FOUND = 13000,
  ADMIN_DISABLED = 13001,

  // 学员相关 (14000-14999)
  STUDENT_NOT_FOUND = 14000,

  // 个人信息选项相关 (15000-15999)
  PROFILE_OPTION_EXISTS = 15000,
  PROFILE_OPTION_NOT_FOUND = 15001,

  // 课程相关 (16000-16999)
  COURSE_NOT_FOUND = 16001,
  COURSE_OFF_SHELF = 16002,
  COURSE_NOT_PURCHASED = 16003,
  CHAPTER_NOT_FOUND = 16004,
  ENROLLMENT_EXISTS = 16005,
  SALES_WECHAT_NOT_SET = 16006,
  MATERIAL_NOT_FOUND = 16007,
  MATERIAL_OFF_SHELF = 16008,
}

export const ErrorMessages: Record<ErrorCode, string> = {
  [ErrorCode.SUCCESS]: '成功',
  [ErrorCode.UNKNOWN_ERROR]: '未知错误',
  [ErrorCode.PARAM_ERROR]: '参数错误',
  [ErrorCode.UNAUTHORIZED]: '未授权',
  [ErrorCode.FORBIDDEN]: '禁止访问',
  [ErrorCode.NOT_FOUND]: '资源不存在',
  [ErrorCode.EMAIL_EXISTS]: '邮箱已存在',
  [ErrorCode.EMAIL_NOT_VERIFIED]: '邮箱未验证',
  [ErrorCode.INVALID_CREDENTIALS]: '账号或密码错误',
  [ErrorCode.TOKEN_EXPIRED]: 'Token 已过期',
  [ErrorCode.TOKEN_INVALID]: 'Token 无效',
  [ErrorCode.EMAIL_CODE_INVALID]: '验证码不正确',
  [ErrorCode.EMAIL_CODE_EXPIRED]: '验证码已过期',
  [ErrorCode.EMAIL_CODE_TOO_FREQUENT]: '验证码发送过于频繁',
  [ErrorCode.USER_NOT_FOUND]: '用户不存在',
  [ErrorCode.USER_DISABLED]: '账户已被禁用',
  [ErrorCode.PROFILE_NOT_COMPLETED]: '个人信息未完善',
  [ErrorCode.ADMIN_NOT_FOUND]: '管理员不存在',
  [ErrorCode.ADMIN_DISABLED]: '管理员已被禁用',
  [ErrorCode.STUDENT_NOT_FOUND]: '学员不存在',
  [ErrorCode.PROFILE_OPTION_EXISTS]: '同一分类下的选项名称已存在',
  [ErrorCode.PROFILE_OPTION_NOT_FOUND]: '选项不存在',
  [ErrorCode.COURSE_NOT_FOUND]: '课程不存在',
  [ErrorCode.COURSE_OFF_SHELF]: '课程已下架',
  [ErrorCode.COURSE_NOT_PURCHASED]: '尚未购买该课程',
  [ErrorCode.CHAPTER_NOT_FOUND]: '章节不存在',
  [ErrorCode.ENROLLMENT_EXISTS]: '该学员已在课程中',
  [ErrorCode.SALES_WECHAT_NOT_SET]: '销售微信号尚未配置，请联系管理员',
  [ErrorCode.MATERIAL_NOT_FOUND]: '资料不存在',
  [ErrorCode.MATERIAL_OFF_SHELF]: '资料已下架',
};
