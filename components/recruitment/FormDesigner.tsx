'use client'

import { useState, useEffect, useRef } from 'react'
import Icon from '@/components/icons/Icon'
import ConfirmDialog from '@/components/common/ConfirmDialog'

interface FormField {
  id?: string
  name: string
  label: string
  type: 'TEXT' | 'EMAIL' | 'PHONE' | 'NUMBER' | 'DATE' | 'SELECT' | 'MULTISELECT' | 'TEXTAREA' | 'CHECKBOX' | 'RADIO' | 'FILE'
  placeholder?: string
  required: boolean
  order: number
  options?: Array<{ value: string; label: string }>
  minLength?: number
  maxLength?: number
  pattern?: string
  width?: string
  helpText?: string
  isActive?: boolean
}

interface FormDesignerProps {
  formId: string
  formData: {
    formTitle?: string
    formContent?: string
    bannerUrl?: string
    primaryColor?: string
    secondaryColor?: string
    backgroundColor?: string
    textColor?: string
  }
  fields: FormField[]
  onSave: (data: {
    formTitle?: string
    formContent?: string
    bannerUrl?: string
    primaryColor?: string
    secondaryColor?: string
    backgroundColor?: string
    textColor?: string
    fields: FormField[]
  }) => void
  onCancel: () => void
}

