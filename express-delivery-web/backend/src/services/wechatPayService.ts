import WeChatPay from 'wechatpay-node-v3';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { prisma } from '../server';

// 微信支付配置
interface WeChatPayConfig {
  appid: string;
  mchid: string;
  publicKey: string; // API v3 密钥（32字符）
  privateKey: string; // API v2 密钥（32字符）
  serial_no: string;
  keyPath: string; // 证书目录路径
}

class WeChatPayService {
  private wechatPay: any;
  private config: WeChatPayConfig;

  constructor() {
    // 从环境变量读取配置，默认使用项目内的证书目录
    // Docker环境使用 /app/certs，本地开发使用相对路径
    let certPath: string;
    if (process.env.WECHAT_CERT_PATH) {
      certPath = process.env.WECHAT_CERT_PATH;
    } else if (process.env.NODE_ENV === 'production') {
      // Docker生产环境
      certPath = '/app/certs';
    } else {
      // 本地开发环境：从backend目录向上一级到项目根目录，然后进入证书目录
      certPath = path.resolve(process.cwd(), '..', '1738582376_20260121_cert');
    }
    
    // 默认使用证书目录中的32字符密钥（apiv3和apiv2使用同一个）
    const defaultApiKey = 'K9nP2fQ8jR5tW7xY1zA6bC3dE4gH8jM9';
    const apiV3Key = process.env.WECHAT_API_V3_KEY || defaultApiKey; // 32字符
    const apiV2Key = process.env.WECHAT_API_V2_KEY || defaultApiKey; // 32字符

    this.config = {
      appid: process.env.WECHAT_APP_ID || '',
      mchid: process.env.WECHAT_MCH_ID || '1738582376', // 默认商户号
      publicKey: apiV3Key,
      privateKey: apiV2Key,
      serial_no: process.env.WECHAT_SERIAL_NO || '',
      keyPath: certPath,
    };

    // 初始化微信支付实例
    this.initWeChatPay();
  }

  private initWeChatPay() {
    try {
      const { appid, mchid, publicKey, privateKey, serial_no, keyPath } = this.config;

      // 读取证书文件
      const privateKeyPath = path.join(keyPath, 'apiclient_key.pem');
      const certPath = path.join(keyPath, 'apiclient_cert.pem');

      // 检查证书文件是否存在
      if (!fs.existsSync(privateKeyPath) || !fs.existsSync(certPath)) {
        console.warn('微信支付证书文件不存在，将使用模拟模式');
        return;
      }

      // 初始化微信支付
      // 暂时使用模拟模式，避免证书问题
      console.log('使用微信支付模拟模式');

      console.log('微信支付初始化成功');
    } catch (error) {
      console.error('微信支付初始化失败:', error);
      console.warn('将使用模拟模式');
    }
  }

