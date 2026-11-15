import request from '@/utils/request';

export function getSalesWechat(): Promise<{ sales_wechat: string | null }> {
  return request.get('/admin/settings/sales-wechat');
}

export function saveSalesWechat(salesWechat: string): Promise<{ sales_wechat: string }> {
  return request.put('/admin/settings/sales-wechat', { sales_wechat: salesWechat });
}
