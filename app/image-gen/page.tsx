"use client"

import { useDebounceFn } from "ahooks"
import { App, Form, Select, Switch } from "antd"
import axios from "axios"
import { useCallback, useLayoutEffect, useMemo, useState } from "react"
import GradientButton from "@/components/gradient-button"
import IconFont from "@/components/icon-font"
import ImageUploader from "@/components/image-uploader"
import type { ImageUploaderProps } from "@/components/image-uploader/types"
import PromptInput from "@/components/prompt-input"
import { doubaoImageGenerations } from "@/service/image-gen"
import { ls } from "@/utils/localStorage"
import { uploadRemoteImageUrlsToQiniu } from "@/utils/qiniu-upload"

type LegacyImageGenResult = {
  kind: "legacy"
  taskId: string
  createdAt: string
  model: string
  ratio: string
  count: number
  prompt: string
  negativePrompt: string
  images: string[]
}

type DoubaoImageGenResult = {
  kind: "doubao"
  model: string
  /** Unix 秒级时间戳 */
  created: number
  items: { url: string; size: string }[]
  usage?: {
    generated_images?: number
    output_tokens?: number
    total_tokens?: number
  }
  prompt: string
}

type ImageGenResult = LegacyImageGenResult | DoubaoImageGenResult

const DOUBAO_MODEL = "doubao-seedream-5-0-260128"

const DOUBAO_SEQUENTIAL_OPTIONS = [
  { label: "关闭连续出图", value: "disabled" },
  { label: "连续出图", value: "auto" },
]

const DOUBAO_RESPONSE_FORMAT_OPTIONS = [{ label: "URL", value: "url" }]

const DOUBAO_SIZE_OPTIONS = [
  { label: "2K", value: "2K" },
  { label: "1K", value: "1K" },
  { label: "512", value: "512" },
]

const RATIO_OPTIONS = [
  { label: "1:1", value: "1:1" },
  { label: "3:4", value: "3:4" },
  { label: "4:3", value: "4:3" },
  { label: "16:9", value: "16:9" },
]

const COUNT_OPTIONS = [
  { label: "1张", value: 1 },
  { label: "2张", value: 2 },
  { label: "4张", value: 4 },
  { label: "8张", value: 8 },
]

const MODEL_OPTIONS = [
  { label: "nano_banana_pro", value: "nano_banana_pro" },
  { label: "midjourney", value: "midjourney" },
  { label: "gpt4o", value: "gpt4o" },
  { label: "Doubao Seedream 5.0 Lite", value: DOUBAO_MODEL },
]

const LAST_MODEL_KEY = "image_gen_last_model"

/**
 * 获取上次使用的模型
 */
const getLastUsedModel = (): string => {
  const stored = ls.get(LAST_MODEL_KEY) as string | null
  if (stored) {
    return stored
  }
  return MODEL_OPTIONS[0].value
}

function parseImageGenResponse(
  raw: Record<string, unknown>,
  prompt: string,
  model: string,
): ImageGenResult | null {
  const data = raw?.data
  if (
    Array.isArray(data) &&
    data.length > 0 &&
    typeof data[0] === "object" &&
    data[0] !== null &&
    "url" in data[0] &&
    typeof (data[0] as { url: unknown }).url === "string"
  ) {
    return {
      kind: "doubao",
      model: typeof raw.model === "string" ? raw.model : model,
      created: typeof raw.created === "number" ? raw.created : Math.floor(Date.now() / 1000),
      items: data.map((item: { url: string; size?: string }) => ({
        url: item.url,
        size: typeof item.size === "string" ? item.size : "—",
      })),
      usage:
        raw.usage && typeof raw.usage === "object"
          ? (raw.usage as DoubaoImageGenResult["usage"])
          : undefined,
      prompt,
    }
  }

  if (
    typeof raw.taskId === "string" &&
    Array.isArray(raw.images) &&
    raw.images.every((u: unknown) => typeof u === "string")
  ) {
    return {
      kind: "legacy",
      taskId: raw.taskId,
      createdAt: String(raw.createdAt ?? ""),
      model: String(raw.model ?? ""),
      ratio: String(raw.ratio ?? ""),
      count: Number(raw.count ?? 0),
      prompt: String(raw.prompt ?? prompt),
      negativePrompt: String(raw.negativePrompt ?? ""),
      images: raw.images as string[],
    }
  }

  return null
}

