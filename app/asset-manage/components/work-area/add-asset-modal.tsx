import { Form, Input, Modal, Select, Upload, message } from 'antd'
import type { UploadFile } from 'antd/es/upload/interface'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { PRIMARY_GRADIENT_BUTTON_CLASSNAME } from '@/components/gradient-button'
import { assetsService } from '@/service/assets'

const ASSET_TYPE_OPTIONS = [
  { label: '角色', value: 'character' },
  { label: '武器', value: 'weapon' },
  { label: '场景', value: 'scene' },
  { label: '风格', value: 'style' },
  { label: '其他', value: 'other' },
]

const DEFAULT_PREVIEW_URL =
  'http://tet8enu2f.hd-bkt.clouddn.com/cc5d1efb6548a8d20347c7404177b8fb157d3afc30133-NKwZDj_fw658webp.webp?e=1778486599&token=GzsbiQQa5pxz92lZZDUtOQiqqy2HevA_SgY6duFx:qfuYgCKEd4FqOTXKHXzq8rT42TE='

interface TagOption {
  id: string
  name: string
}

interface AssetInitialValues {
  name?: string
  type?: string
  description?: string
  preview_url?: string
}

export interface AddAssetModalProps {
  open: boolean
  mode?: 'create' | 'edit'
  assetId?: string
  initialValues?: AssetInitialValues
  onCancel: () => void
  onSuccess: () => void
}

export const AddAssetModal = ({
  open,
  mode = 'create',
  assetId,
  initialValues,
  onCancel,
  onSuccess,
}: AddAssetModalProps) => {
  const [form] = Form.useForm()
  const [tagOptions, setTagOptions] = useState<TagOption[]>([])
  const [tagsLoading, setTagsLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const isEditMode = mode === 'edit'

  const tagSelectOptions = useMemo(
    () => tagOptions.map((tag) => ({ label: tag.name, value: tag.id })),
    [tagOptions]
  )

  const fetchTags = useCallback(async () => {
    setTagsLoading(true)
    try {
      const res = await assetsService.getAllTags()
      setTagOptions(res)
    } catch (error) {
      console.error('获取标签列表失败:', error)
    } finally {
      setTagsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!open) return

    const initialize = async () => {
      await fetchTags()

      form.setFieldsValue({
        name: initialValues?.name ?? '',
        type: initialValues?.type ?? undefined,
        description: initialValues?.description ?? undefined,
        preview_url: initialValues?.preview_url ?? undefined,
        tag_ids: [],
      })

      if (isEditMode && assetId) {
        try {
          const tags = await assetsService.getAssetTags({ asset_id: assetId })
          form.setFieldsValue({ tag_ids: tags.map((tag) => tag.id) })
        } catch (error) {
          console.error('获取资产标签失败:', error)
        }
      }
    }

    initialize()
  }, [open, isEditMode, assetId, initialValues, fetchTags, form])

  const handleAfterOpenChange = (visible: boolean) => {
    if (!visible) {
      form.resetFields()
      setFileList([])
    }
  }

  const handleCreateTag = async (name: string) => {
    try {
      const newTag = await assetsService.createTag({ name })
      setTagOptions((prev) => [...prev, newTag])
      return newTag.id
    } catch (error: any) {
      message.error(error?.message || '创建标签失败')
      return null
    }
  }

  const handleFinish = async (values: {
    name: string
    type?: string
    description?: string
    preview_url?: string
    tag_ids?: string[]
  }) => {
    setSubmitting(true)
    try {
      const payload = {
        name: values.name,
        type: values.type,
        description: values.description,
        preview_url: values.preview_url?.trim() || DEFAULT_PREVIEW_URL,
        tag_ids: values.tag_ids,
      }

      if (isEditMode && assetId) {
        await assetsService.updateAsset({
          asset_id: assetId,
          ...payload,
        })
      } else {
        await assetsService.createAsset(payload)
      }
      message.success(isEditMode ? '资产编辑成功' : '资产添加成功')
      onSuccess()
      onCancel()
    } catch (error: any) {
      message.error(error?.message || (isEditMode ? '编辑资产失败' : '添加资产失败'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      title={isEditMode ? '编辑资产' : '添加资产'}
      okText='提交'
      cancelText='取消'
      confirmLoading={submitting}
      okButtonProps={{
        autoFocus: true,
        htmlType: 'submit',
        className: PRIMARY_GRADIENT_BUTTON_CLASSNAME,
      }}
      cancelButtonProps={{
        variant: 'filled',
        color: 'default',
      }}
      onCancel={onCancel}
      afterOpenChange={handleAfterOpenChange}
      destroyOnHidden
      width={580}
      modalRender={(dom) => (
        <Form
          layout='vertical'
          form={form}
          name='add_asset_form'
          requiredMark={false}
          onFinish={handleFinish}
          clearOnDestroy
        >
          {dom}
        </Form>
      )}
    >
      <Form.Item
        label={
          <span className='mt-4 font-medium'>
            资产名称<span className='text-red-500 ml-1'>*</span>
          </span>
        }
        name='name'
        rules={[
          { required: true, message: '请输入资产名称' },
          { max: 100, message: '资产名称最多100个字符' },
        ]}
      >
        <Input placeholder='请输入资产名称' maxLength={100} />
      </Form.Item>

      <Form.Item label={<span className='font-medium'>资产类型</span>} name='type'>
        <Select placeholder='请选择资产类型' options={ASSET_TYPE_OPTIONS} allowClear />
      </Form.Item>

      <Form.Item label={<span className='font-medium'>描述</span>} name='description'>
        <Input.TextArea placeholder='请输入资产描述' rows={3} maxLength={500} showCount />
      </Form.Item>

      <Form.Item
        label={<span className='font-medium'>预览图</span>}
        extra='暂不接入上传接口，提交时将使用预览URL（未填时用默认图）'
      >
        <Upload
          listType='picture-card'
          fileList={fileList}
          beforeUpload={() => false}
          maxCount={1}
          onChange={({ fileList: nextFileList }) => setFileList(nextFileList)}
        >
          {fileList.length >= 1 ? null : '+ 上传图片'}
        </Upload>
      </Form.Item>

      <Form.Item label={<span className='font-medium'>预览URL</span>} name='preview_url'>
        <Input placeholder='请输入预览图 URL（不填则使用默认图）' />
      </Form.Item>

      <Form.Item label={<span className='font-medium'>标签</span>} name='tag_ids'>
        <Select
          mode='tags'
          placeholder='请选择或输入新标签'
          loading={tagsLoading}
          options={tagSelectOptions}
          tokenSeparators={[',']}
          onSelect={async (value: string) => {
            const isExistingTag = tagOptions.some((tag) => tag.id === value)
            if (!isExistingTag) {
              const newTagId = await handleCreateTag(value)
              const currentValues = ((form.getFieldValue('tag_ids') as string[]) ?? []).filter(Boolean)
              if (newTagId) {
                form.setFieldsValue({
                  tag_ids: currentValues.map((v) => (v === value ? newTagId : v)),
                })
              } else {
                form.setFieldsValue({
                  tag_ids: currentValues.filter((v) => v !== value),
                })
              }
            }
          }}
        />
      </Form.Item>
    </Modal>
  )
}
