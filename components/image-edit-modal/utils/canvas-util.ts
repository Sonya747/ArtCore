/**
 * 工具函数，用于操作fabric.Canvas
 * 注意：
 * 路径绘制、擦除、更改等操作在useHistory中通过事件监听处理
 * 矩形、箭头绘制会频繁创建/修改对象，在这里会标记isDrawing=true，在mouse:up后手动调用saveState
 */
import * as fabric from 'fabric'
/**
 * 设置所有对象的可选状态
 */
export const setObjectsSelectable = (canvas: fabric.Canvas, selectable: boolean) => {
  canvas.getObjects().forEach((obj) => {
    // 背景图片不可选择
    const objName = (obj as any).name
    if (objName !== 'background') {
      obj.selectable = selectable
    }
  })
}

/**
 * 设置所有对象的鼠标样式
 */
export const setObjectsCursor = (canvas: fabric.Canvas, hover: string, move: string) => {
  canvas.getObjects().forEach((obj) => {
    obj.hoverCursor = hover
    obj.moveCursor = move
  })
}

/**
 * 激活绘制模式
 */
export const activateDrawingMode = (canvas: fabric.Canvas, brushWidth: number, color: string) => {
  // 确保启用绘制模式
  canvas.isDrawingMode = true

  // 获取或创建笔刷
  let brush = canvas.freeDrawingBrush
  if (!brush) {
    // 如果没有笔刷，创建一个 PencilBrush
    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas)
    brush = canvas.freeDrawingBrush
  }

  brush.width = brushWidth
  brush.color = color
}

/**
 * 激活蒙版绘制模式
 * 在绘制模式下，将创建的路径标记为蒙版对象
 */
export const activateMaskMode = (
  canvas: fabric.Canvas,
  brushWidth: number,
  addMaskObject: (obj: fabric.FabricObject) => void
) => {
  // 启用绘制模式并设置笔刷
  canvas.isDrawingMode = true

  // 获取或创建笔刷
  let brush = canvas.freeDrawingBrush
  if (!brush) {
    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas)
    brush = canvas.freeDrawingBrush
  }

  brush.width = brushWidth
  brush.color = 'rgba(255, 255, 255, 0.7)'

  // 监听路径创建事件，将绘制的路径标记为蒙版对象
  const handlePathCreated = (options: { path: fabric.FabricObject }) => {
    const path = options.path as fabric.Path
    if (path && path.type === 'path') {
      // 标记为蒙版对象
      addMaskObject(path)
    }
  }

  canvas.on('path:created', handlePathCreated)

  // 返回清理函数
  return () => {
    canvas.off('path:created', handlePathCreated)
  }
}

/**
 * 激活橡皮擦模式
 * 效果为：鼠标按下移动时擦除经过的对象
 */
export const activateEraser = (_canvas: fabric.Canvas, _brushWidth: number) => {
  // 设置鼠标样式
  if (_canvas.upperCanvasEl) {
    ;(_canvas.upperCanvasEl as HTMLCanvasElement).style.cursor = 'crosshair'
  }

  let isErasing = false
  const erasedObjects = new Set<fabric.FabricObject>()

  // 鼠标按下，开始擦除
  const handleMouseDown = (options: any) => {
    isErasing = true
    // 检测当前位置的对象
    const target = _canvas.findTarget(options.e as any)
    if (target && (target as any).name !== 'background') {
      _canvas.remove(target)
      erasedObjects.add(target)
      _canvas.renderAll()
    }
  }

  // 鼠标移动，擦除经过的对象
  const handleMouseMove = (options: any) => {
    if (!isErasing) return

    // 检测当前位置的对象
    const target = _canvas.findTarget(options.e as any)
    if (target && (target as any).name !== 'background' && !erasedObjects.has(target)) {
      _canvas.remove(target)
      erasedObjects.add(target)
      _canvas.renderAll()
    }
  }

  // 鼠标抬起，停止擦除
  const handleMouseUp = () => {
    isErasing = false
    erasedObjects.clear()
    // _canvas.off("mouse:up");
  }

  // 添加事件监听器
  _canvas.on('mouse:down', handleMouseDown)
  _canvas.on('mouse:move', handleMouseMove)
  _canvas.on('mouse:up', handleMouseUp)

  // 返回清理函数
  return () => {
    _canvas.off('mouse:down')
    _canvas.off('mouse:move')
    _canvas.off('mouse:up')
  }
}

