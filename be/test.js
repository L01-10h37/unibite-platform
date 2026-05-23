import crypto from "crypto"

const signData = "vnp_Amount=9000000&vnp_Command=pay&vnp_CreateDate=20260505165509&vnp_CurrCode=VND&vnp_ExpireDate=20260505171009&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=hi&vnp_OrderType=food&vnp_ReturnUrl=http://localhost:8080/api/payments/vnpay-return&vnp_TmnCode=8I2R6WX1&vnp_TxnRef=69f9be7daba2d215a15020fa&vnp_Version=2.1.0";

const secret = "DHM1EU0E9JLQ0C7U2MV1J7AL4Q5X34AV";

const hash = crypto.createHmac('sha512', secret)
    .update(signData)
    .digest('hex');

console.log(hash);
// So sánh với: e927fffce4be6fbb5c3096964351bc293b228f18cfd2f0654debd07c4ec392e4baf67254ccde1b02df0845285dfa9299e52a41ba47b5cf20bf5826e034930687