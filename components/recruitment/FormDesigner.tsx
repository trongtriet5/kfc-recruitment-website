'use client'

import { useState, useEffect } from 'react'
import api from '@/lib/api'
import Icon from '@/components/icons/Icon'

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
  const [activeTab, setActiveTab] = useState<'design' | 'fields'>('design')
  const [designData, setDesignData] = useState(formData)
  const [fields, setFields] = useState<FormField[]>(initialFields || [])
  const [editingField, setEditingField] = useState<FormField | null>(null)
  const [showFieldEditor, setShowFieldEditor] = useState(false)

  useEffect(() => {
    setDesignData(formData)
    setFields(initialFields || [])
  }, [formData, initialFields])

  const addField = () => {
    const newField: FormField = {
      name: `field_${Date.now()}`,
      label: 'Trường mới',
      type: 'TEXT',
      required: false,
      order: fields.length,
      width: 'full',
    }
    setEditingField(newField)
    setShowFieldEditor(true)
  }

  const editField = (field: FormField) => {
    setEditingField({ ...field })
    setShowFieldEditor(true)
  }

  const deleteField = (index: number) => {
    if (confirm('Bạn có chắc chắn muốn xóa trường này?')) {
      const newFields = fields.filter((_, i) => i !== index)
      // Reorder
      newFields.forEach((field, i) => {
        field.order = i
      })
      setFields(newFields)
    }
  }

  const moveField = (index: number, direction: 'up' | 'down') => {
    const newFields = [...fields]
    if (direction === 'up' && index > 0) {
      [newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]]
      newFields[index - 1].order = index - 1
      newFields[index].order = index
    } else if (direction === 'down' && index < newFields.length - 1) {
      [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]]
      newFields[index].order = index
      newFields[index + 1].order = index + 1
    }
    setFields(newFields)
  }

  const saveField = (field: FormField) => {
    if (editingField?.id) {
      // Update existing
      const index = fields.findIndex((f) => f.id === editingField.id)
      if (index !== -1) {
        const newFields = [...fields]
        newFields[index] = { ...field, id: editingField.id }
        setFields(newFields)
      }
    } else {
      // Add new
      setFields([...fields, { ...field, order: fields.length }])
    }
    setShowFieldEditor(false)
    setEditingField(null)
  }

  const handleSave = () => {
    onSave({
      ...designData,
      fields: fields.map((f, i) => ({ ...f, order: i })),
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab('design')}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'design'
                ? 'text-yellow-600 border-b-2 border-yellow-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            🎨 Tùy biến giao diện
          </button>
          <button
            onClick={() => setActiveTab('fields')}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'fields'
                ? 'text-yellow-600 border-b-2 border-yellow-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📝 Quản lý trường
          </button>
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'design' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Tùy biến giao diện form</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tiêu đề form
              </label>
              <input
                type="text"
                value={designData.formTitle || ''}
                onChange={(e) => setDesignData({ ...designData, formTitle: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="Nhập tiêu đề form"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nội dung mô tả (HTML)
              </label>
              <textarea
                value={designData.formContent || ''}
                onChange={(e) => setDesignData({ ...designData, formContent: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                rows={4}
                placeholder="Nhập nội dung mô tả (có thể dùng HTML)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL Banner
              </label>
              <input
                type="url"
                value={designData.bannerUrl || ''}
                onChange={(e) => setDesignData({ ...designData, bannerUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="https://..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Màu chính
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={designData.primaryColor || '#F59E0B'}
                    onChange={(e) => setDesignData({ ...designData, primaryColor: e.target.value })}
                    className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={designData.primaryColor || '#F59E0B'}
                    onChange={(e) => setDesignData({ ...designData, primaryColor: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder="#F59E0B"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Màu phụ
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={designData.secondaryColor || '#FCD34D'}
                    onChange={(e) => setDesignData({ ...designData, secondaryColor: e.target.value })}
                    className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={designData.secondaryColor || '#FCD34D'}
                    onChange={(e) => setDesignData({ ...designData, secondaryColor: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder="#FCD34D"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Màu nền
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={designData.backgroundColor || '#FFFFFF'}
                    onChange={(e) => setDesignData({ ...designData, backgroundColor: e.target.value })}
                    className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={designData.backgroundColor || '#FFFFFF'}
                    onChange={(e) => setDesignData({ ...designData, backgroundColor: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder="#FFFFFF"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Màu chữ
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={designData.textColor || '#111827'}
                    onChange={(e) => setDesignData({ ...designData, textColor: e.target.value })}
                    className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={designData.textColor || '#111827'}
                    onChange={(e) => setDesignData({ ...designData, textColor: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder="#111827"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'fields' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Quản lý trường form</h3>
              <button
                onClick={addField}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm"
              >
                ➕ Thêm trường
              </button>
            </div>

            {fields.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Chưa có trường nào. Nhấn "Thêm trường" để bắt đầu.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {fields
                  .sort((a, b) => a.order - b.order)
                  .map((field, index) => (
                    <div
                      key={field.id || index}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{field.label}</span>
                          <span className="text-xs text-gray-500">({field.type})</span>
                          {field.required && (
                            <span className="text-xs text-red-500">*</span>
                          )}
                        </div>
                        {field.placeholder && (
                          <div className="text-xs text-gray-400 mt-1">{field.placeholder}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => moveField(index, 'up')}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          title="Di chuyển lên"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveField(index, 'down')}
                          disabled={index === fields.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          title="Di chuyển xuống"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => editField(field)}
                          className="p-1 text-blue-600 hover:text-blue-700"
                          title="Chỉnh sửa"
                        >
                          <Icon name="edit" size={16} />
                        </button>
                        <button
                          onClick={() => deleteField(index)}
                          className="p-1 text-red-600 hover:text-red-700"
                          title="Xóa"
                        >
                          <Icon name="trash" size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Field Editor Modal */}
        {showFieldEditor && editingField && (
          <FieldEditor
            field={editingField}
            onSave={saveField}
            onCancel={() => {
              setShowFieldEditor(false)
              setEditingField(null)
            }}
          />
        )}

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3 pt-6 border-t border-gray-200">
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
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  )
}

// Field Editor Component
function FieldEditor({
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
            {field.id ? 'Chỉnh sửa trường' : 'Thêm trường mới'}
          </h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên trường (name) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              required
              placeholder="field_name"
            />
            <p className="text-xs text-gray-500 mt-1">Tên dùng để lưu dữ liệu (không dấu, không khoảng trắng)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nhãn hiển thị <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              required
              placeholder="Nhãn hiển thị"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loại trường <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.type}
              onChange={(e) => {
                const newType = e.target.value as FormField['type']
                setFormData({
                  ...formData,
                  type: newType,
                  // Clear options if switching to non-option type
                  options: needsOptions ? formData.options : undefined,
                })
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              <option value="TEXT">Text</option>
              <option value="EMAIL">Email</option>
              <option value="PHONE">Phone</option>
              <option value="NUMBER">Number</option>
              <option value="DATE">Date</option>
              <option value="SELECT">Select (Dropdown)</option>
              <option value="MULTISELECT">Multi Select</option>
              <option value="TEXTAREA">Textarea</option>
              <option value="CHECKBOX">Checkbox</option>
              <option value="RADIO">Radio</option>
              <option value="FILE">File Upload</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Placeholder
            </label>
            <input
              type="text"
              value={formData.placeholder || ''}
              onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              placeholder="Placeholder text"
            />
          </div>

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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Độ rộng
              </label>
              <select
                value={formData.width || 'full'}
                onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="full">Toàn bộ</option>
                <option value="half">Một nửa</option>
                <option value="third">Một phần ba</option>
                <option value="quarter">Một phần tư</option>
              </select>
            </div>
          </div>

          {needsOptions && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tùy chọn
              </label>
              <div className="space-y-2 mb-3">
                {formData.options?.map((option, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <span className="flex-1 text-sm">
                      <strong>{option.label}</strong> ({option.value})
                    </span>
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
                  placeholder="Nhãn"
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Văn bản trợ giúp
            </label>
            <input
              type="text"
              value={formData.helpText || ''}
              onChange={(e) => setFormData({ ...formData, helpText: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              placeholder="Văn bản hiển thị dưới trường"
            />
          </div>
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