/**
 * 绘制矩形
 * 在这里会标记isDrawing标记绘制中，用在saveState中排除正在绘制中的对象
 * 在mouse:up时，移除isDrawing标记，调用saveState
 */
export const activateRectangleDrawing = (
  _canvas: fabric.Canvas,
  color: string,
  brushWidth: number,
  saveState: () => void
) => {
  let isDrawing = false
  let startPoint: fabric.Point | null = null
  let rect: fabric.Path | null = null

  /**
   * 创建矩形路径
   * fabric.Rect在findTarget、select之类的方法中无法正常检测，这里用Path代替
   */
  const createRectanglePath = (start: fabric.Point, end: fabric.Point): string => {
    const left = Math.min(start.x, end.x)
    const top = Math.min(start.y, end.y)
    const right = Math.max(start.x, end.x)
    const bottom = Math.max(start.y, end.y)

    // 创建矩形路径：从左上角开始，顺时针绘制
    return `M ${left} ${top} L ${right} ${top} L ${right} ${bottom} L ${left} ${bottom} Z`
  }

  const handleMouseDown = (options: any) => {
    // 检查是否点击了已存在的对象
    const target = options.target || _canvas.findTarget(options.e as any)
    if (target && (target as any).name !== 'background') {
      return
    }
    isDrawing = true
    startPoint = options.pointer

    if (!startPoint) return

    // 创建初始路径（宽度和高度为0）
    const initialPath = createRectanglePath(startPoint, startPoint)
    rect = new fabric.Path(initialPath, {
      fill: 'transparent',
      stroke: color,
      strokeWidth: brushWidth,
      selectable: true,
      isDrawing: true,
    })

    _canvas.add(rect)
    _canvas.renderAll()
  }

  // 鼠标移动，移除旧的路径，创建新的路径
  const handleMouseMove = (options: any) => {
    if (!isDrawing || !startPoint || !rect) return

    const pointer = options.pointer
    const rectPath = createRectanglePath(startPoint, pointer)

    // 移除旧的路径
    if (rect) {
      _canvas.remove(rect)
    }

    // 创建新的路径
    rect = new fabric.Path(rectPath, {
      fill: 'transparent', // Path 支持透明填充且能正常检测
      stroke: color,
      strokeWidth: brushWidth,
      selectable: true,
      isDrawing: true, // 标记为正在绘制中，用于saveState
    } as any)

    _canvas.add(rect)
    _canvas.renderAll()
  }

  const handleMouseUp = () => {
    if (rect) {
      ;(rect as any).isDrawing = false
      _canvas.renderAll()
    }
    isDrawing = false
    startPoint = null
    rect = null
    saveState()
  }

  _canvas.on('mouse:down', handleMouseDown)
  _canvas.on('mouse:move', handleMouseMove)
  _canvas.on('mouse:up', handleMouseUp)

  return () => {
    _canvas.off('mouse:down')
    _canvas.off('mouse:move')
    _canvas.off('mouse:up')
  }
}

/**
 * 激活文字模式
 * 点击位置插入文字
 */
export const activateTextMode = (
  _canvas: fabric.Canvas,
  fontSize: number,
  textContent: string,
  color: string
) => {
  const handleMouseDown = (options: any) => {
    const pointer = options.pointer
    if (!pointer) return

    // 检查是否点击了已存在的对象
    const target = options.target || _canvas.findTarget(options.e as any)
    if (target && (target as any).name !== 'background') {
      return
    }

    // 如果没有文本内容，使用默认内容
    const text = textContent.trim() || '文本'

    // 创建 IText 对象，支持编辑
    const textObject = new fabric.IText(text, {
      left: pointer.x,
      top: pointer.y,
      fontSize,
      fill: color,
      selectable: true,
      fontFamily: 'Arial',
    })

    _canvas.add(textObject)
    _canvas.setActiveObject(textObject)
    _canvas.renderAll()
  }

  // 设置鼠标样式
  if (_canvas.upperCanvasEl) {
    ;(_canvas.upperCanvasEl as HTMLCanvasElement).style.cursor = 'text'
  }

  _canvas.on('mouse:down', handleMouseDown)

  return () => {
    _canvas.off('mouse:down', handleMouseDown)
  }
}