export default function FormDesigner({ formId, formData, fields: initialFields, onSave, onCancel }: FormDesignerProps) {
  const [designData, setDesignData] = useState(formData)
  const [fields, setFields] = useState<FormField[]>(initialFields || [])
  const [editingField, setEditingField] = useState<FormField | null>(null)
  const [showFieldEditor, setShowFieldEditor] = useState(false)
  const [activeSection, setActiveSection] = useState<'content' | 'design' | 'fields'>('content')
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [deleteFieldIndex, setDeleteFieldIndex] = useState<number | null>(null)
  const dragItemRef = useRef<number | null>(null)
  const dragOverItemRef = useRef<number | null>(null)

  useEffect(() => {
    setDesignData(formData)
    setFields(initialFields || [])
  }, [formData, initialFields])

  const addField = (type: FormField['type'] = 'TEXT') => {
    const newField: FormField = {
      name: `field_${Date.now()}`,
      label: 'Câu hỏi mới',
      type,
      required: false,
      order: fields.length,
      width: 'full',
      placeholder: '',
    }
    setEditingField(newField)
    setShowFieldEditor(true)
  }

  const editField = (field: FormField) => {
    setEditingField({ ...field })
    setShowFieldEditor(true)
  }

  const deleteField = (index: number) => {
    const newFields = fields.filter((_, i) => i !== index)
    newFields.forEach((field, i) => {
      field.order = i
    })
    setFields(newFields)
    setDeleteFieldIndex(null)
  }

  const duplicateField = (index: number) => {
    const field = fields[index]
    const newField: FormField = {
      ...field,
      id: undefined,
      name: `${field.name}_copy`,
      label: `${field.label} (bản sao)`,
      order: fields.length,
    }
    setFields([...fields, newField])
  }

  const saveField = (field: FormField) => {
    if (editingField?.id) {
      const index = fields.findIndex((f) => f.id === editingField.id)
      if (index !== -1) {
        const newFields = [...fields]
        newFields[index] = { ...field, id: editingField.id }
        setFields(newFields)
      }
    } else {
      setFields([...fields, { ...field, order: fields.length }])
    }
    setShowFieldEditor(false)
    setEditingField(null)
  }

  const handleDragStart = (index: number) => {
    dragItemRef.current = index
    setDraggedIndex(index)
  }

  const handleDragEnter = (index: number) => {
    dragOverItemRef.current = index
  }

  const handleDragEnd = () => {
    if (dragItemRef.current !== null && dragOverItemRef.current !== null) {
      const newFields = [...fields]
      const draggedItem = newFields[dragItemRef.current]
      newFields.splice(dragItemRef.current, 1)
      newFields.splice(dragOverItemRef.current, 0, draggedItem)
      newFields.forEach((field, i) => {
        field.order = i
      })
      setFields(newFields)
    }
    dragItemRef.current = null
    dragOverItemRef.current = null
    setDraggedIndex(null)
  }

  const handleSave = () => {
    onSave({
      ...designData,
      fields: fields.map((f, i) => ({ ...f, order: i })),
    })
  }

  const renderFieldPreview = (field: FormField, index: number) => {
    const baseInputClass = `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all`
    const labelClass = `block text-sm font-medium text-gray-700 mb-1`

    return (
      <div
        key={field.id || index}
        className={`p-4 bg-white rounded-lg border ${
          draggedIndex === index ? 'border-yellow-500 border-dashed opacity-50' : 'border-gray-200'
        }`}
        draggable
        onDragStart={() => handleDragStart(index)}
        onDragEnter={() => handleDragEnter(index)}
        onDragEnd={handleDragEnd}
        onDragOver={(e) => e.preventDefault()}
      >
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center gap-1 pt-1 text-gray-400">
            <div className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded-full text-xs font-medium">
              {index + 1}
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <label className={labelClass}>
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
            </div>

            {field.type === 'TEXT' && (
              <input
                type="text"
                placeholder={field.placeholder || ''}
                className={`${baseInputClass} bg-gray-50 border-gray-200`}
                disabled
              />
            )}

            {field.type === 'EMAIL' && (
              <input
                type="email"
                placeholder={field.placeholder || 'email@example.com'}
                className={`${baseInputClass} bg-gray-50 border-gray-200`}
                disabled
              />
            )}

            {field.type === 'PHONE' && (
              <input
                type="tel"
                placeholder={field.placeholder || '0123456789'}
                className={`${baseInputClass} bg-gray-50 border-gray-200`}
                disabled
              />
            )}

            {field.type === 'NUMBER' && (
              <input
                type="number"
                placeholder={field.placeholder || ''}
                className={`${baseInputClass} bg-gray-50 border-gray-200`}
                disabled
              />
            )}

            {field.type === 'DATE' && (
              <input
                type="date"
                className={`${baseInputClass} bg-gray-50 border-gray-200`}
                disabled
              />
            )}

            {field.type === 'TEXTAREA' && (
              <textarea
                placeholder={field.placeholder || ''}
                rows={3}
                className={`${baseInputClass} bg-gray-50 border-gray-200`}
                disabled
              />
            )}

            {field.type === 'SELECT' && (
              <select
                className={`${baseInputClass} bg-gray-50 border-gray-200`}
                disabled
              >
                <option>Chọn...</option>
                {field.options?.map((opt, i) => (
                  <option key={i} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}

            {field.type === 'CHECKBOX' && (
              <div className="space-y-2">
                {field.options?.map((opt, i) => (
                  <label key={i} className="flex items-center gap-2">
                    <input type="checkbox" className="w-4 h-4 rounded" disabled />
                    <span className="text-sm text-gray-600">{opt.label}</span>
                  </label>
                ))}
              </div>
            )}

            {field.type === 'RADIO' && (
              <div className="space-y-2">
                {field.options?.map((opt, i) => (
                  <label key={i} className="flex items-center gap-2">
                    <input type="radio" name={field.name} className="w-4 h-4" disabled />
                    <span className="text-sm text-gray-600">{opt.label}</span>
                  </label>
                ))}
              </div>
            )}

            {field.type === 'FILE' && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <Icon name="upload" className="mx-auto text-gray-400 mb-2" size={24} />
                <p className="text-sm text-gray-500">Tải tệp lên</p>
              </div>
            )}

            {field.helpText && <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <button
              onClick={() => editField(field)}
              className="p-1 text-gray-400 hover:text-blue-600"
              title="Chỉnh sửa"
            >
              <Icon name="edit" size={16} />
            </button>
            <button
              onClick={() => duplicateField(index)}
              className="p-1 text-gray-400 hover:text-green-600"
              title="Nhân bản"
            >
              <Icon name="copy" size={16} />
            </button>
            <button
              onClick={() => setDeleteFieldIndex(index)}
              className="p-1 text-gray-400 hover:text-red-600"
              title="Xóa"
            >
              <Icon name="trash" size={16} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  const fieldTypes = [
    { type: 'TEXT', label: 'Văn bản ngắn', icon: 'text' },
    { type: 'TEXTAREA', label: 'Đoạn văn bản', icon: 'text' },
    { type: 'NUMBER', label: 'Số', icon: 'number' },
    { type: 'EMAIL', label: 'Email', icon: 'email' },
    { type: 'PHONE', label: 'Điện thoại', icon: 'phone' },
    { type: 'DATE', label: 'Ngày', icon: 'calendar' },
    { type: 'SELECT', label: 'Trình đơn thả xuống', icon: 'select' },
    { type: 'CHECKBOX', label: 'Nhiều lựa chọn', icon: 'checkbox' },
    { type: 'RADIO', label: 'Một lựa chọn', icon: 'radio' },
    { type: 'FILE', label: 'Tải tệp lên', icon: 'upload' },
  ]

  return (
    <div className="flex h-[80vh]">
      {/* Left Sidebar - Tools */}
      <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Công cụ</h3>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* Add Field Buttons */}
          <div className="mb-6">
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Thêm câu hỏi</h4>
            <div className="grid grid-cols-2 gap-2">
              {fieldTypes.map((ft) => (
                <button
                  key={ft.type}
                  onClick={() => addField(ft.type as FormField['type'])}
                  className="p-3 bg-white border border-gray-200 rounded-lg text-left hover:border-yellow-500 hover:shadow-sm transition-all"
                >
                  <div className="text-sm font-medium text-gray-700">{ft.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Content Section */}
          <div className="mb-6">
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Nội dung</h4>
            <button
              onClick={() => setActiveSection('content')}
              className={`w-full p-3 text-left rounded-lg border transition-all ${
                activeSection === 'content'
                  ? 'bg-yellow-50 border-yellow-500'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="text-sm font-medium text-gray-700">Tiêu đề & Mô tả</span>
            </button>
          </div>

          {/* Design Section */}
          <div className="mb-6">
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Thiết kế</h4>
            <button
              onClick={() => setActiveSection('design')}
              className={`w-full p-3 text-left rounded-lg border transition-all ${
                activeSection === 'design'
                  ? 'bg-yellow-50 border-yellow-500'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="text-sm font-medium text-gray-700">Màu sắc & Hình ảnh</span>
            </button>
          </div>

          {/* Color Settings (when design section active) */}
          {activeSection === 'design' && (
            <div className="space-y-4 p-4 bg-white rounded-lg border border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Màu chính</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={designData.primaryColor || '#E31837'}
                    onChange={(e) => setDesignData({ ...designData, primaryColor: e.target.value })}
                    className="h-10 w-12 border rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={designData.primaryColor || '#E31837'}
                    onChange={(e) => setDesignData({ ...designData, primaryColor: e.target.value })}
                    className="flex-1 px-3 py-2 border rounded-md text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Màu nền</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={designData.backgroundColor || '#FFFFFF'}
                    onChange={(e) => setDesignData({ ...designData, backgroundColor: e.target.value })}
                    className="h-10 w-12 border rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={designData.backgroundColor || '#FFFFFF'}
                    onChange={(e) => setDesignData({ ...designData, backgroundColor: e.target.value })}
                    className="flex-1 px-3 py-2 border rounded-md text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Màu chữ</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={designData.textColor || '#111827'}
                    onChange={(e) => setDesignData({ ...designData, textColor: e.target.value })}
                    className="h-10 w-12 border rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={designData.textColor || '#111827'}
                    onChange={(e) => setDesignData({ ...designData, textColor: e.target.value })}
                    className="flex-1 px-3 py-2 border rounded-md text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Content Settings (when content section active) */}
          {activeSection === 'content' && (
            <div className="space-y-4 p-4 bg-white rounded-lg border border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề form</label>
                <input
                  type="text"
                  value={designData.formTitle || ''}
                  onChange={(e) => setDesignData({ ...designData, formTitle: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  placeholder="Ứng tuyển KFC"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <textarea
                  value={designData.formContent || ''}
                  onChange={(e) => setDesignData({ ...designData, formContent: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  rows={4}
                  placeholder="Điền thông tin để ứng tuyển..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL Banner</label>
                <input
                  type="url"
                  value={designData.bannerUrl || ''}
                  onChange={(e) => setDesignData({ ...designData, bannerUrl: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  placeholder="https://..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-200 flex justify-between">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
          >
            Lưu
          </button>
        </div>
      </div>

      {/* Right - Preview */}
      <div className="flex-1 bg-gray-100 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-8">
          <div
            className="bg-white rounded-lg shadow-lg overflow-hidden"
            style={{ backgroundColor: designData.backgroundColor || '#FFFFFF' }}
          >
            {/* Banner */}
            {designData.bannerUrl && (
              <img
                src={designData.bannerUrl}
                alt="Banner"
                className="w-full h-48 object-cover"
              />
            )}

            {/* Header */}
            <div className="p-8 pb-4">
              <h1
                className="text-2xl font-bold"
                style={{ color: designData.textColor || '#111827' }}
              >
                {designData.formTitle || 'Ứng tuy��n KFC'}
              </h1>
              <p
                className="mt-2 text-sm"
                style={{ color: designData.textColor || '#6B7280' }}
              >
                {designData.formContent || 'Điền thông tin để hoàn tất đơn ứng tuyển'}
              </p>
              <p className="mt-2 text-xs text-gray-400">* Bắt buộc</p>
            </div>

            {/* Fields */}
            <div className="px-8 pb-8 space-y-4">
              {fields.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p>Chưa có câu hỏi nào</p>
                  <p className="text-sm mt-1">Nhấn vào công cụ bên trái để thêm câu hỏi</p>
                </div>
              ) : (
                fields
                  .sort((a, b) => a.order - b.order)
                  .map((field, index) => renderFieldPreview(field, index))
              )}
            </div>

            {/* Footer */}
            <div className="px-8 pb-8">
              <button
                className="px-6 py-2 text-white rounded-md font-medium"
                style={{ backgroundColor: designData.primaryColor || '#E31837' }}
                disabled
              >
                Gửi
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Field Editor Modal */}
      {showFieldEditor && editingField && (
        <FieldEditorModal
          field={editingField}
          onSave={saveField}
          onCancel={() => {
            setShowFieldEditor(false)
            setEditingField(null)
          }}
        />
      )}

      <ConfirmDialog
        isOpen={deleteFieldIndex !== null}
        title="Xóa câu hỏi"
        message="Bạn có chắc chắn muốn xóa trường này?"
        confirmText="Xóa"
        destructive
        onClose={() => setDeleteFieldIndex(null)}
        onConfirm={() => {
          if (deleteFieldIndex !== null) {
            deleteField(deleteFieldIndex)
          }
        }}
      />
    </div>
  )
}

function FieldEditorModal({
  field,
  onSave,
  onCancel,
}: {
  field: FormField
  onSave: (field: FormField) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState<FormField>(field)
  const [newOption, setNewOption] = useState({ value: '', label: '' })

  useEffect(() => {
    setFormData(field)
  }, [field])

  const addOption = () => {
    if (newOption.value && newOption.label) {
      setFormData({
        ...formData,
        options: [...(formData.options || []), { ...newOption }],
      })
      setNewOption({ value: '', label: '' })
    }
  }

  const removeOption = (index: number) => {
    const newOptions = formData.options?.filter((_, i) => i !== index) || []
    setFormData({ ...formData, options: newOptions })
  }

  const needsOptions = ['SELECT', 'MULTISELECT', 'RADIO', 'CHECKBOX'].includes(formData.type)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {field.id ? 'Chỉnh sửa câu hỏi' : 'Thêm câu hỏi'}
          </h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Câu hỏi <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              required
              placeholder="Nhập câu hỏi"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loại câu hỏi
            </label>
            <select
              value={formData.type}
              onChange={(e) => {
                const newType = e.target.value as FormField['type']
                setFormData({
                  ...formData,
                  type: newType,
                  options: needsOptions ? formData.options : undefined,
                })
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              <option value="TEXT">Văn bản ngắn</option>
              <option value="TEXTAREA">Đoạn văn bản</option>
              <option value="NUMBER">Số</option>
              <option value="EMAIL">Email</option>
              <option value="PHONE">Điện thoại</option>
              <option value="DATE">Ngày</option>
              <option value="SELECT">Trình đơn thả xuống</option>
              <option value="CHECKBOX">Nhiều lựa chọn</option>
              <option value="RADIO">Một lựa chọn</option>
              <option value="FILE">Tải tệp lên</option>
            </select>
          </div>

          {['TEXT', 'TEXTAREA', 'NUMBER', 'EMAIL', 'PHONE'].includes(formData.type) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Văn bản mẫu (Placeholder)
              </label>
              <input
                type="text"
                value={formData.placeholder || ''}
                onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="Nhập văn bản mẫu"
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="required"
              checked={formData.required}
              onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
              className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
            />
            <label htmlFor="required" className="text-sm font-medium text-gray-700">
              Bắt buộc
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Văn bản trợ giúp
            </label>
            <input
              type="text"
              value={formData.helpText || ''}
              onChange={(e) => setFormData({ ...formData, helpText: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              placeholder="Văn bản hiển thị dưới câu hỏi"
            />
          </div>

          {needsOptions && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tùy chọn
              </label>
              <div className="space-y-2 mb-3">
                {formData.options?.map((option, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <span className="flex-1 text-sm">{option.label}</span>
                    <span className="text-xs text-gray-400">({option.value})</span>
                    <button
                      onClick={() => removeOption(index)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newOption.label}
                  onChange={(e) => setNewOption({ ...newOption, label: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="Nhãn hiển thị"
                />
                <input
                  type="text"
                  value={newOption.value}
                  onChange={(e) => setNewOption({ ...newOption, value: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="Giá trị"
                />
                <button
                  onClick={addOption}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                >
                  Thêm
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            onClick={() => onSave(formData)}
            className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
          >
            Lưu
          </button>
        </div>
      </div>
    </div>
  )
}