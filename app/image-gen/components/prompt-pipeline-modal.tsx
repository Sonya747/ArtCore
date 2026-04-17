"use client"

import { CheckOutlined, CloseOutlined, LoadingOutlined } from "@ant-design/icons"
import { Modal } from "antd"
import GradientButton from "@/components/gradient-button"
import IconFont from "@/components/icon-font"
import type { DoubaoImageGen, PromptEngineering } from "@/service/image-gen"
import { cn } from "@/utils/cn"

export type PipelineStage = "idle" | "semantic" | "assets" | "synthesis" | "done" | "error"

export interface PipelineState {
  open: boolean
  stage: PipelineStage
  error?: string
  userPrompt: string
  semantic: PromptEngineering.SemanticParseResult | null
  assets: PromptEngineering.AssetRetrievalResult | null
  synthesis: PromptEngineering.PromptSynthesisResult | null
  editedPrompt: string
  pendingPayload: DoubaoImageGen.GenerationsRequest | null
  userRefImages: string[]
  formValues: Record<string, any> | null
}

export const INITIAL_PIPELINE: PipelineState = {
  open: false,
  stage: "idle",
  userPrompt: "",
  semantic: null,
  assets: null,
  synthesis: null,
  editedPrompt: "",
  pendingPayload: null,
  userRefImages: [],
  formValues: null,
}

const PIPELINE_STEPS = [
  { key: "semantic", label: "语义解析", desc: "解析创意描述的主体、装备、场景与风格" },
  { key: "assets", label: "资产检索", desc: "从资产库中匹配关联素材" },
  { key: "synthesis", label: "Prompt 合成", desc: "融合语义与资产生成高质量图片生成提示词" },
] as const

const SEMANTIC_DIM_LABELS: Record<string, string> = {
  subject: "主体",
  equipment: "装备",
  scene: "场景",
  style: "风格",
}

function getPipelineStepStatus(
  stepKey: "semantic" | "assets" | "synthesis",
  pipeline: PipelineState,
): "done" | "active" | "pending" | "error" {
  const order = ["semantic", "assets", "synthesis"] as const
  const stepIdx = order.indexOf(stepKey)
  if (pipeline.stage === "idle") return "pending"
  if (pipeline.stage === "done") return "done"
  if (pipeline.stage === "error") {
    const dataAvailable = [
      pipeline.semantic !== null,
      pipeline.assets !== null,
      pipeline.synthesis !== null,
    ]
    const errorIdx = dataAvailable.indexOf(false)
    if (stepIdx < errorIdx) return "done"
    if (stepIdx === errorIdx) return "error"
    return "pending"
  }
  const currentIdx = order.indexOf(pipeline.stage as (typeof order)[number])
  if (currentIdx === -1) return "pending"
  if (stepIdx < currentIdx) return "done"
  if (stepIdx === currentIdx) return "active"
  return "pending"
}

interface PromptPipelineModalProps {
  pipeline: PipelineState
  isLoading: boolean
  onCancel: () => void
  onConfirmGenerate: () => void
  onEditedPromptChange: (value: string) => void
}

