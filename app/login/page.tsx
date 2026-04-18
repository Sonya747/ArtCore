'use client'

import { Suspense, useState, useCallback } from 'react'
import { Button, Form, Input, Tabs, App, Spin } from 'antd'
import { UserOutlined, LockOutlined, SmileOutlined } from '@ant-design/icons'
import { useRouter, useSearchParams } from 'next/navigation'
import { loginApi, registerApi } from '@/service/auth'
import { useGlobalStore } from '@/store/global'
import { ls } from '@/utils/localStorage'

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 z-9999 flex items-center justify-center bg-[#1a0533]">
        <Spin size="large" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}

function LoginContent() {
  const [activeTab, setActiveTab] = useState('login')
  const [loading, setLoading] = useState(false)
  const [loginForm] = Form.useForm()
  const [registerForm] = Form.useForm()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { message } = App.useApp()
  const setUserInfo = useGlobalStore((s) => s.setUserInfo)

  const redirect = searchParams.get('redirect') || '/'

  const handleLogin = useCallback(async (values: { username: string; password: string }) => {
    setLoading(true)
    try {
      const { user } = await loginApi(values)
      setUserInfo(user)
      ls.set('user_info', user)
      message.success('登录成功')
      router.replace(redirect)
    } catch (e) {
      message.error(e instanceof Error ? e.message : '登录失败')
    } finally {
      setLoading(false)
    }
  }, [redirect, router, message, setUserInfo])

  const handleRegister = useCallback(async (values: { username: string; password: string; display_name?: string }) => {
    setLoading(true)
    try {
      const { user } = await registerApi(values)
      setUserInfo(user)
      message.success('注册成功，欢迎加入！')
      router.replace(redirect)
    } catch (e) {
      message.error(e instanceof Error ? e.message : '注册失败')
    } finally {
      setLoading(false)
    }
  }, [redirect, router, message, setUserInfo])

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center overflow-hidden login-page-root">
      {/* Background */}
      <div className="absolute inset-0 bg-linear-to-br from-[#1a0533] via-[#2d1052] to-[#0f0a1e]">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-[40%] -left-[20%] w-[70vw] h-[70vw] rounded-full bg-primary-color/10 blur-[120px]" />
          <div className="absolute -bottom-[30%] -right-[10%] w-[50vw] h-[50vw] rounded-full bg-[#6b21a8]/10 blur-[100px]" />
          <div className="absolute top-[20%] right-[15%] w-[25vw] h-[25vw] rounded-full bg-[#c163fb]/5 blur-[80px]" />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-[420px] mx-4">
        {/* Brand */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold tracking-tight text-white mb-2">
            Art<span className="text-[#c163fb]">Core</span>
          </h1>
          <p className="text-white/40 text-sm">AI 素材管理平台</p>
        </div>

        {/* Form Card */}
        <div className="backdrop-blur-xl bg-white/6 border border-white/8 rounded-2xl p-8 shadow-2xl">
          <Tabs
            activeKey={activeTab}
            onChange={(key) => {
              setActiveTab(key)
              setLoading(false)
            }}
            centered
            items={[
              {
                key: 'login',
                label: <span className="text-white/80 text-base px-2">登录</span>,
                children: (
                  <Form
                    form={loginForm}
                    onFinish={handleLogin}
                    layout="vertical"
                    requiredMark={false}
                    className="mt-4"
                  >
                    <Form.Item
                      name="username"
                      rules={[{ required: true, message: '请输入用户名' }]}
                    >
                      <Input
                        prefix={<UserOutlined className="text-white/30" />}
                        placeholder="用户名"
                        size="large"
                        className="login-input"
                        autoComplete="username"
                      />
                    </Form.Item>

                    <Form.Item
                      name="password"
                      rules={[{ required: true, message: '请输入密码' }]}
                    >
                      <Input.Password
                        prefix={<LockOutlined className="text-white/30" />}
                        placeholder="密码"
                        size="large"
                        className="login-input"
                        autoComplete="current-password"
                      />
                    </Form.Item>

                    <Form.Item className="mb-0 mt-6">
                      <Button
                        type="primary"
                        htmlType="submit"
                        size="large"
                        block
                        loading={loading}
                        className="h-11 text-base font-medium rounded-lg"
                      >
                        登录
                      </Button>
                    </Form.Item>
                  </Form>
                ),
              },
              {
                key: 'register',
                label: <span className="text-white/80 text-base px-2">注册</span>,
                children: (
                  <Form
                    form={registerForm}
                    onFinish={handleRegister}
                    layout="vertical"
                    requiredMark={false}
                    className="mt-4"
                  >
                    <Form.Item
                      name="username"
                      rules={[
                        { required: true, message: '请输入用户名' },
                        { min: 2, message: '用户名至少 2 个字符' },
                        { max: 50, message: '用户名最多 50 个字符' },
                      ]}
                    >
                      <Input
                        prefix={<UserOutlined className="text-white/30" />}
                        placeholder="用户名"
                        size="large"
                        className="login-input"
                        autoComplete="username"
                      />
                    </Form.Item>

                    <Form.Item
                      name="display_name"
                    >
                      <Input
                        prefix={<SmileOutlined className="text-white/30" />}
                        placeholder="昵称（选填）"
                        size="large"
                        className="login-input"
                        autoComplete="name"
                      />
                    </Form.Item>

                    <Form.Item
                      name="password"
                      rules={[
                        { required: true, message: '请输入密码' },
                        { min: 6, message: '密码至少 6 个字符' },
                      ]}
                    >
                      <Input.Password
                        prefix={<LockOutlined className="text-white/30" />}
                        placeholder="密码"
                        size="large"
                        className="login-input"
                        autoComplete="new-password"
                      />
                    </Form.Item>

                    <Form.Item
                      name="confirm_password"
                      dependencies={['password']}
                      rules={[
                        { required: true, message: '请再次输入密码' },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (!value || getFieldValue('password') === value) {
                              return Promise.resolve()
                            }
                            return Promise.reject(new Error('两次输入的密码不一致'))
                          },
                        }),
                      ]}
                    >
                      <Input.Password
                        prefix={<LockOutlined className="text-white/30" />}
                        placeholder="确认密码"
                        size="large"
                        className="login-input"
                        autoComplete="new-password"
                      />
                    </Form.Item>

                    <Form.Item className="mb-0 mt-6">
                      <Button
                        type="primary"
                        htmlType="submit"
                        size="large"
                        block
                        loading={loading}
                        className="h-11 text-base font-medium rounded-lg"
                      >
                        注册
                      </Button>
                    </Form.Item>
                  </Form>
                ),
              },
            ]}
          />
        </div>

        {/* Footer */}
        <p className="text-center text-white/20 text-xs mt-8">
          © {new Date().getFullYear()} ArtCore
        </p>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .login-page-root .ant-tabs-nav::before {
          border-bottom-color: rgba(255, 255, 255, 0.08) !important;
        }
        .login-page-root .ant-tabs-ink-bar {
          background: #c163fb !important;
        }
        .login-page-root .ant-tabs-tab-active .ant-tabs-tab-btn span {
          color: #fff !important;
        }
        .login-page-root .login-input,
        .login-page-root .login-input .ant-input,
        .login-page-root .login-input .ant-input-password {
          background: rgba(255, 255, 255, 0.06) !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
          color: #fff !important;
        }
        .login-page-root .login-input:hover,
        .login-page-root .login-input:focus-within {
          border-color: rgba(193, 99, 251, 0.5) !important;
          background: rgba(255, 255, 255, 0.08) !important;
        }
        .login-page-root .login-input .ant-input::placeholder {
          color: rgba(255, 255, 255, 0.3) !important;
        }
        .login-page-root .login-input .ant-input-suffix .anticon {
          color: rgba(255, 255, 255, 0.3) !important;
        }
        .login-page-root .ant-form-item-explain-error {
          color: #ff7875 !important;
        }
        .login-page-root .ant-btn-primary {
          background: linear-gradient(135deg, #990dfb 0%, #c163fb 100%) !important;
          border: none !important;
          box-shadow: 0 4px 20px rgba(153, 13, 251, 0.3) !important;
        }
        .login-page-root .ant-btn-primary:hover:not(:disabled) {
          background: linear-gradient(135deg, #a82efb 0%, #cd7dfc 100%) !important;
          box-shadow: 0 6px 28px rgba(153, 13, 251, 0.45) !important;
        }
      ` }} />
    </div>
  )
}
