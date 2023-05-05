import { proxy } from 'valtio'
import { watch } from 'valtio/utils'
const state = proxy({
    mesh: { color: '#FFFFFF', texture: 'color-texture' },
    laces: { color: '#EFBD4E', texture: 'table-texture' },
    inner: { color: '#EFBD4E', texture: 'pattern-texture' },
    caps: { color: '#EFBD4E', texture: 'color-texture' },
    sole: { color: '#FFFFFF', texture: 'color-texture' },
    stripes: { color: '#FFFFFF', texture: 'floor-texture' },
    band: { color: '#FFFFFF', texture: 'floor-texture' },
    patch: { color: '#FFFFFF', texture: 'table-texture' },
    colors: ['#FFFFFF', '#EFBD4E', '#80C670', '#726DE8', '#EF674E', '#353934'],
    textures: ['floor-texture', 'blue-texture', 'color-texture', 'jeans-texture', 'pattern-texture', "table-texture"],
    rotation: [0.9, -2.5, -0.2],
    decals: ['nike', 'puma'],
    selectedDecal: 'nike',
    isMobile: false
})

export { state }
