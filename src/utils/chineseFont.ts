/**
 * 中文字体加载工具
 * 用于jsPDF导出PDF时支持中文显示
 */

let fontLoaded = false
let cachedBase64: string | null = null
const FONT_NAME = 'NotoSansSC'

/**
 * 加载中文字体并注册到jsPDF实例
 * @param doc jsPDF实例
 */
export async function loadChineseFont(doc: any): Promise<void> {
  if (fontLoaded && cachedBase64) {
    doc.addFileToVFS(`${FONT_NAME}.ttf`, cachedBase64)
    doc.addFont(`${FONT_NAME}.ttf`, FONT_NAME, 'normal')
    doc.setFont(FONT_NAME)
    return
  }

  // 多个备选字体源
  const fontUrls = [
    // 思源黑体 SC Regular (Google Fonts CDN)
    'https://cdn.jsdelivr.net/gh/AspectRatio/aspect-ratio-core@0.0.11/dist/fonts/NotoSansSC-Regular.ttf',
    // 备选源
    'https://unpkg.com/@aspect-ratio/core@0.0.11/dist/fonts/NotoSansSC-Regular.ttf'
  ]

  for (const fontUrl of fontUrls) {
    try {
      const response = await fetch(fontUrl, {
        method: 'GET',
        mode: 'cors'
      })

      if (!response.ok) {
        continue
      }

      const fontBlob = await response.blob()

      // 检查文件大小，确保是有效的字体文件
      if (fontBlob.size < 100000) {
        continue
      }

      const base64 = await blobToBase64(fontBlob)

      // 注册字体到jsPDF
      doc.addFileToVFS(`${FONT_NAME}.ttf`, base64)
      doc.addFont(`${FONT_NAME}.ttf`, FONT_NAME, 'normal')
      doc.setFont(FONT_NAME)

      // 缓存字体数据
      cachedBase64 = base64
      fontLoaded = true
      console.log('中文字体加载成功')
      return
    } catch (error) {
      console.warn(`字体源加载失败: ${fontUrl}`, error)
      continue
    }
  }

  // 所有源都失败，使用内置字体
  console.warn('所有中文字体源加载失败，PDF中文可能显示为方框')
  doc.setFont('helvetica')
}

/**
 * Blob转Base64
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      // 移除 data:application/octet-stream;base64, 前缀
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * 获取字体名称
 */
export function getFontName(): string {
  return FONT_NAME
}
