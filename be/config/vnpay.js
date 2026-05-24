import environment from './environment.js';
import moment from 'moment'
import qs from 'qs'
import crypto from 'crypto'

class VNPayHelper {
    static buildPaymentUrl(orderId, amount, paymentId) {
        const createDate = moment.utc.format('YYYYMMDDHHmmss');
        const expireDate = moment.utc.add(15, 'minutes').format('YYYYMMDDHHmmss');

        const vnp_Params = {
            vnp_Version: '2.1.0',
            vnp_Command: 'pay',
            vnp_TmnCode: environment.vnp_TmnCode,
            vnp_ExpireDate: expireDate,
            vnp_Locale: 'vn',
            vnp_CurrCode: 'VND',
            vnp_TxnRef: paymentId.toString(), 
            vnp_OrderInfo: 'hi',
            vnp_OrderType: "food",
            vnp_Amount: amount * 100, 
            vnp_ReturnUrl: encodeURIComponent(environment.vnp_ReturnUrl),
            vnp_IpAddr: "20.255.57.186",
            vnp_CreateDate: createDate,
        };

        const sortedParams = Object.keys(vnp_Params)
            .sort()
            .reduce((acc, key) => {
                acc[key] = vnp_Params[key];
                return acc;
            }, {});

        const signData = qs.stringify(sortedParams, { encode: false });

        const hmac = crypto.createHmac('sha512', environment.vnp_HashSecret);

        const signed = hmac.update(signData).digest('hex');

        const allParams = {
            ...sortedParams,
            vnp_SecureHash: signed, 
        };

        const paymentUrl = environment.vnp_Url + "?" + qs.stringify(allParams, { encode: false });

        return paymentUrl;
    }

    static verifySignature(vnp_Params) {
        const secureHash = vnp_Params['vnp_SecureHash'];
        
        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];
    
        const sortedParams = Object.keys(vnp_Params)
            .sort()
            .reduce((acc, key) => {
                acc[key] = vnp_Params[key];
                return acc;
            }, {});
    
        const signData = qs.stringify(sortedParams, { encode: false });
    
        const hmac = crypto.createHmac("sha512", environment.vnp_HashSecret);

        const signed = hmac.update(signData).digest("hex");

        return signed !== secureHash 
    }
}

export default VNPayHelper;