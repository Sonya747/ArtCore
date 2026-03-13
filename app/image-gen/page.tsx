"use client"

import { useDebounceFn } from "ahooks"
import { App, Form, Select } from "antd"
import { useEffect, useMemo, useState } from "react"
import GradientButton from "@/components/gradient-button"
import IconFont from "@/components/icon-font"
import ImageUploader from "@/components/image-uploader"
import type { ImageUploaderProps } from "@/components/image-uploader/types"
import { ls } from "@/utils/localStorage"
import PromptInput from "@/components/prompt-input"

type ImageGenResult = {
  taskId: string
  createdAt: string
  model: string
  ratio: string
  count: number
  prompt: string
  negativePrompt: string
  images: string[]
}

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

/**
 * 保存上次使用的模型
 */
const saveLastUsedModel = (model: string) => {
  ls.set(LAST_MODEL_KEY, model)
}


export default function Page() {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<ImageGenResult | null>(null)

  const referenceImages = (Form.useWatch("referenceImages", form) as unknown[]) || []
  const model = Form.useWatch("model", form) || getLastUsedModel()

  const canRun = useMemo(
    () => form.getFieldValue("prompt")?.trim() && !isLoading,
    [form, isLoading]
  )

  const handleGenerate = () => {
    setIsLoading(true)
    form
      .validateFields()
      .then(async (values) => {
        const res = await fetch("/api/image-gen", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: values.prompt,
            negativePrompt: values.negative_prompt,
            ratio: values.imageParams?.aspect_ratio || "1:1",
            count: values.imageParams?.n || 4,
            model: values.model,
          }),
        })
        const data = (await res.json()) as ImageGenResult
        return data
      })
      .then((data) => {
        setResult(data)
      })
      .catch((e) => {
        console.error(e)
        message.error("生成图片任务失败")
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
    saveLastUsedModel(value)
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
            model: getLastUsedModel(),
            imageParams: {
              n: 4,
              aspect_ratio: "1:1",
            },
            prompt: "",
            negative_prompt: "",
            referenceImages: [],
          }}
        >
          {/* 左侧表单区域 */}
          <section className="w-[360px] shrink-0 rounded-2xl bg-card-bg-color p-5 shadow-sm">
            <div className="text-lg font-semibold text-block-title-color">图片生成</div>

            {/* 参考图 */}
            <Form.Item name="referenceImages" className="mt-4">
              <ImageUploader {...imageUploaderProps} />
            </Form.Item>

            {/* 创意描述 */}
            <Form.Item
              name="prompt"
              rules={[{ required: true, message: "请输入创意描述" }]}
              className="mb-4"
            >
              <PromptInput placeholder="请输入创意描述" autoExpand={true} title="创意描述" />
            </Form.Item>

            {/* 负向提示词 */}
            <Form.Item name="negative_prompt" className="mb-4">
              <PromptInput />
            </Form.Item>

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

            {/* 参数设置：比例和数量 */}
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

            {/* 生成按钮 */}
            <GradientButton
              gradient="primary"
              onClick={handleGenerateDebounce}
              icon={<IconFont type="icon-ai" />}
              block
              loading={isLoading}
              disabled={!canRun}
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
                <div className="mt-6 grid w-full grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {result.images.map((src, idx) => (
                    <div
                      key={`${src}-${idx}`}
                      className="aspect-square w-full overflow-hidden rounded-xl border border-line-color bg-default-bg-color"
                    >
                      <img src={src} alt={`mock-${idx}`} className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>

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
              </>
            )}
          </section>
        </Form>
      </div>
    </div>
  )
}
