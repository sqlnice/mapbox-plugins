// @flow
// 改成对应的mapbox源码中的引用地址
import type { LngLatBoundsLike } from "../geo/lng_lat_bounds";
import { extend, pick, bindAll, uniqueId } from "../util/util";
import Map from "../ui/map";
import LngLatBounds from "../geo/lng_lat_bounds";

/***
 * @description 分隔单位 d表示度,m表示分
 */
type IntervalUnit = "d" | "m";
/***
 * @description 标注精确格式,'xx°'|"xx°x′"|"xx°x′x″"
 */
type LabelFormatter = "degree" | "minute" | "second";
type LabelStyle = {
  textFont?: Array<string>,
  textSize?: number,
  textColor?: string,
  textHaloColor?: string,
  textHaloWidth?: number,
  textAnchor?: string,
  textRotate?: number,
  textOpacity?: number,
};
type StrokeStyle = {
  lineColor?: string,
  lineCap?: string,
  lineJoin?: string,
  lindDasharray?: Array<number>,
  lineWidth?: number,
  lineOpacity?: number,
};

type GraticuleLayerOptions = {
  showLabel?: boolean,
  showTick?: boolean,
  showBorder?: boolean,
  tickLength?: number,
  showGrid?: boolean,
  //opacity?: number,
  intervalUnit?: IntervalUnit,
  interval?: 10,
  bounds?: LngLatBoundsLike,
  minZoom?: number,
  maxZoom?: number,
  labelFormatter?: LabelFormatter,
  labelStyle?: LabelStyle,
  tickStyle?: StrokeStyle,
  gridStyle?: StrokeStyle,
  borderStyle?: StrokeStyle,
};
const defaultLabelStyle = {
  textFont: ["sans-serif"],
  textSize: 14,
  textColor: "#000000",
  textHaloColor: "rgba(0, 0, 0, 0)",
  textHaloWidth: 0,
  // textAnchor: "center",
  textRotate: 0,
  textOpacity: 1,
  textAllowOverlap: true,
};
const defaultStrokeStyle = {
  lineColor: "#B4C3D1",
  lineCap: "butt",
  lineJoin: "miter",
  lineWidth: 1,
  lineOpacity: 1,
  lineDasharray: [4, 4],
};
const defaultStrokeStyleTick = {
  lineColor: "#000000",
  lineCap: "butt",
  lineJoin: "miter",
  lineWidth: 2,
  lineOpacity: 1,
};
const defaultOptions = {
  showLabel: true, //是否显示标注
  showTick: true, //是否显示刻度线
  showBorder: true, //显示边框
  tickLength: 5, //刻度线长度,5像素
  showGrid: false, //是否显示网格线
  //opacity: 1,
  intervalUnit: "d",
  interval: 10,
  bounds: null, //[[-180, -85.051129], [180, 85.051129]],
  minZoom: 0,
  maxZoom: 22,
  labelFormatter: "second",
  labelStyle: defaultLabelStyle,
  tickStyle: defaultStrokeStyleTick,
  gridStyle: defaultStrokeStyle,
  borderStyle: defaultStrokeStyleTick,
};
const EMPTY_GEOSJON = {
  type: "FeatureCollection",
  features: [],
};
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
  showLabel: boolean;
  showTick: boolean;
  showBorder: Boolean;
  tickLength: number;
  showGrid: boolean;
  intervalUnit: IntervalUnit;
  interval: number;
  bounds: LngLatBoundsLike;
  minZoom: number;
  maxZoom: number;
  labelFormatter: LabelFormatter;
  labelStyle: LabelStyle;
  tickStyle: StrokeStyle;
  gridStyle: StrokeStyle;
  constructor(options: GraticuleLayerOptions) {
    var { labelStyle = {}, tickStyle = {}, gridStyle = {}, borderStyle = {} } =
      options || {};
    labelStyle = extend({}, defaultOptions.labelStyle, labelStyle);
    tickStyle = extend({}, defaultOptions.tickStyle, tickStyle);
    gridStyle = extend({}, defaultOptions.gridStyle, gridStyle);
    borderStyle = extend({}, defaultOptions.borderStyle, borderStyle);
    options.labelStyle = labelStyle;
    options.tickStyle = tickStyle;
    options.gridStyle = gridStyle;
    options.borderStyle = borderStyle;
    options = extend({}, defaultOptions, options);
    this._options = options;
    extend(
      this,
      pick(options, [
        "showLabel",
        "showTick",
        "tickLength",
        "showBorder",
        "showGrid",
        "intervalUnit",
        "interval",
        "bounds",
        "minZoom",
        "maxZoom",
        "labelStyle",
        "tickStyle",
        "gridStyle",
        "borderStyle",
        "labelFormatter",
      ])
    );
    this._map = null;
    this._layerIDs = null;
    bindAll(
      [
        "initLayersId",
        "addTo",
        "addLayers",
        "createLayer",
        "removeFromMap",
        "setBounds",
        "setInterval",
        "update",
        "toJSON",
      ],
      this
    );
  }
  addTo(map: Map) {
    if (map) {
      this._map = map;
      this.addLayers();
    } else {
      throw "Map 不能为空";
    }
    return this;
  }
  initLayersId() {
    if (!this._layerIDs) {
      this._layerIDs = {
        grid: "grid_" + uniqueId(),
        tick: "tick_" + uniqueId(),
        border: "border_" + uniqueId(),
        label: "label_" + uniqueId(),
      };
    }
  }
  /***
   *@description 设置bounds
   *@param {LngLatBoundsLike} bounds 网格地理范围
   */
  setBounds(bounds) {
    this.bounds = bounds;
    return this.addLayers();
  }
  /***
   *@description 设置bounds
   *@param {Number} interval 分隔区间
   *@param {IntervalUnit} unit 分隔单位,"d"|"m"
   */
  setInterval(interval, unit: IntervalUnit) {
    this.interval = interval;
    this.intervalUnit = unit;
    return this.addLayers();
  }
  /***
   * @description 刷新
   */
  update() {
    return this.addLayers();
  }
  /***
   * @description 创建mapbox 图层
   * @param {String} id 图层和数据源id
   * @param {String} type mapbox 图层类型
   * @param {StrokeStyle|LabelStyle} style 图层样式
   * @returns {Object} 返回mapbox 图层样式
   */
  createLayer(id, type, style) {
    var paint = {};
    var layout = {};
    if (type == "line") {
      paint = {
        "line-color": style.lineColor,
        "line-opacity": style.lineOpacity,
        "line-width": style.lineWidth,
      };
      if (style.lineDasharray && style.lineDasharray.length > 0) {
        paint["line-dasharray"] = style.lineDasharray;
      }
      layout = {
        "line-cap": style.lineCap,
        "line-join": style.lineJoin,
      };
    } else if (type == "symbol") {
      paint = {
        "text-color": style.textColor,
        "text-halo-color": style.textHaloColor,
        "text-halo-width": style.textHaloWidth,
        "text-opacity": style.textOpacity,
      };
      layout = {
        "text-font": style.textFont || ["sans-serif"],
        "text-size": style.textSize,
        "text-anchor": ["get", "anchor"],
        "text-rotate": ["get", "rotate"],
        "text-field": ["get", "label"],
        "text-allow-overlap": style.textAllowOverlap,
      };
    }
    return {
      id: id,
      type: type,
      source: id,
      minzoom: this.minZoom,
      maxzoom: this.maxZoom,
      paint: paint,
      layout: layout,
    };
  }
  addLayers() {
    var lines = this.computeGrid();
    var { lngLines = [], latLines = [] } = lines || {};
    var gridGeoJSON = EMPTY_GEOSJON;
    var tickGeoJSON = EMPTY_GEOSJON;
    var borderGeoJSON = EMPTY_GEOSJON;
    var labelGeoJSON = EMPTY_GEOSJON;
    if (!this._layerIDs) {
      this.initLayersId();
    }
    var gridLineId = this._layerIDs.grid; //网格线数据源和图层id
    var tickLineId = this._layerIDs.tick; //刻度线数据源和图层id
    var borderLineId = this._layerIDs.border; //边框数据源和图层id
    var labelId = this._layerIDs.label; //标注数据源和图层id
    //处理网格线图层
    if (this.showGrid) {
      gridGeoJSON = this.createGridLinesSource(lngLines, latLines);
      if (this._map.getSource(gridLineId)) {
        this._map.getSource(gridLineId).setData(gridGeoJSON);
      } else {
        this._map.addSource(gridLineId, { type: "geojson", data: gridGeoJSON });
      }
      if (!this._map.getLayer(gridLineId)) {
        this._map.addLayer(
          this.createLayer(gridLineId, "line", this.gridStyle)
        );
      }
    } else {
      if (this._map.getSource(gridLineId)) {
        this._map.removeSource(gridLineId);
      }
      if (this._map.getLayer(gridLineId)) {
        this._map.removeLayer(gridLineId);
      }
    }
    //处理刻度线图层
    if (this.showTick) {
      tickGeoJSON = this.createTickLinesSource(
        lngLines,
        latLines,
        this._map,
        this.tickLength
      );
      if (this._map.getSource(tickLineId)) {
        this._map.getSource(tickLineId).setData(tickGeoJSON);
      } else {
        this._map.addSource(tickLineId, { type: "geojson", data: tickGeoJSON });
      }
      if (!this._map.getLayer(tickLineId)) {
        this._map.addLayer(
          this.createLayer(tickLineId, "line", this.tickStyle)
        );
      }
    } else {
      if (this._map.getSource(tickLineId)) {
        this._map.removeSource(tickLineId);
      }
      if (this._map.getLayer(tickLineId)) {
        this._map.removeLayer(tickLineId);
      }
    }
    //处理边框图层
    if (this.showBorder) {
      borderGeoJSON = this.createBorderLinesSource(this.bounds);
      if (this._map.getSource(borderLineId)) {
        this._map.getSource(borderLineId).setData(borderGeoJSON);
      } else {
        this._map.addSource(borderLineId, {
          type: "geojson",
          data: borderGeoJSON,
        });
      }
      if (!this._map.getLayer(borderLineId)) {
        this._map.addLayer(
          this.createLayer(borderLineId, "line", this.borderStyle)
        );
      }
    } else {
      if (this._map.getSource(borderLineId)) {
        this._map.removeSource(borderLineId);
      }
      if (this._map.getLayer(borderLineId)) {
        this._map.removeLayer(borderLineId);
      }
    }
    //处理标注
    if (this.showLabel) {
      labelGeoJSON = this.createLabelPointsSource(
        lngLines,
        latLines,
        this._map,
        this.tickLength
      );
      if (this._map.getSource(labelId)) {
        this._map.getSource(labelId).setData(labelGeoJSON);
      } else {
        this._map.addSource(labelId, { type: "geojson", data: labelGeoJSON });
      }
      if (!this._map.getLayer(labelId)) {
        this._map.addLayer(
          this.createLayer(labelId, "symbol", this.labelStyle)
        );
      }
    } else {
      if (this._map.getSource(labelId)) {
        this._map.removeSource(labelId);
      }
      if (this._map.getLayer(labelId)) {
        this._map.removeLayer(labelId);
      }
    }
    return this;
  }
  /***
   * @description 创建网格线数据源
   * @param {Array} lngLines 经度网格线
   * @param {Array} latLines 纬度网格线
   * @returns {Object} 返回标准的GeoJSON数据源
   */
  createGridLinesSource(lngLines, latLines) {
    if (
      !lngLines ||
      lngLines.length == 0 ||
      !latLines ||
      latLines.length == 0
    ) {
      return EMPTY_GEOSJON;
    }
    var lineFeatures = [];
    //创建经度网格线
    var lines1 = lngLines.map((item) => {
      return {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: item,
        },
      };
    });
    //创建纬度网格线
    var lines2 = latLines.map((item) => {
      return {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: item,
        },
      };
    });
    lineFeatures.push(...lines1);
    lineFeatures.push(...lines2);
    return {
      type: "FeatureCollection",
      features: lineFeatures,
    };
  }
  /***
   * @description 创建网格线数据源
   * @param {Array} lngLines 经度网格线
   * @param {Array} latLines 纬度网格线
   * @param {Map} map Map对象
   * @param {Number} tickLen 刻度线长度
   * @returns {Object} 返回标准的GeoJSON数据源
   */
  createTickLinesSource(lngLines, latLines, map, tickLen) {
    if (
      !lngLines ||
      lngLines.length == 0 ||
      !latLines ||
      latLines.length == 0 ||
      !map
    ) {
      return EMPTY_GEOSJON;
    }
    tickLen = tickLen || 5;
    var lineFeatures = [];
    const createTickLine = function (lnglat, tick, xAxis) {
      var point = map.project(lnglat);
      if (xAxis) {
        //X轴
        point.x = point.x + tick;
      } else {
        //y轴
        point.y = point.y + tick;
      }
      var lnglat2 = map.unproject(point);
      return {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: [lnglat, [lnglat2.lng, lnglat2.lat]],
        },
      };
    };
    //创建经度网格线
    lngLines.forEach((item) => {
      lineFeatures.push(createTickLine(item[0], tickLen, false));
      lineFeatures.push(createTickLine(item[1], -tickLen, false));
    });
    //创建纬度网格线
    latLines.forEach((item) => {
      lineFeatures.push(createTickLine(item[0], -tickLen, true));
      lineFeatures.push(createTickLine(item[1], tickLen, true));
    });
    return {
      type: "FeatureCollection",
      features: lineFeatures,
    };
  }
  /***
   * @description 创建边框数据源
   * @param {LngLatBoundsLike}  bounds 经纬网格范围
   * @returns {Object} 标准的GeoJSON
   */
  createBorderLinesSource(bounds) {
    if (!bounds) {
      return EMPTY_GEOSJON;
    }
    var lngLatBounds = LngLatBounds.convert(bounds);
    var west = lngLatBounds.getWest();
    var east = lngLatBounds.getEast();
    var north = lngLatBounds.getNorth();
    var south = lngLatBounds.getSouth();
    var coordinates = [
      [west, south],
      [east, south],
      [east, north],
      [west, north],
      [west, south],
    ];
    return {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: coordinates,
          },
        },
      ],
    };
  }
  /***
   * @description 创建刻度标注数据源
   * @param {Array} lngLines 经度网格线
   * @param {Array} latLines 纬度网格线
   * @param {Map} map Map对象
   * @param {Number} tickLen 刻度线长度
   * @returns {Object} 返回标准的GeoJSON数据源
   */
  createLabelPointsSource(lngLines, latLines, map, tickLen) {
    if (
      !lngLines ||
      lngLines.length == 0 ||
      !latLines ||
      latLines.length == 0 ||
      !map
    ) {
      return EMPTY_GEOSJON;
    }
    tickLen = tickLen || 5;
    var features = [];
    var _self = this;
    var labelFormat = this.labelFormatter;
    const createPoint = function (lnglat, tick, xAxis, textAnchor) {
      var point = map.project(lnglat);
      var isLng = true;
      var rotate = 0;
      var num = 0;
      if (xAxis) {
        //X轴
        point.x = point.x + tick;
        isLng = false;
        rotate = -90;
        num = lnglat[1];
      } else {
        //y轴
        point.y = point.y + tick;
        isLng = true;
        rotate = 0;
        num = lnglat[0];
      }
      var lnglat2 = map.unproject(point);
      var label = _self.createlabelFormatter(num, isLng, labelFormat);
      return {
        type: "Feature",
        properties: {
          label: label,
          rotate: rotate,
          anchor: textAnchor,
        },
        geometry: {
          type: "Point",
          coordinates: [lnglat2.lng, lnglat2.lat],
        },
      };
    };
    //创建经度标签
    lngLines.forEach((item) => {
      //底部
      features.push(createPoint(item[0], tickLen, false, "top"));
      //顶部
      features.push(createPoint(item[1], -tickLen, false, "bottom"));
    });
    //创建纬度标签
    latLines.forEach((item) => {
      //左侧
      features.push(createPoint(item[0], -tickLen, true, "bottom"));
      features.push(createPoint(item[1], tickLen, true, "top"));
    });
    return {
      type: "FeatureCollection",
      features: features,
    };
  }
  /***
   * @description 根据bounds、interval等计算网格
   * @returns {Object} 返回经纬网格刻度坐标集合
   */
  computeGrid() {
    var bounds = LngLatBounds.convert(this.bounds);
    var west = bounds.getWest();
    var east = bounds.getEast();
    var north = bounds.getNorth();
    var south = bounds.getSouth();
    var intervalUnit = this.intervalUnit;
    var interval = this.interval;
    var minX = 0,
      maxX = 0,
      minY = 0,
      maxY = 0;
    var lngLines = [];
    var latLines = [];
    if (intervalUnit == "d") {
      //按度分隔
      minX = Math.ceil(west / interval) * interval;
      maxX = Math.floor(east / interval) * interval;
      minY = Math.ceil(south / interval) * interval;
      maxY = Math.floor(north / interval) * interval;
      for (var n = minX; n <= maxX; n += interval) {
        lngLines.push([
          [n, south],
          [n, north],
        ]);
      }
      for (var n = minY; n <= maxY; n += interval) {
        latLines.push([
          [west, n],
          [east, n],
        ]);
      }
    } else if (intervalUnit == "m") {
      //按分分隔
      minX = Math.ceil((west * 60) / interval) * interval;
      maxX = Math.floor((east * 60) / interval) * interval;
      minY = Math.ceil((south * 60) / interval) * interval;
      maxY = Math.floor((north * 60) / interval) * interval;
      for (var n = minX; n <= maxX; n += interval) {
        lngLines.push([
          [n / 60, south],
          [n / 60, north],
        ]);
      }
      for (var n = minY; n <= maxY; n += interval) {
        latLines.push([
          [west, n / 60],
          [east, n / 60],
        ]);
      }
    } else {
      throw "不支持分隔单位";
    }
    return { lngLines, latLines };
  }
  /***
   * @description 生成标注格式
   * @param {Number} num 经度值或纬度值
   * @param {Boolean} isLng 是否为经度
   * @param {String} labelFormat 显示格式
   * @return {String} 返回标签内容
   */
  createlabelFormatter(num, isLng, labelFormat) {
    function formatTag(value, isLng) {
      if (isLng) {
        //经度
        if (value > 0) {
          return "E";
        } else if (value < 0) {
          return "W";
        }
      } else {
        //纬度
        if (value > 0) {
          return "N";
        } else if (value < 0) {
          return "S";
        }
      }
      return "";
    }
    function formatDegree(value) {
      var tag = formatTag(value, isLng);
      value = Math.abs(value);
      var v1 = Math.floor(value); //度
      var v2 = Math.floor((value - v1) * 60); //分
      var v3 = Math.round(((value - v1) * 3600) % 60); //秒
      if (labelFormat == "degree") {
        //xx°
        return `${v1}°${tag}`;
      } else if (labelFormat == "minute") {
        //xx°xx'
        return `${v1}°${v2}'${tag}`;
      } else {
        //xx°xx'xx"
        return `${v1}°${v2}'${v3}"${tag}`;
      }
    }
    var label = formatDegree(num);
    return label;
  }
  /****
   * @description 移除经纬网格
   */
  removeFromMap() {
    if (this._map) {
      var { grid = null, tick = null, label = null, border = null } =
        this._layerIDs || {};
      if (grid) {
        if (this._map.getLayer(grid)) {
          this._map.removeLayer(grid);
        }
        if (this._map.getSource(grid)) {
          this._map.removeSource(grid);
        }
      }
      if (tick) {
        if (this._map.getLayer(tick)) {
          this._map.removeLayer(tick);
        }
        if (this._map.getSource(tick)) {
          this._map.removeSource(tick);
        }
      }
      if (border) {
        if (this._map.getLayer(border)) {
          this._map.removeLayer(border);
        }
        if (this._map.getSource(border)) {
          this._map.removeSource(border);
        }
      }
      if (label) {
        if (this._map.getLayer(label)) {
          this._map.removeLayer(label);
        }
        if (this._map.getSource(label)) {
          this._map.removeSource(label);
        }
      }
      this._map = null;
      this._layerIDs = null;
    }
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
    };
  }
}
export default GraticuleLayer;