function getResultImageUrls(data: ImageGenResult): string[] {
  if (data.kind === "doubao") {
    return data.items.map((item) => item.url)
  }
  return data.images
}

export default function Page() {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<ImageGenResult | null>(null)
  const [ossUpload, setOssUpload] = useState<
    | { status: "idle" }
    | { status: "uploading" }
    | { status: "success" }
    | { status: "failed"; error: string }
  >({ status: "idle" })

  const referenceImages = (Form.useWatch("referenceImages", form) as unknown[]) || []
  const model = Form.useWatch("model", form) ?? MODEL_OPTIONS[0].value

  useLayoutEffect(() => {
    const last = getLastUsedModel()
    if (last !== MODEL_OPTIONS[0].value) {
      form.setFieldsValue({ model: last })
    }
  }, [form])

  const isDoubaoModel = model === DOUBAO_MODEL //TODO之后改成映射

  const runOssUpload = useCallback(
    async (urls: string[]) => {
      if (urls.length === 0) {
        return
      }
      try {
        await uploadRemoteImageUrlsToQiniu(urls)
        setOssUpload({ status: "success" })
        message.success(`已上传 ${urls.length} 张至七牛云`)
      } catch (e) {
        const errMsg = e instanceof Error ? e.message : "七牛上传失败"
        setOssUpload({ status: "failed", error: errMsg })
        message.warning(`七牛上传失败：${errMsg}`)
      }
    },
    [message],
  )

  const handleRetryOssUpload = useCallback(() => {
    if (!result) {
      return
    }
    setOssUpload({ status: "uploading" })
    void runOssUpload(getResultImageUrls(result))
  }, [result, runOssUpload])

  const handleGenerate = () => {
    setIsLoading(true)
    form
      .validateFields()
      .then(async (values) => {
        if (values.model !== DOUBAO_MODEL) {
          message.info("尚未接入")
          return undefined
        }

        const apiKey = process.env.NEXT_PUBLIC_ARK_API_KEY
        if (!apiKey) {
          message.error("未配置环境变量 NEXT_PUBLIC_ARK_API_KEY")
          return undefined
        }

        try {
          const rawResponse = await doubaoImageGenerations(
            {
              model: values.model,
              prompt: values.prompt,
              sequential_image_generation:
                values.doubaoParams?.sequential_image_generation ?? "disabled",
              response_format: values.doubaoParams?.response_format ?? "url",
              size: values.doubaoParams?.size ?? "2K",
              stream: false,
              watermark: values.doubaoParams?.watermark ?? true,
            },
            apiKey,
          )
          const raw = rawResponse as unknown as Record<string, unknown>
          return parseImageGenResponse(raw, values.prompt, values.model) ?? null
        } catch (e) {
          if (axios.isAxiosError(e)) {
            const detail =
              e.response?.data !== undefined
                ? typeof e.response.data === "string"
                  ? e.response.data
                  : JSON.stringify(e.response.data)
                : e.message
            throw new Error(detail || "生成图片任务失败")
          }
          throw e
        }
      })
      .then((data) => {
        if (data) {
          setResult(data)
          const sourceUrls = getResultImageUrls(data)
          if (sourceUrls.length > 0) {
            setOssUpload({ status: "uploading" })
            void runOssUpload(sourceUrls)
          } else {
            setOssUpload({ status: "idle" })
          }
        } else if (data === null) {
          message.warning("返回数据格式无法展示为图片结果，请确认接口已按文档返回 data[].url")
        }
      })
      .catch((e) => {
        // 表单校验错误时，仅提示具体校验信息，不再视为系统错误
        if (e?.errorFields && Array.isArray(e.errorFields) && e.errorFields.length > 0) {
          const firstFieldError = e.errorFields[0]
          const firstErrorMsg =
            (firstFieldError?.errors && firstFieldError.errors[0]) || "请完善必填项信息"
          message.info(firstErrorMsg)
          return
        }

        console.error(e)
        message.error(e instanceof Error ? e.message : "生成图片任务失败")
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  const { run: handleGenerateDebounce } = useDebounceFn(handleGenerate, {
    wait: 350,
    leading: true,
    trailing: false,
  })

  const handleModelChange = (value: string) => {
    ls.set(LAST_MODEL_KEY, value)
  }

  const handleRegenerate = () => {
    handleGenerateDebounce()
  }

  const imageUploaderProps: ImageUploaderProps = useMemo(
    () => ({
      title: "参考图",
      subTitle: <span className="text-sm text-assistant-text-color">（可选）</span>,
      maxCount: 5,
      value: (referenceImages as any[]) || [],
      onChange: (images) => {
        form.setFieldValue("referenceImages", images)
      },
      hint: "支持jpg、png格式，鼠标悬停可粘贴图片",
    }),
    [referenceImages, form]
  )

  return (
    <div className="h-full w-full overflow-y-auto bg-page-bg-color">
      <div className="min-h-full w-full p-6">
        <Form
          form={form}
          layout="vertical"
          className="flex h-full w-full gap-6"
          initialValues={{
            model: MODEL_OPTIONS[0].value,
            imageParams: {
              n: 4,
              aspect_ratio: "1:1",
            },
            doubaoParams: {
              sequential_image_generation: "disabled",
              response_format: "url",
              size: "2K",
              watermark: true,
            },
            prompt: "",
            negative_prompt: "",
            referenceImages: [],
          }}
        >
          {/* 左侧表单区域 */}
          <section className="w-[360px] shrink-0 rounded-2xl bg-card-bg-color p-5 shadow-sm">
            <div className="text-lg font-semibold text-block-title-color mb-8">图片创作</div>

            {/* 参考图（非豆包 Seedream） */}
            {!isDoubaoModel && (
              <Form.Item name="referenceImages" className="mt-4">
                <ImageUploader {...imageUploaderProps} />
              </Form.Item>
            )}

            {/* 创意描述 */}
            <Form.Item
              name="prompt"
              rules={[{ required: true, message: "请输入创意描述" }]}
              className="mb-4"
            >
              <PromptInput placeholder="请输入创意描述" autoExpand={true} title="创意描述" />
            </Form.Item>

            {/* 负向提示词（非豆包 Seedream） */}
            {!isDoubaoModel && (
              <Form.Item name="negative_prompt" className="mb-4">
                <PromptInput />
              </Form.Item>
            )}

            {/* 模型选择 */}
            <Form.Item
              name="model"
              label={<span className="text-sm text-assistant-text-color">模型</span>}
              className="mb-4"
            >
              <Select
                options={MODEL_OPTIONS}
                onChange={handleModelChange}
                placeholder="选择模型"
              />
            </Form.Item>

            {/* 豆包 Seedream：与 images/generations 对齐的参数 */}
            {isDoubaoModel && (
              <div className="mb-4 flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="mb-2 text-sm text-assistant-text-color">连续出图</div>
                    <Form.Item name={["doubaoParams", "sequential_image_generation"]} noStyle>
                      <Select options={DOUBAO_SEQUENTIAL_OPTIONS} popupMatchSelectWidth={false} />
                    </Form.Item>
                  </div>
                  <div>
                    <div className="mb-2 text-sm text-assistant-text-color">返回格式</div>
                    <Form.Item name={["doubaoParams", "response_format"]} noStyle>
                      <Select
                        options={DOUBAO_RESPONSE_FORMAT_OPTIONS}
                        popupMatchSelectWidth={false}
                      />
                    </Form.Item>
                  </div>
                </div>
                <div>
                  <div className="mb-2 text-sm text-assistant-text-color">尺寸</div>
                  <Form.Item name={["doubaoParams", "size"]} noStyle>
                    <Select options={DOUBAO_SIZE_OPTIONS} popupMatchSelectWidth={false} />
                  </Form.Item>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-line-color bg-default-bg-color px-3 py-2">
                  <span className="text-sm text-assistant-text-color">水印</span>
                  <Form.Item name={["doubaoParams", "watermark"]} noStyle valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </div>
              </div>
            )}

            {/* 参数设置：比例和数量 */}
            {!isDoubaoModel && (
              <Form.Item name="imageParams" className="mb-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="mb-2 text-sm text-assistant-text-color">比例</div>
                    <Select
                      options={RATIO_OPTIONS}
                      placeholder="选择比例"
                      popupMatchSelectWidth={false}
                      defaultValue={"1:1"}
                    />
                  </div>
                  <div>
                    <div className="mb-2 text-sm text-assistant-text-color">数量</div>
                    <Select
                      options={COUNT_OPTIONS}
                      placeholder="选择数量"
                      popupMatchSelectWidth={false}
                      defaultValue={"1"}
                    />
                  </div>
                </div>
              </Form.Item>
            )}

            {/* 生成按钮 */}
            <GradientButton
              gradient="primary"
              onClick={handleGenerateDebounce}
              icon={<IconFont type="icon-ai" />}
              block
              loading={isLoading}
            >
              立即生成
            </GradientButton>
          </section>

          {/* 右侧结果区域 */}
          <section className="flex-1 rounded-2xl bg-card-bg-color p-5 shadow-sm min-w-0">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold text-block-title-color">图片结果</div>
              {result && (
                <button
                  type="button"
                  onClick={handleRegenerate}
                  className="h-8 rounded-full bg-default-bg-color px-4 text-xs text-button-text-color"
                >
                  重新生成
                </button>
              )}
            </div>

            {!result ? (
              <div className="mt-6 flex h-[420px] w-full items-center justify-center rounded-2xl border border-dashed border-line-color bg-default-bg-color text-sm text-assistant-text-color">
                点击左侧生成按钮查看结果
              </div>
            ) : (
              <>
                {result.kind === "doubao" ? (
                  <>
                    <div className="mt-6 grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
                      {result.items.map((item, idx) => (
                        <div
                          key={`${item.url}-${idx}`}
                          className="overflow-hidden rounded-xl border border-line-color bg-default-bg-color"
                        >
                          <div className="aspect-4/3 w-full overflow-hidden">
                            <img
                              src={item.url}
                              alt={`生成图 ${idx + 1}`}
                              className="h-full w-full object-contain"
                            />
                          </div>
                          <div className="border-t border-line-color px-3 py-2 text-xs text-assistant-text-color">
                            尺寸 <span className="text-block-title-color">{item.size}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mt-6 grid w-full grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {result.images.map((src, idx) => (
                        <div
                          key={`${src}-${idx}`}
                          className="aspect-square w-full overflow-hidden rounded-xl border border-line-color bg-default-bg-color"
                        >
                          <img
                            src={src}
                            alt={`mock-${idx}`}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {ossUpload.status === "failed" && (
                  <div className="mt-6 flex flex-col gap-3 rounded-xl border border-line-color bg-default-bg-color px-4 py-3">
                    <p className="text-sm text-assistant-text-color">
                      七牛上传失败，已保留上方生成接口返回的图片。原因：{" "}
                      <span className="text-block-title-color">{ossUpload.error}</span>
                    </p>
                    <div>
                      <button
                        type="button"
                        onClick={handleRetryOssUpload}
                        className="h-9 rounded-full bg-default-bg-color px-4 text-sm text-button-text-color ring-1 ring-line-color hover:bg-card-bg-color"
                      >
                        重新上传
                      </button>
                    </div>
                  </div>
                )}

                {result.kind === "doubao" ? (
                  <div className="mt-6 space-y-3 rounded-xl border border-line-color bg-default-bg-color p-4 text-sm text-assistant-text-color">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div>
                        模型: <span className="text-block-title-color">{result.model}</span>
                      </div>
                      <div>
                        创建时间:{" "}
                        <span className="text-block-title-color">
                          {new Date(result.created * 1000).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    {result.usage && (
                      <div className="grid gap-2 border-t border-line-color pt-3 sm:grid-cols-3">
                        <div>
                          生成张数:{" "}
                          <span className="text-block-title-color">
                            {result.usage.generated_images ?? "—"}
                          </span>
                        </div>
                        <div>
                          输出 tokens:{" "}
                          <span className="text-block-title-color">
                            {result.usage.output_tokens ?? "—"}
                          </span>
                        </div>
                        <div>
                          总 tokens:{" "}
                          <span className="text-block-title-color">
                            {result.usage.total_tokens ?? "—"}
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="border-t border-line-color pt-3">
                      提示词: <span className="text-block-title-color">{result.prompt}</span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 grid grid-cols-2 gap-3 text-sm text-assistant-text-color">
                    <div>
                      任务ID: <span className="text-block-title-color">{result.taskId}</span>
                    </div>
                    <div>
                      生成时间: <span className="text-block-title-color">{result.createdAt}</span>
                    </div>
                    <div>
                      模型: <span className="text-block-title-color">{result.model}</span>
                    </div>
                    <div>
                      比例: <span className="text-block-title-color">{result.ratio}</span>
                    </div>
                    <div>
                      张数: <span className="text-block-title-color">{result.count}张</span>
                    </div>
                    <div className="col-span-2">
                      提示词: <span className="text-block-title-color">{result.prompt}</span>
                    </div>
                    <div className="col-span-2">
                      负向提示:{" "}
                      <span className="text-block-title-color">{result.negativePrompt}</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        </Form>
      </div>
    </div>
  )
}