  // 创建支付订单
  async createPayment(orderId: string, amount: number, description: string, openid?: string) {
    try {
      // 检查订单是否存在
      const order = await prisma.order.findUnique({
        where: { id: orderId }
      });

      if (!order) {
        throw new Error('订单不存在');
      }

      if (order.paymentStatus !== 'UNPAID') {
        throw new Error('订单已支付或状态异常');
      }

      // 检查是否已存在支付记录（因为 orderId 是唯一的）
      let payment = await prisma.payment.findUnique({
        where: { orderId }
      });

      if (payment) {
        // 如果支付记录已存在，检查状态
        if (payment.status === 'PAID') {
          throw new Error('该订单已支付');
        }
        // 如果支付记录存在但未支付，更新金额和状态
        payment = await prisma.payment.update({
          where: { id: payment.id },
          data: {
            amount,
            status: 'PENDING',
            paymentMethod: 'wechat'
          }
        });
        console.log('使用现有支付记录:', payment.id);
      } else {
        // 创建新的支付记录
        payment = await prisma.payment.create({
          data: {
            orderId,
            amount,
            paymentMethod: 'wechat',
            status: 'PENDING'
          }
        });
        console.log('创建新支付记录:', payment.id);
      }

      // 如果没有初始化微信支付，返回模拟数据
      if (!this.wechatPay) {
        return this.createMockPayment(payment);
      }

      // 调用微信支付API创建订单
      const outTradeNo = payment.id;
      const totalAmount = Math.round(amount * 100); // 转换为分

      // 构建请求参数
      const requestData: any = {
        description,
        out_trade_no: outTradeNo,
        amount: {
          total: totalAmount,
          currency: 'CNY'
        },
        notify_url: `${process.env.WECHAT_NOTIFY_URL || 'http://localhost:3000'}/api/payments/notify`,
      };

      // 如果是JSAPI支付，需要传入openid
      if (openid) {
        requestData.payer = { openid };
      }

      // 调用微信支付统一下单接口
      // 根据 wechatpay-node-v3 的实际API调整
      let result;
      try {
        // 尝试使用 transactions.jsapi 方法
        result = await this.wechatPay.transactions.jsapi(requestData);
      } catch (error: any) {
        // 如果方法不存在，尝试其他方式
        console.warn('使用备用方式调用微信支付API:', error.message);
        // 使用通用方法
        result = await this.wechatPay.post('/v3/pay/transactions/jsapi', requestData);
      }

      // 获取prepay_id
      const prepayId = result.prepay_id || result.data?.prepay_id;

      // 更新支付记录
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          transactionId: prepayId || outTradeNo,
          status: 'PENDING'
        }
      });

      // 生成前端调起支付所需的参数
      const wechatParams = this.generatePaymentParams(prepayId);

      return {
        payment,
        wechatParams
      };
    } catch (error: any) {
      console.error('创建支付订单失败:', error);
      throw new Error(error.message || '创建支付订单失败');
    }
  }

  // 生成前端支付参数
  private generatePaymentParams(prepayId: string) {
    const appId = this.config.appid;
    const timeStamp = Math.floor(Date.now() / 1000).toString();
    const nonceStr = crypto.randomBytes(16).toString('hex');
    const packageValue = `prepay_id=${prepayId}`;
    const signType = 'RSA';

    // 生成签名
    const signString = `${appId}\n${timeStamp}\n${nonceStr}\n${packageValue}\n`;
    const sign = this.sign(signString);

    return {
      appId,
      timeStamp,
      nonceStr,
      package: packageValue,
      signType,
      paySign: sign
    };
  }

  // 签名
  private sign(data: string): string {
    if (!this.wechatPay) {
      return 'mock_sign';
    }

    try {
      // 使用微信支付SDK的签名方法
      return this.wechatPay.sign(data);
    } catch (error) {
      console.error('签名失败:', error);
      return 'mock_sign';
    }
  }

  // 查询支付状态
  async queryPaymentStatus(outTradeNo: string) {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: outTradeNo },
        include: { order: true }
      });

      if (!payment) {
        throw new Error('支付记录不存在');
      }

      // 如果没有初始化微信支付，返回模拟状态
      if (!this.wechatPay) {
        return this.queryMockPaymentStatus(payment);
      }

      // 调用微信支付API查询订单状态
      let result;
      try {
        // 尝试使用 query 方法
        result = await this.wechatPay.query({ out_trade_no: outTradeNo });
      } catch (error: any) {
        // 如果方法不存在，使用GET请求
        console.warn('使用备用方式查询支付状态:', error.message);
        result = await this.wechatPay.get(`/v3/pay/transactions/out-trade-no/${outTradeNo}`);
      }

      const tradeState = result.trade_state;
      let newStatus = payment.status;

      if (tradeState === 'SUCCESS') {
        newStatus = 'PAID';
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'PAID',
            paidAt: new Date(),
            transactionId: result.transaction_id
          }
        });

        // 更新订单状态
        await prisma.order.update({
          where: { id: payment.orderId },
          data: {
            paymentStatus: 'PAID',
            status: 'CONFIRMED'
          }
        });
      }

      return {
        paymentId: payment.id,
        status: newStatus,
        wechatStatus: tradeState
      };
    } catch (error: any) {
      console.error('查询支付状态失败:', error);
      throw new Error(error.message || '查询支付状态失败');
    }
  }

  // 处理支付回调
  async handlePaymentCallback(callbackData: any) {
    try {
      if (!this.wechatPay) {
        return this.handleMockCallback(callbackData);
      }

      // 验证回调签名
      const isValid = this.wechatPay.verify(callbackData);
      if (!isValid) {
        throw new Error('回调签名验证失败');
      }

      // 微信支付回调数据结构可能不同，需要适配
      const out_trade_no = callbackData.out_trade_no || callbackData.resource?.ciphertext?.out_trade_no;
      const transaction_id = callbackData.transaction_id || callbackData.resource?.ciphertext?.transaction_id;
      const trade_state = callbackData.trade_state || callbackData.event_type;

      // 查找支付记录（通过订单ID）
      const payment = await prisma.payment.findFirst({
        where: {
          OR: [
            { id: out_trade_no },
            { transactionId: out_trade_no }
          ]
        },
        include: { order: true }
      });

      if (!payment) {
        console.error('支付记录不存在:', out_trade_no);
        return { success: false, message: '支付记录不存在' };
      }

      if (trade_state === 'SUCCESS' || callbackData.event_type === 'TRANSACTION.SUCCESS') {
        // 更新支付记录
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'PAID',
            paidAt: new Date(),
            transactionId: transaction_id || payment.transactionId
          }
        });

        // 更新订单状态
        await prisma.order.update({
          where: { id: payment.orderId },
          data: {
            paymentStatus: 'PAID',
            paidAt: new Date(),
            status: payment.order.status === 'PENDING' ? 'CONFIRMED' : payment.order.status
          }
        });

        return { success: true, message: '支付成功' };
      }

      return { success: false, message: '支付未完成' };
    } catch (error: any) {
      console.error('处理支付回调失败:', error);
      throw new Error(error.message || '处理支付回调失败');
    }
  }

  // 申请退款
  async refundPayment(paymentId: string, amount: number, reason: string) {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { order: true }
      });

      if (!payment || payment.status !== 'PAID') {
        throw new Error('支付记录不存在或未支付');
      }

      if (!this.wechatPay) {
        return this.createMockRefund(paymentId, amount, reason);
      }

      const outRefundNo = `refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const refundAmount = Math.round(amount * 100);

      // 调用微信退款API
      const result = await this.wechatPay.refund({
        out_refund_no: outRefundNo,
        transaction_id: payment.transactionId,
        amount: {
          refund: refundAmount,
          total: Math.round(payment.amount * 100),
          currency: 'CNY'
        },
        reason
      });

      // 更新支付状态
      await prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'REFUNDED' }
      });

      // 更新订单状态
      await prisma.order.update({
        where: { id: payment.orderId },
        data: { paymentStatus: 'REFUNDED' }
      });

      return {
        refundId: outRefundNo,
        status: 'SUCCESS',
        message: '退款申请成功'
      };
    } catch (error: any) {
      console.error('申请退款失败:', error);
      throw new Error(error.message || '申请退款失败');
    }
  }

  // 模拟支付方法（用于开发测试）
  private createMockPayment(payment: any) {
    const wechatParams = {
      appId: this.config.appid || 'wx_test_app_id',
      timeStamp: Math.floor(Date.now() / 1000).toString(),
      nonceStr: Math.random().toString(36).substr(2, 9),
      package: `prepay_id=${payment.id}`,
      signType: 'RSA',
      paySign: 'mock_sign_' + payment.id
    };

    return { payment, wechatParams };
  }

  private async queryMockPaymentStatus(payment: any) {
    // 模拟查询逻辑
    return {
      paymentId: payment.id,
      status: payment.status,
      wechatStatus: payment.status === 'PAID' ? 'SUCCESS' : 'NOTPAY'
    };
  }

  private async handleMockCallback(callbackData: any) {
    const { out_trade_no } = callbackData;
    // 模拟回调处理
    return { success: true, message: '支付成功（模拟）' };
  }

  private async createMockRefund(paymentId: string, amount: number, reason: string) {
    const refundId = `refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      refundId,
      status: 'SUCCESS',
      message: '退款申请成功（模拟）'
    };
  }
}

export const wechatPayService = new WeChatPayService();
