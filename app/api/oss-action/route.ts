// app/api/qiniu-token/route.js
import { auth, rs } from 'qiniu';
import { NextResponse } from 'next/server';

//  POST 请求：前端调用这个接口获取七牛上传token
export async function POST() {
  try {
    // 从环境变量读取密钥（安全！）
    const accessKey = process.env.QINIU_ACCESS_KEY;
    const secretKey = process.env.QINIU_SECRET_KEY;
    const bucket = process.env.QINIU_BUCKET;

    // 七牛官方 SDK 生成 token
    const qiniuAuth = new auth.digest.Mac(accessKey, secretKey);
    const putPolicy =  new rs.PutPolicy({
      scope: bucket,
      expires: 3600, // 1小时有效期
    });

    const uploadToken = putPolicy.uploadToken(qiniuAuth);

    // 返回 token 给前端
    return NextResponse.json({ token: uploadToken });
  } catch (error) {
    return NextResponse.json({ error: '生成token失败' }, { status: 500 });
  }
}