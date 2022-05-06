// @flow
// 该文件要与mapbox源码集成，引用改为mapbox源码中对应的引用地址
import { LngLatBoundsLike, Map, LngLatBounds } from 'mapbox-gl'
import { extend, pick, bindAll, uniqueId } from './util'
import { vec2 } from 'gl-matrix'

/***
 * @description 分隔单位 d表示度,m表示分
 */
type IntervalUnit = 'd' | 'm'
/***
 * @description 标注精确格式,'xx°'|"xx°x′"|"xx°x′x″"
 */
type LabelFormatter = 'degree' | 'minute' | 'second'
type LabelStyle = {
  color?: string
  fontFamily?: string
  fontSize?: number
  fontWeight?: string | number
  rotate?: number
  rotationAlignment?: string
  allowOverlap?: boolean
}
type StrokeStyle = {
  lineColor?: string
  lineCap?: string
  lineJoin?: string
  lindDasharray?: Array<number>
  lineWidth?: number
  lineOpacity?: number
}

type GraticuleLayerOptions = {
  showLabel?: boolean
  showTick?: boolean
  showBorder?: boolean
  tickLength?: number
  showGrid?: boolean
  //opacity?: number,
  intervalUnit?: IntervalUnit
  interval?: 10
  bounds?: LngLatBoundsLike
  minZoom?: number
  maxZoom?: number
  labelFormatter?: LabelFormatter
  labelStyle?: LabelStyle
  tickStyle?: StrokeStyle
  gridStyle?: StrokeStyle
  borderStyle?: StrokeStyle
}
const defaultLabelStyle = {
  color: '#000000',
  fontFamily: 'sans-serif',
  fontSize: 16,
  fontWeight: 'normal',
  rotate: 0,
  rotationAlignment: 'map',
  allowOverlap: true,
}
const defaultStrokeStyle = {
  lineColor: '#B4C3D1',
  lineCap: 'butt',
  lineJoin: 'miter',
  lineWidth: 1,
  lineOpacity: 1,
  lineDasharray: [4, 4],
}
const defaultStrokeStyleTick = {
  lineColor: '#000000',
  lineCap: 'butt',
  lineJoin: 'miter',
  lineWidth: 2,
  lineOpacity: 1,
}
const defaultOptions = {
  showLabel: true, //是否显示标注
  showTick: true, //是否显示刻度线
  showBorder: true, //显示边框
  tickLength: 5, //刻度线长度,5像素
  showGrid: false, //是否显示网格线
  //opacity: 1,
  intervalUnit: 'd',
  interval: 10,
  bounds: null, //[[-180, -85.051129], [180, 85.051129]],
  minZoom: 0,
  maxZoom: 22,
  labelFormatter: 'second',
  labelStyle: defaultLabelStyle,
  tickStyle: defaultStrokeStyleTick,
  gridStyle: defaultStrokeStyle,
  borderStyle: defaultStrokeStyleTick,
}
const EMPTY_GEOSJON = {
  type: 'FeatureCollection',
  features: [],
}
/**
 * 经纬网图层
 * object.
 * @param {Object} options
 * @param {boolean} [options.showLabel=true] 是否显示标签,可选.
 * @param {boolean} [options.showTick=true] 是否显示刻度线,可选.
 * @param {number} [options.tickLength=5] 刻度线长度,可选.
 * @param {boolean} [options.showBorder=true] 是否显示边框,可选.
 * @param {boolean} [options.showGrid=false] 是否显示网格线,可选.
 * @param {string} [options.intervalUnit="d"] 经纬度的间隔单位,值为d|m,d表示度,m表示分;
 * @param {number} [options.interval=10] 经纬度的间隔（以度为单位)
 * @param {LngLatBoundsLike} [options.bounds] 经纬网渲染的边界范围,默认全球
 * @param {number} [options.minZoom=0] 最小视图缩放级别（包括此级别），该层将可见。
 * @param {number} [options.maxZoom=22] 最大视图缩放级别（包括此级别），该层将可见。
 * @param {LabelFormatter} [options.labelFormatter="second"] 标签。
 * @param {LabelStyle} [options.labelStyle] 标签样式。参数mapbox symbol
 * @param {StrokeStyle} [options.tickStyle] 绘制刻度线的样式。参数mapbox line
 * @param {StrokeStyle} [options.gridStyle] 绘制网格线的样式。参数mapbox line
 * @param {StrokeStyle} [options.borderStyle] 绘制边框线的样式。参数mapbox line
 *
 *
 * @example
 * @see [Display a map](https://www.mapbox.com/mapbox-gl-js/examples/)
 */
