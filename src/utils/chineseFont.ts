/**
 * 中文字体加载工具
 * 用于jsPDF导出PDF时支持中文显示
 * 字体文件存放在 public/fonts/ 目录，构建后可直接通过 /fonts/ 路径访问
 */

let cachedBase64: string | null = null
const FONT_NAME = 'NotoSansSC'
const FONT_FILE = '/fonts/NotoSansCJKsc-Regular.otf'

/**
 * 加载中文字体并注册到jsPDF实例
 * @param doc jsPDF实例
 */
export async function loadChineseFont(doc: any): Promise<void> {
  if (cachedBase64) {
    doc.addFileToVFS(`${FONT_NAME}.otf`, cachedBase64)
    doc.addFont(`${FONT_NAME}.otf`, FONT_NAME, 'normal')
    doc.setFont(FONT_NAME)
    return
  }

  try {
    const response = await fetch(FONT_FILE)
    if (!response.ok) {
      throw new Error(`字体文件加载失败: ${response.status}`)
    }

    const fontBlob = await response.blob()

    if (fontBlob.size < 100000) {
      throw new Error(`字体文件过小(${fontBlob.size}字节)，可能未正确部署`)
    }

    const base64 = await blobToBase64(fontBlob)

    doc.addFileToVFS(`${FONT_NAME}.otf`, base64)
    doc.addFont(`${FONT_NAME}.otf`, FONT_NAME, 'normal')
    doc.setFont(FONT_NAME)

    cachedBase64 = base64
  } catch (error) {
    console.error('中文字体加载失败:', error)
    throw error
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export function getFontName(): string {
  return FONT_NAME
}
