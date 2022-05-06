import mapboxgl from 'mapbox-gl'
import { GraticuleLayer } from './components/index'
import './app.css'
import 'mapbox-gl/dist/mapbox-gl.css'
function App() {
  const init = () => {
    let map: any,
      glayer: any = null
    mapboxgl.accessToken = 'pk.eyJ1Ijoic3FsLW5pY2UiLCJhIjoiY2wydTN1NTB3MGFnNTNibXFmNmc4bjBuayJ9.1p3nnLYbExHKZ7S5SVhDtQ'
    map = new mapboxgl.Map({
      container: 'map', // container ID
      style: 'mapbox://styles/mapbox/streets-v11', // style URL
      center: [120.73, 31.26], // starting position [lng, lat]
      zoom: 9, // starting zoom
    })
    map.on('load', function () {
      glayer = new GraticuleLayer({
        showLabel: true,
        showGrid: true,
        showTick: true,
        bounds: [
          [120.5, 31],
          [121, 31.4],
        ],
        showBorder: true,
        tickLength: 8,
        intervalUnit: 'm',
      })
      glayer.addTo(map)
    })
    let flag = true
    map.on('move', function () {
      if (glayer) {
        if (glayer.intervalUnit === 'm') {
          if (flag) {
            flag = false
            setTimeout(() => {
              glayer.update()
              flag = true
            }, 500)
          }
        } else {
          glayer.update()
        }
      }
    })
  }

  setTimeout(() => {
    init()
  }, 1000)
  return <div id='map'></div>
}

export default App