function renderStepResult(
  stepKey: "semantic" | "assets" | "synthesis",
  pipeline: PipelineState,
  onEditedPromptChange: (value: string) => void,
) {
  if (stepKey === "semantic" && pipeline.semantic) {
    const dims = ["subject", "equipment", "scene", "style"] as const
    const hasAny = dims.some((dim) => pipeline.semantic?.[dim])
    return (
      <div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-1 rounded-lg bg-default-bg-color px-3 py-2">
        {hasAny ? (
          dims.map((dim) => (
            <div key={dim} className="text-sm">
              <span className="text-assistant-text-color">{SEMANTIC_DIM_LABELS[dim]}:</span>{" "}
              <span className="text-block-title-color">{pipeline.semantic?.[dim] ?? "—"}</span>
            </div>
          ))
        ) : (
          <div className="col-span-2 text-sm text-assistant-text-color">未解析到明确维度信息</div>
        )}
      </div>
    )
  }

  if (stepKey === "assets" && pipeline.assets) {
    const matched = (["subject", "equipment", "scene", "style"] as const)
      .map((key) => pipeline.assets?.[key])
      .filter((asset): asset is PromptEngineering.AssetReference => !!asset?.matched)

    return (
      <div className="mt-1.5 max-h-[300px] overflow-y-auto rounded-lg bg-default-bg-color py-2">
        {matched.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {matched.map((asset, index) => (
              <span
                key={index}
                className="inline-flex w-[400px] flex-1 items-center gap-1.5 rounded-2xl bg-[#f0fdf4] py-0.5 text-xs text-[#15803d] dark:bg-[#052e16] dark:text-[#4ade80]"
              >
                {asset.image_url && (
                  <img src={asset.image_url} alt={asset.keyword} className="h-30 w-30 rounded-2xl" />
                )}
                {asset.keyword}
                {asset.description && (
                  <span className="text-assistant-text-color">{asset.description}</span>
                )}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-sm text-assistant-text-color">未匹配到关联资产</span>
        )}
      </div>
    )
  }

  if (stepKey === "synthesis" && pipeline.synthesis) {
    return (
      <div className="mt-2 rounded-xl border border-line-color bg-default-bg-color p-4">
        <div className="mb-2 text-sm font-medium text-block-title-color">
          优化后的提示词
          <span className="ml-2 text-xs font-normal text-assistant-text-color">可直接编辑修改</span>
        </div>
        <textarea
          className="w-full resize-none rounded-lg border border-line-color bg-card-bg-color p-3 text-sm leading-relaxed text-block-title-color outline-none transition-colors focus:border-[#3b82f6]"
          rows={4}
          value={pipeline.editedPrompt}
          onChange={(event) => onEditedPromptChange(event.target.value)}
        />
      </div>
    )
  }

  return null
}

export default function PromptPipelineModal({
  pipeline,
  isLoading,
  onCancel,
  onConfirmGenerate,
  onEditedPromptChange,
}: PromptPipelineModalProps) {
  return (
    <Modal
      open={pipeline.open}
      onCancel={onCancel}
      footer={null}
      width={1020}
      title={null}
      maskClosable={false}
      destroyOnClose
      centered
      classNames={{ body: "!pt-0" }}
    >
      <div className="flex flex-col">
        <div className="mb-5 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-[#c064f9] to-[#eb5cac]">
            <IconFont type="icon-ai" className="text-lg text-white" />
          </div>
          <div>
            <div className="text-base font-semibold text-block-title-color">提示词智能优化</div>
            <div className="text-xs text-assistant-text-color">
              AI 自动解析、匹配资产并生成高质量提示词
            </div>
          </div>
        </div>

        {pipeline.userPrompt && (
          <div className="mb-5 rounded-xl border border-line-color bg-default-bg-color px-4 py-3">
            <div className="mb-1 text-xs font-medium text-assistant-text-color">原始描述</div>
            <div className="text-sm text-block-title-color">{pipeline.userPrompt}</div>
          </div>
        )}

        <div className="mb-2">
          {PIPELINE_STEPS.map((step, idx) => {
            const status = getPipelineStepStatus(step.key, pipeline)
            const isLast = idx === PIPELINE_STEPS.length - 1

            return (
              <div key={step.key} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-all duration-300",
                      status === "done" && "bg-[#22c55e] text-white",
                      status === "active" &&
                        "border-2 border-[#3b82f6] text-[#3b82f6] shadow-[0_0_0_3px_rgba(59,130,246,0.15)]",
                      status === "error" && "bg-[#ef4444] text-white",
                      status === "pending" &&
                        "border-2 border-gray-300 text-gray-400 dark:border-gray-600 dark:text-gray-500",
                    )}
                  >
                    {status === "done" && <CheckOutlined style={{ fontSize: 12 }} />}
                    {status === "active" && <LoadingOutlined style={{ fontSize: 12 }} />}
                    {status === "error" && <CloseOutlined style={{ fontSize: 12 }} />}
                    {status === "pending" && <span>{idx + 1}</span>}
                  </div>
                  {!isLast && (
                    <div
                      className={cn(
                        "w-0.5 min-h-[20px] flex-1 transition-colors duration-300",
                        status === "done" ? "bg-[#22c55e]" : "bg-gray-200 dark:bg-gray-700",
                      )}
                    />
                  )}
                </div>

                <div className={cn("flex-1 pb-4", isLast && "pb-0")}>
                  <div className="flex h-7 items-center gap-2">
                    <span
                      className={cn(
                        "text-sm font-medium transition-colors",
                        status === "active" && "text-[#3b82f6]",
                        status === "done" && "text-block-title-color",
                        status === "error" && "text-[#ef4444]",
                        status === "pending" && "text-assistant-text-color",
                      )}
                    >
                      {step.label}
                    </span>
                    {status === "active" && (
                      <span className="text-xs text-assistant-text-color">{step.desc}</span>
                    )}
                  </div>
                  {status === "done" && renderStepResult(step.key, pipeline, onEditedPromptChange)}
                  {status === "error" && pipeline.error && (
                    <div className="mt-1 rounded-lg bg-[#fef2f2] px-3 py-2 text-sm text-[#ef4444] dark:bg-[#450a0a]">
                      {pipeline.error}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="h-9 rounded-lg border border-line-color bg-card-bg-color px-5 text-sm text-assistant-text-color transition-colors hover:bg-default-bg-color"
          >
            取消
          </button>
          <GradientButton
            gradient="primary"
            onClick={onConfirmGenerate}
            loading={isLoading}
            disabled={pipeline.stage !== "done" || !pipeline.editedPrompt.trim()}
            icon={<IconFont type="icon-ai" />}
          >
            确认生成
          </GradientButton>
        </div>
      </div>
    </Modal>
  )
}
