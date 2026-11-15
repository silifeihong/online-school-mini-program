# Spec Delta

## Purpose

用户认证系统提供小程序端和管理后台的身份验证能力，支持多种登录方式（邮箱注册、账号密码、微信一键登录）、Token 管理和密码重置功能，确保系统访问安全和用户体验。

## ADDED Requirements

### Requirement: 邮箱注册发送验证码
系统 SHALL 在用户请求邮箱注册时，向指定邮箱发送 6 位数字验证码，验证码有效期为 5 分钟，同一邮箱 60 秒内只能发送一次。

#### Scenario: 成功发送验证码
- **WHEN** 用户输入有效邮箱并请求发送验证码
- **THEN** 系统向该邮箱发送 6 位数字验证码，并返回成功响应

#### Scenario: 邮箱已注册
- **WHEN** 用户输入已注册的邮箱并请求发送验证码
- **THEN** 系统返回错误，提示邮箱已被注册

#### Scenario: 60 秒内重复发送
- **WHEN** 用户在 60 秒内再次请求发送验证码
- **THEN** 系统返回错误，提示发送过于频繁

### Requirement: 邮箱验证码校验
系统 SHALL 在用户提交邮箱注册信息时，验证邮箱验证码的正确性和有效期。

#### Scenario: 验证码正确且未过期
- **WHEN** 用户输入正确的 6 位验证码且验证码未过期
- **THEN** 系统验证通过，允许继续注册流程

#### Scenario: 验证码错误
- **WHEN** 用户输入错误的验证码
- **THEN** 系统返回错误，提示验证码不正确

#### Scenario: 验证码已过期
- **WHEN** 用户输入正确但已过期的验证码
- **THEN** 系统返回错误，提示验证码已过期

### Requirement: 邮箱注册创建用户
系统 SHALL 在用户完成邮箱验证、设置密码和昵称、并获取微信信息后，创建用户账户并关联微信。

#### Scenario: 注册成功
- **WHEN** 用户提交有效的邮箱、验证码、密码、昵称和微信 code
- **THEN** 系统创建用户账户，标记邮箱已验证，关联微信 openid，返回成功响应

#### Scenario: 微信 openid 已绑定其他账户
- **WHEN** 用户提交的微信 code 对应的 openid 已绑定其他账户
- **THEN** 系统返回错误，提示该微信已绑定其他账户

### Requirement: 账号密码登录
系统 SHALL 允许用户通过邮箱和密码进行登录，返回 JWT 双 Token。

#### Scenario: 登录成功
- **WHEN** 用户输入正确的邮箱和密码
- **THEN** 系统返回 access token（2小时有效期）和 refresh token（7天有效期）

#### Scenario: 密码错误
- **WHEN** 用户输入正确的邮箱但密码错误
- **THEN** 系统返回错误，提示账号或密码错误

#### Scenario: 账户已禁用
- **WHEN** 用户账户状态为禁用
- **THEN** 系统返回错误，提示账户已被禁用

### Requirement: 微信一键登录
系统 SHALL 允许用户通过微信 code 进行登录，未注册用户需绑定邮箱。

#### Scenario: 已注册用户微信登录
- **WHEN** 用户通过微信 code 登录且该 openid 已注册
- **THEN** 系统返回 access token 和 refresh token

#### Scenario: 未注册用户微信登录
- **WHEN** 用户通过微信 code 登录且该 openid 未注册
- **THEN** 系统返回需要绑定邮箱的标识，引导用户进入绑定流程

### Requirement: 微信登录绑定邮箱
系统 SHALL 在微信新用户登录时，要求用户绑定邮箱，完成注册流程。

#### Scenario: 绑定邮箱成功
- **WHEN** 微信新用户输入有效邮箱、验证码、密码和昵称
- **THEN** 系统创建用户账户，关联微信 openid，返回 token

#### Scenario: 邮箱已注册
- **WHEN** 用户输入已注册的邮箱
- **THEN** 系统返回错误，提示邮箱已被注册

### Requirement: 忘记密码发送验证码
系统 SHALL 在用户请求重置密码时，向注册邮箱发送验证码。

#### Scenario: 成功发送验证码
- **WHEN** 用户输入注册邮箱并请求发送验证码
- **THEN** 系统向该邮箱发送 6 位数字验证码

#### Scenario: 邮箱未注册
- **WHEN** 用户输入未注册的邮箱
- **THEN** 系统返回错误，提示邮箱未注册

### Requirement: 重置密码
系统 SHALL 在用户提交验证码和新密码后，重置用户密码。

#### Scenario: 重置成功
- **WHEN** 用户输入正确的验证码和新密码
- **THEN** 系统更新用户密码，返回成功响应

#### Scenario: 验证码错误
- **WHEN** 用户输入错误的验证码
- **THEN** 系统返回错误，提示验证码不正确

### Requirement: 刷新 Token
系统 SHALL 在 refresh token 有效期内，允许用户刷新 access token。

#### Scenario: 刷新成功
- **WHEN** 用户提交有效的 refresh token
- **THEN** 系统返回新的 access token 和 refresh token

#### Scenario: refresh token 已过期
- **WHEN** 用户提交已过期的 refresh token
- **THEN** 系统返回错误，提示需要重新登录

### Requirement: 管理员登录
系统 SHALL 允许管理员通过用户名和密码登录管理后台。

#### Scenario: 登录成功
- **WHEN** 管理员输入正确的用户名和密码
- **THEN** 系统返回 access token 和 refresh token

#### Scenario: 密码错误
- **WHEN** 管理员输入错误的密码
- **THEN** 系统返回错误，提示账号或密码错误

### Requirement: 退出登录
系统 SHALL 允许用户在客户端退出登录：清除本地存储的 access token 与 refresh token 并回到登录页。服务端不维护 token 黑名单，已签发的 token 在有效期内自然失效。

#### Scenario: 退出成功
- **WHEN** 用户在"我的"页面点击退出登录
- **THEN** 客户端清除本地 token 与用户状态，跳转到登录页

#### Scenario: 已签发 token 不即时作废
- **WHEN** 用户退出登录后，其此前签发的 token 仍在有效期内
- **THEN** 服务端不主动作废该 token（无黑名单机制），到期后自动失效

### Requirement: Token 自动刷新
系统 SHALL 在收到 401 响应时，自动使用 refresh token 刷新 access token 并重试请求。

#### Scenario: 自动刷新成功
- **WHEN** 请求返回 401 且 refresh token 有效
- **THEN** 系统自动刷新 token 并重试原请求

#### Scenario: 刷新失败需重新登录
- **WHEN** 请求返回 401 且 refresh token 无效或已过期
- **THEN** 系统跳转到登录页