class GraticuleLayer {
  showLabel: boolean = true
  showTick: boolean = true
  showBorder: Boolean = true
  tickLength: number = 5
  showGrid: boolean = false
  intervalUnit: IntervalUnit = 'd'
  interval: number = 10
  bounds: LngLatBoundsLike = [
    [121, 37],
    [158, 82],
  ]
  minZoom: number = 0
  maxZoom: number = 22
  labelFormatter: LabelFormatter = 'second'
  labelStyle: LabelStyle = defaultLabelStyle
  tickStyle: StrokeStyle = defaultStrokeStyleTick
  gridStyle: StrokeStyle = defaultStrokeStyle
  borderStyle: StrokeStyle = defaultStrokeStyleTick
  _options
  _map: any
  _layerIDs: any
  _iconIds: any[] = []
  constructor(options: GraticuleLayerOptions) {
    let { labelStyle = {}, tickStyle = {}, gridStyle = {}, borderStyle = {} } = options || {}
    labelStyle = extend({}, defaultOptions.labelStyle, labelStyle)
    tickStyle = extend({}, defaultOptions.tickStyle, tickStyle)
    gridStyle = extend({}, defaultOptions.gridStyle, gridStyle)
    borderStyle = extend({}, defaultOptions.borderStyle, borderStyle)
    options.labelStyle = labelStyle
    options.tickStyle = tickStyle
    options.gridStyle = gridStyle
    options.borderStyle = borderStyle
    options = extend({}, defaultOptions, options)
    this._options = options
    extend(
      this,
      pick(options, [
        'showLabel',
        'showTick',
        'tickLength',
        'showBorder',
        'showGrid',
        'intervalUnit',
        'interval',
        'bounds',
        'minZoom',
        'maxZoom',
        'labelStyle',
        'tickStyle',
        'gridStyle',
        'borderStyle',
        'labelFormatter',
      ])
    )
    this._map = null
    this._layerIDs = null
    //存储图标ID数组
    this._iconIds = []
    bindAll(
      [
        'initLayersId',
        'addTo',
        'addLayers',
        'createLayer',
        'removeFromMap',
        'setBounds',
        'setInterval',
        'update',
        'toJSON',
      ],
      this
    )
  }
  /***
   * @description 生成图标
   */
  makeIconId() {
    return `graticule-icon-${uniqueId()}`
  }
  addTo(map: Map) {
    if (map) {
      this._map = map
      this.addLayers()
    } else {
      throw 'Map 不能为空'
    }
    return this
  }
  /***
   * @description 获取图层Id集合
   * @returns {Object}
   */
  getLayersId() {
    return this._layerIDs
  }
  initLayersId() {
    if (!this._layerIDs) {
      this._layerIDs = {
        grid: 'grid_' + uniqueId(),
        tick: 'tick_' + uniqueId(),
        border: 'border_' + uniqueId(),
        label: 'label_' + uniqueId(),
      }
    }
  }
  /***
   *@description 设置bounds
   *@param {LngLatBoundsLike} bounds 网格地理范围
   */
  setBounds(bounds: LngLatBoundsLike) {
    this.bounds = bounds
    return this.addLayers()
  }
  /***
   *@description 设置bounds
   *@param {Number} interval 分隔区间
   *@param {IntervalUnit} unit 分隔单位,"d"|"m"
   */
  setInterval(interval: number, unit: IntervalUnit) {
    this.interval = interval
    this.intervalUnit = unit
    return this.addLayers()
  }
  /***
   * @description 刷新
   */
  update() {
    return this.addLayers()
  }
  /***
   * @description 创建mapbox 图层
   * @param {String} id 图层和数据源id
   * @param {String} type mapbox 图层类型
   * @param {StrokeStyle|LabelStyle} style 图层样式
   * @returns {Object} 返回mapbox 图层样式
   */
  createLayer(id: string, type: string, style: any) {
    let paint: any = {}
    let layout = {}
    if (type == 'line') {
      paint = {
        'line-color': style.lineColor,
        'line-opacity': style.lineOpacity,
        'line-width': style.lineWidth,
      }
      if (style.lineDasharray && style.lineDasharray.length > 0) {
        paint['line-dasharray'] = style.lineDasharray
      }
      layout = {
        'line-cap': style.lineCap,
        'line-join': style.lineJoin,
      }
    } else if (type == 'symbol') {
      //文本
      // paint = {
      //     "text-color": style.textColor,
      //     "text-halo-color": style.textHaloColor,
      //     "text-halo-width": style.textHaloWidth,
      //     "text-opacity": style.textOpacity
      // }
      // layout = {
      //     "text-font": style.textFont || ["sans-serif"],
      //     "text-size": style.textSize,
      //     "text-anchor": ["get", "anchor"],
      //     "text-rotate": ["get", "rotate"],
      //     "text-field": ["get", "label"],
      //     "text-allow-overlap": style.textAllowOverlap
      // }
      //符号
      paint = {}
      layout = {
        'icon-image': ['get', 'icon'],
        'icon-size': 1,
        'icon-anchor': ['get', 'anchor'],
        'icon-rotate': ['get', 'rotate'],
        'icon-allow-overlap': style.allowOverlap,
        'icon-rotation-alignment': style.rotationAlignment,
      }
    }
    return {
      id: id,
      type: type,
      source: id,
      minzoom: this.minZoom,
      maxzoom: this.maxZoom,
      paint: paint,
      layout: layout,
    }
  }
  addLayers() {
    let lines = this.computeGrid()
    let { lngLines = [], latLines = [] } = lines || {}
    let gridGeoJSON: any = EMPTY_GEOSJON
    let tickGeoJSON: any = EMPTY_GEOSJON
    let borderGeoJSON: any = EMPTY_GEOSJON
    let labelGeoJSON: any = EMPTY_GEOSJON
    if (!this._layerIDs) {
      this.initLayersId()
    }
    let gridLineId = this._layerIDs.grid //网格线数据源和图层id
    let tickLineId = this._layerIDs.tick //刻度线数据源和图层id
    let borderLineId = this._layerIDs.border //边框数据源和图层id
    let labelId = this._layerIDs.label //标注数据源和图层id
    //处理网格线图层
    if (this.showGrid) {
      gridGeoJSON = this.createGridLinesSource(lngLines, latLines)
      if (this._map.getSource(gridLineId)) {
        this._map.getSource(gridLineId).setData(gridGeoJSON)
      } else {
        this._map.addSource(gridLineId, { type: 'geojson', data: gridGeoJSON })
      }
      if (!this._map.getLayer(gridLineId)) {
        this._map.addLayer(this.createLayer(gridLineId, 'line', this.gridStyle))
      }
    } else {
      if (this._map.getSource(gridLineId)) {
        this._map.removeSource(gridLineId)
      }
      if (this._map.getLayer(gridLineId)) {
        this._map.removeLayer(gridLineId)
      }
    }
    //处理刻度线图层
    if (this.showTick) {
      tickGeoJSON = this.createTickLinesSource(lngLines, latLines, this._map, this.tickLength)
      if (this._map.getSource(tickLineId)) {
        this._map.getSource(tickLineId).setData(tickGeoJSON)
      } else {
        this._map.addSource(tickLineId, { type: 'geojson', data: tickGeoJSON })
      }
      if (!this._map.getLayer(tickLineId)) {
        this._map.addLayer(this.createLayer(tickLineId, 'line', this.tickStyle))
      }
    } else {
      if (this._map.getSource(tickLineId)) {
        this._map.removeSource(tickLineId)
      }
      if (this._map.getLayer(tickLineId)) {
        this._map.removeLayer(tickLineId)
      }
    }
    //处理边框图层
    if (this.showBorder) {
      borderGeoJSON = this.createBorderLinesSource(this.bounds)
      if (this._map.getSource(borderLineId)) {
        this._map.getSource(borderLineId).setData(borderGeoJSON)
      } else {
        this._map.addSource(borderLineId, { type: 'geojson', data: borderGeoJSON })
      }
      if (!this._map.getLayer(borderLineId)) {
        this._map.addLayer(this.createLayer(borderLineId, 'line', this.borderStyle))
      }
    } else {
      if (this._map.getSource(borderLineId)) {
        this._map.removeSource(borderLineId)
      }
      if (this._map.getLayer(borderLineId)) {
        this._map.removeLayer(borderLineId)
      }
    }
    //处理标注
    if (this.showLabel) {
      labelGeoJSON = this.createLabelPointsSource(lngLines, latLines, this._map, this.tickLength)
      if (this._map.getSource(labelId)) {
        this._map.getSource(labelId).setData(labelGeoJSON)
      } else {
        this._map.addSource(labelId, { type: 'geojson', data: labelGeoJSON })
      }
      if (!this._map.getLayer(labelId)) {
        this._map.addLayer(this.createLayer(labelId, 'symbol', this.labelStyle))
      }
    } else {
      if (this._map.getSource(labelId)) {
        this._map.removeSource(labelId)
      }
      if (this._map.getLayer(labelId)) {
        this._map.removeLayer(labelId)
      }
    }
    return this
  }
  /***
   * @description 创建网格线数据源
   * @param {Array} lngLines 经度网格线
   * @param {Array} latLines 纬度网格线
   * @returns {Object} 返回标准的GeoJSON数据源
   */
  createGridLinesSource(lngLines: any[], latLines: any[]) {
    if (!lngLines || lngLines.length == 0 || !latLines || latLines.length == 0) {
      return EMPTY_GEOSJON
    }
    let lineFeatures = []
    //创建经度网格线
    let lines1 = lngLines.map((item) => {
      return {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: item,
        },
      }
    })
    //创建纬度网格线
    let lines2 = latLines.map((item) => {
      return {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: item,
        },
      }
    })
    lineFeatures.push(...lines1)
    lineFeatures.push(...lines2)
    return {
      type: 'FeatureCollection',
      features: lineFeatures,
    }
  }
  /***
   * @description 创建网格线数据源
   * @param {Array} lngLines 经度网格线
   * @param {Array} latLines 纬度网格线
   * @param {Map} map Map对象
   * @param {Number} tickLen 刻度线长度
   * @returns {Object} 返回标准的GeoJSON数据源
   */
  createTickLinesSource(lngLines: any, latLines: any, map: Map, tickLen: number) {
    if (!lngLines || lngLines.length == 0 || !latLines || latLines.length == 0 || !map) {
      return EMPTY_GEOSJON
    }
    tickLen = tickLen || 5
    let lineFeatures: any = []
    const createTickLine = function (lnglat: any, offset: any, xAxis: any) {
      let point = map.project(lnglat)
      if (xAxis) {
        //X轴
        point.y = point.y + offset[1]
        point.x = point.x + offset[0]
      } else {
        //y轴
        point.y = point.y + offset[1]
        point.x = point.x + offset[0]
      }
      let lnglat2 = map.unproject(point)
      return {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: [lnglat, [lnglat2.lng, lnglat2.lat]],
        },
      }
    }
    let bearing = (map.getBearing() * Math.PI) / 180 //弧度
    let lngOffset: any = []
    vec2.rotate(lngOffset, [0, tickLen], [0, 0], bearing)
    let latOffset: any = []
    vec2.rotate(latOffset, [tickLen, 0], [0, 0], bearing)
    //创建经度刻度线
    lngLines.forEach((item: any) => {
      //底部
      lineFeatures.push(createTickLine(item[0], [-lngOffset[0], lngOffset[1]], false))
      //顶部
      lineFeatures.push(createTickLine(item[1], [lngOffset[0], -lngOffset[1]], false))
    })
    //创建纬度刻度线
    latLines.forEach((item: any) => {
      //左侧
      lineFeatures.push(createTickLine(item[0], [-latOffset[0], latOffset[1]], true))
      //左侧
      lineFeatures.push(createTickLine(item[1], [latOffset[0], -latOffset[1]], true))
    })
    return {
      type: 'FeatureCollection',
      features: lineFeatures,
    }
  }
  /***
   * @description 创建边框数据源
   * @param {LngLatBoundsLike}  bounds 经纬网格范围
   * @returns {Object} 标准的GeoJSON
   */
  createBorderLinesSource(bounds: LngLatBoundsLike) {
    if (!bounds) {
      return EMPTY_GEOSJON
    }
    let lngLatBounds = LngLatBounds.convert(bounds)
    let west = lngLatBounds.getWest()
    let east = lngLatBounds.getEast()
    let north = lngLatBounds.getNorth()
    let south = lngLatBounds.getSouth()
    let coordinates = [
      [west, south],
      [east, south],
      [east, north],
      [west, north],
      [west, south],
    ]
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: coordinates,
          },
        },
      ],
    }
  }
  /***
   * @description 创建刻度标注数据源
   * @param {Array} lngLines 经度网格线
   * @param {Array} latLines 纬度网格线
   * @param {Map} map Map对象
   * @param {Number} tickLen 刻度线长度
   * @returns {Object} 返回标准的GeoJSON数据源
   */
  createLabelPointsSource(lngLines: any, latLines: any, map: Map, tickLen: number) {
    if (!lngLines || lngLines.length == 0 || !latLines || latLines.length == 0 || !map) {
      return EMPTY_GEOSJON
    }
    tickLen = tickLen || 5
    let features: any = []
    let _self = this
    let labelFormat = this.labelFormatter
    let { color = '#000000', fontFamily = 'sans-serif', fontSize = 16, fontWeight = 'normal' } = this.labelStyle
    const createPoint = function (lnglat: any, offset: any, xAxis: any, textAnchor: any) {
      let point = map.project(lnglat)
      let isLng = true
      let rotate = 0
      let num = 0
      if (xAxis) {
        //X轴
        // point.x = point.x + tick;
        point.y = point.y + offset[1]
        point.x = point.x + offset[0]
        isLng = false
        rotate = -90
        num = lnglat[1]
      } else {
        //y轴
        //point.y = point.y + tick;
        point.y = point.y + offset[1]
        point.x = point.x + offset[0]
        isLng = true
        rotate = 0
        num = lnglat[0]
      }
      let lnglat2 = map.unproject(point)
      let label = _self.createlabelFormatter(num, isLng, labelFormat)

      let imageData = _self.drawLabel(label, fontFamily, fontSize, color, fontWeight)
      let iconId = _self.makeIconId()
      if (map.hasImage(iconId)) {
        map.updateImage(iconId, imageData)
      } else {
        map.addImage(iconId, imageData)
      }
      return {
        type: 'Feature',
        properties: {
          label: label,
          rotate: rotate,
          anchor: textAnchor,
          icon: iconId,
        },
        geometry: {
          type: 'Point',
          coordinates: [lnglat2.lng, lnglat2.lat],
        },
      }
    }
    let bearing = (map.getBearing() * Math.PI) / 180 //弧度
    let lngOffset: any = []
    vec2.rotate(lngOffset, [0, tickLen], [0, 0], bearing)
    let latOffset: any = []
    vec2.rotate(latOffset, [tickLen, 0], [0, 0], bearing)
    //创建经度标签
    lngLines.forEach((item: any) => {
      //底部
      features.push(createPoint(item[0], [-lngOffset[0], lngOffset[1]], false, 'top'))
      //顶部
      features.push(createPoint(item[1], [lngOffset[0], -lngOffset[1]], false, 'bottom'))
    })
    //创建纬度标签
    latLines.forEach((item: any) => {
      //左侧
      features.push(createPoint(item[0], [-latOffset[0], latOffset[1]], true, 'bottom'))
      //右侧
      features.push(createPoint(item[1], [latOffset[0], -latOffset[1]], true, 'top'))
    })
    return {
      type: 'FeatureCollection',
      features: features,
    }
  }
  /***
   * @description 根据bounds、interval等计算网格
   * @returns {Object} 返回经纬网格刻度坐标集合
   */
  computeGrid() {
    let bounds = LngLatBounds.convert(this.bounds)
    let west = bounds.getWest()
    let east = bounds.getEast()
    let north = bounds.getNorth()
    let south = bounds.getSouth()
    let intervalUnit = this.intervalUnit
    let interval = this.interval
    let minX = 0,
      maxX = 0,
      minY = 0,
      maxY = 0
    let lngLines = []
    let latLines = []
    if (intervalUnit == 'd') {
      //按度分隔
      minX = Math.ceil(west / interval) * interval
      maxX = Math.floor(east / interval) * interval
      minY = Math.ceil(south / interval) * interval
      maxY = Math.floor(north / interval) * interval
      for (let n = minX; n <= maxX; n += interval) {
        lngLines.push([
          [n, south],
          [n, north],
        ])
      }
      for (let n = minY; n <= maxY; n += interval) {
        latLines.push([
          [west, n],
          [east, n],
        ])
      }
    } else if (intervalUnit == 'm') {
      //按分分隔
      minX = Math.ceil((west * 60) / interval) * interval
      maxX = Math.floor((east * 60) / interval) * interval
      minY = Math.ceil((south * 60) / interval) * interval
      maxY = Math.floor((north * 60) / interval) * interval
      for (let n = minX; n <= maxX; n += interval) {
        lngLines.push([
          [n / 60, south],
          [n / 60, north],
        ])
      }
      for (let n = minY; n <= maxY; n += interval) {
        latLines.push([
          [west, n / 60],
          [east, n / 60],
        ])
      }
    } else {
      throw '不支持分隔单位'
    }
    return { lngLines, latLines }
  }
  /***
   * @description 生成标注格式
   * @param {Number} num 经度值或纬度值
   * @param {Boolean} isLng 是否为经度
   * @param {String} labelFormat 显示格式
   * @return {String} 返回标签内容
   */
  createlabelFormatter(num: number, isLng: boolean, labelFormat: string) {
    function formatTag(value: number, isLng: boolean) {
      if (isLng) {
        //经度
        if (value > 0) {
          return 'E'
        } else if (value < 0) {
          return 'W'
        }
      } else {
        //纬度
        if (value > 0) {
          return 'N'
        } else if (value < 0) {
          return 'S'
        }
      }
      return ''
    }
    function formatDegree(value: number) {
      let tag = formatTag(value, isLng)
      value = Math.abs(value)
      let v1 = Math.floor(value) //度
      let v2 = Math.floor((value - v1) * 60) //分
      let v3 = Math.round(((value - v1) * 3600) % 60) //秒
      if (labelFormat == 'degree') {
        //xx°
        return `${v1}°${tag}`
      } else if (labelFormat == 'minute') {
        //xx°xx'
        return `${v1}°${v2}'${tag}`
      } else {
        //xx°xx'xx"
        return `${v1}°${v2}'${v3}"${tag}`
      }
    }
    let label = formatDegree(num)
    return label
  }
  /****
   * @description 移除经纬网格
   */
  removeFromMap() {
    if (this._map) {
      let { grid = null, tick = null, label = null, border = null } = this._layerIDs || {}
      if (grid) {
        if (this._map.getLayer(grid)) {
          this._map.removeLayer(grid)
        }
        if (this._map.getSource(grid)) {
          this._map.removeSource(grid)
        }
      }
      if (tick) {
        if (this._map.getLayer(tick)) {
          this._map.removeLayer(tick)
        }
        if (this._map.getSource(tick)) {
          this._map.removeSource(tick)
        }
      }
      if (border) {
        if (this._map.getLayer(border)) {
          this._map.removeLayer(border)
        }
        if (this._map.getSource(border)) {
          this._map.removeSource(border)
        }
      }
      if (label) {
        if (this._map.getLayer(label)) {
          this._map.removeLayer(label)
        }
        if (this._map.getSource(label)) {
          this._map.removeSource(label)
        }
      }
      this._map = null
      this._layerIDs = null
    }
  }
  /***
   * @description 绘制文本
   * @param {String} text 文本内容
   * @param {String} fontFamily 字体名称
   * @param {Number} fontSize 文字大小
   * @param {String} color 文字颜色
   * @param {String} fontWeight 文字颜色
   * @returns {ImageData}
   */
  drawLabel(text: string, fontFamily = 'sans-serif', fontSize = 16, color = '#000000', fontWeight: any = 'normal') {
    let canvas = document.createElement('canvas')
    let len = text ? text.length : 0
    let pixelRatio = window.devicePixelRatio || 1
    let size = len == 0 ? 256 : len * fontSize
    canvas.width = canvas.height = size * pixelRatio
    canvas.style.width = size + 'px'
    canvas.style.height = size + 'px'
    let ctx = canvas.getContext('2d')!
    ctx.font = fontWeight + ' ' + fontSize + 'px ' + fontFamily
    ctx.textBaseline = 'middle'
    let width = ctx.measureText(text).width
    ctx.fillStyle = color
    ctx.fillText(text, 0, fontSize / 2)
    width = Math.round(width)
    return ctx.getImageData(0, 0, width, fontSize)
  }
  /***
   * @description 参数转成json格式
   */
  toJSON() {
    return {
      showLabel: this.showLabel,
      showTick: this.showTick,
      showBorder: this.showBorder,
      tickLength: this.tickLength,
      showGrid: this.showGrid,
      intervalUnit: this.intervalUnit,
      interval: this.interval,
      bounds: this.bounds,
      minZoom: this.minZoom,
      maxZoom: this.maxZoom,
      labelFormatter: this.labelFormatter,
      labelStyle: this.labelStyle,
      tickStyle: this.tickStyle,
      gridStyle: this.gridStyle,
      borderStyle: this.borderStyle,
    }
  }
  getMaxBounds() {}
}
export default GraticuleLayer