/**
 * 绘制箭头
 * 使用的是fabric.Path
 */
export const activateArrowDrawing = (
  _canvas: fabric.Canvas,
  color: string,
  brushWidth: number,
  saveState: () => void
) => {
  let isDrawing = false
  let startPoint: fabric.Point | null = null
  let arrow: fabric.Path | null = null

  const createArrow = (start: fabric.Point, end: fabric.Point, width: number): string => {
    const dx = end.x - start.x
    const dy = end.y - start.y
    const angle = Math.atan2(dy, dx)

    const arrowHeadLength = width * 2 // 三角形箭头长度
    const arrowThickness = width / 3 // 箭头厚度

    // 箭头主体和三角形交界处（距离终点 arrowHeadLength）
    const junctionX = end.x - arrowHeadLength * Math.cos(angle)
    const junctionY = end.y - arrowHeadLength * Math.sin(angle)

    // 垂直于箭头的角度
    const perpAngle = angle + Math.PI / 2
    const halfThickness = arrowThickness / 2

    // 矩形主体的四个角
    const leftBottomX = start.x + halfThickness * Math.cos(perpAngle)
    const leftBottomY = start.y + halfThickness * Math.sin(perpAngle)
    const rightBottomX = start.x - halfThickness * Math.cos(perpAngle)
    const rightBottomY = start.y - halfThickness * Math.sin(perpAngle)
    const rightTopX = junctionX - halfThickness * Math.cos(perpAngle)
    const rightTopY = junctionY - halfThickness * Math.sin(perpAngle)
    const leftTopX = junctionX + halfThickness * Math.cos(perpAngle)
    const leftTopY = junctionY + halfThickness * Math.sin(perpAngle)

    // 三角形箭头的底边两点
    const triangleBaseWidth = arrowThickness * 2
    const halfTriangleWidth = triangleBaseWidth / 2
    const leftTriangleX = junctionX + halfTriangleWidth * Math.cos(perpAngle)
    const leftTriangleY = junctionY + halfTriangleWidth * Math.sin(perpAngle)
    const rightTriangleX = junctionX - halfTriangleWidth * Math.cos(perpAngle)
    const rightTriangleY = junctionY - halfTriangleWidth * Math.sin(perpAngle)

    // 创建闭合的箭头路径：矩形 + 三角形
    const path = `M ${leftBottomX} ${leftBottomY} L ${rightBottomX} ${rightBottomY} L ${rightTopX} ${rightTopY} L ${rightTriangleX} ${rightTriangleY} L ${end.x} ${end.y} L ${leftTriangleX} ${leftTriangleY} L ${leftTopX} ${leftTopY} Z`
    return path
  }

  const handleMouseDown = (options: any) => {
    // 检查是否点击了已存在的对象
    const target = options.target || _canvas.findTarget(options.e as any)
    if (target && (target as any).name !== 'background') {
      return
    }
    isDrawing = true
    startPoint = options.pointer
  }

  const handleMouseMove = (options: any) => {
    if (!isDrawing || !startPoint) return

    const pointer = options.pointer
    const arrowPath = createArrow(startPoint, pointer, brushWidth)

    // 如果已经存在箭头，删除它
    if (arrow) {
      _canvas.remove(arrow)
    }

    arrow = new fabric.Path(arrowPath, {
      fill: color, // 实心填充
      stroke: color,
      strokeWidth: Math.max(1, brushWidth / 4), // 边框宽度
      selectable: true,
      isDrawing: true, // 标记为正在绘制中
    } as any)

    _canvas.add(arrow)
    _canvas.renderAll()
  }

  const handleMouseUp = () => {
    // 移除绘制标记并标记为刚完成绘制
    if (arrow) {
      ;(arrow as any).isDrawing = false
      _canvas.renderAll()
      arrow = null
    }
    saveState()
    isDrawing = false
    startPoint = null
  }

  _canvas.on('mouse:down', handleMouseDown)
  _canvas.on('mouse:move', handleMouseMove)
  _canvas.on('mouse:up', handleMouseUp)

  return () => {
    _canvas.off('mouse:down')
    _canvas.off('mouse:move')
    _canvas.off('mouse:up')
  }
}
