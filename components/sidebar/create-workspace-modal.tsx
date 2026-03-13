// import { useRequest } from 'ahooks'
// import { Form, Input, Modal, message } from 'antd'
// import { PRIMARY_GRADIENT_BUTTON_CLASSNAME } from '@/components/gradient-button'
// import { API } from '@/service'
// import { useGlobalStore } from '@/store/global'

// interface CreateWorkspaceModalProps {
//   open: boolean
//   onCancel: () => void
// }

// interface FormValues {
//   name: string
//   description: string
// }

// export default function CreateWorkspaceModal({ open, onCancel }: CreateWorkspaceModalProps) {
//   const [form] = Form.useForm<FormValues>()

//   const { runAsync: createWorkspace, loading: createLoading } = useRequest(
//     API.workspace.createWorkspace,
//     {
//       manual: true,
//       onSuccess: () => {
//         message.success('工作空间创建成功')
//         form.resetFields()
//       },
//       onError: (error) => {
//         message.error(error.message || '工作空间创建失败')
//       },
//     }
//   )

//   const handleSubmit = async () => {
//     try {
//       const values = await form.validateFields()
//       await createWorkspace({
//         name: values.name,
//         description: values.description,
//         icon_path: '', // 暂时为空，后续可以添加图标上传功能
//       })
//       const res = await API.workspace.getWorkspaceList({
//         page: 1,
//         page_size: 1000,
//       })
//       useGlobalStore.getState().setWorkspaceList(res.results)
//       const currentWorkspace =
//         res.results.find(
//           (workspace) => workspace.workspace_id === res.results?.[0]?.workspace_id
//         ) || null
//       useGlobalStore.getState().setCurrentWorkspace(currentWorkspace)
//       onCancel()
//     } catch (error) {
//       console.error('表单验证失败:', error)
//     }
//   }

//   const handleCancel = () => {
//     form.resetFields()
//     onCancel()
//   }

//   return (
//     <Modal
//       title='新建工作空间'
//       open={open}
//       onCancel={handleCancel}
//       width={480}
//       okText='提交'
//       okButtonProps={{
//         className: PRIMARY_GRADIENT_BUTTON_CLASSNAME,
//         loading: createLoading,
//       }}
//       onOk={handleSubmit}
//     >
//       <Form form={form} layout='vertical' requiredMark={false} className='!pt-5 !pb-2'>
//         <Form.Item
//           label={
//             <div className='flex items-center gap-1'>
//               <span className='font-medium'>工作空间名称</span>
//               <span className='text-sm text-red-500'>*</span>
//             </div>
//           }
//           name='name'
//           rules={[
//             { required: true, message: '请输入工作空间名称' },
//             { max: 32, message: '工作空间名称不能超过32个字符' },
//           ]}
//         >
//           <Input placeholder='请输入工作空间名称' className='h-8' />
//         </Form.Item>

//         <Form.Item
//           label={<span className='font-medium'>描述</span>}
//           name='description'
//           rules={[{ max: 128, message: '描述不能超过128个字符' }]}
//         >
//           <Input.TextArea
//             placeholder='请输入工作空间描述（可选）'
//             className='min-h-[80px]'
//             showCount
//             rows={3}
//           />
//         </Form.Item>
//       </Form>
//     </Modal>
//   )
// }
