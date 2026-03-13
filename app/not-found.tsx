import { Result } from "antd"
import GradientButton from "@/components/gradient-button"

export default function NotFound() {
  return (
    <Result
      status="404"
      title="404"
      subTitle="抱歉，您访问的页面不存在。"
      classNames={{
        root: "pt-[10%]!",
      }}
      extra={
        <GradientButton gradient="primary" href="/image-gen">
          返回首页
        </GradientButton>
      }
    />
  )
}