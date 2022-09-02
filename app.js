
// Trigger download of a JSON file
const downloadJson = function(data, filename) {
  const json = JSON.stringify(data, null, '  ') + '\n';
  const blob = new Blob([json], {type: "application/json"});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Pick a color picker using browsers's built-in dialog
const pickColor = function(value, setter) {
  const input = document.createElement('input');
  input.type = 'color';
  // use the input itself to "resolve" the color
  input.style.color = value;
  input.value = rgb2hex(input.style.color);
  input.style.display = 'none';

  input.addEventListener('change', () => {
    setter(input.value);
  });

  document.body.appendChild(input);
  input.click();
  document.body.removeChild(input);
}

// Remove a CSSRule
const deleteCssRule = function(rule) {
  let rules = rule.parentStyleSheet.cssRules;
  for (let i = 0; i < rules.length; ++i) {
    if (rules[i] === rule) {
      rule.parentStyleSheet.deleteRule(i);
      break;
    }
  }
}

// Deep clone data using JSON serialization
const cloneData = function(data) {
  return JSON.parse(JSON.stringify(data));
}

// Convert a CSS-style rgb color to an hex color
const rgb2hex = function(rgb) {
  return '#' + (rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/)
    .slice(1)
    .map(n => parseInt(n, 10).toString(16).padStart(2, '0'))
    .join('')
  );
}

const NES_COLORS = [
  '#747474',
  '#24188C',
  '#0000A8',
  '#44009C',
  '#8C0074',
  '#A80010',
  '#A40000',
  '#7C0800',
  '#402C00',
  '#004400',
  '#005000',
  '#003C14',
  '#183C5C',
  '#000000',
  '#000000',
  '#000000',
  '#BCBCBC',
  '#0070EC',
  '#2038EC',
  '#8000F0',
  '#BC00BC',
  '#E40058',
  '#D82800',
  '#C84C0C',
  '#887000',
  '#009400',
  '#00A800',
  '#009038',
  '#008088',
  '#000000',
  '#000000',
  '#000000',
  '#FCFCFC',
  '#3CBCFC',
  '#5C94FC',
  '#CC88FC',
  '#F478FC',
  '#FC74B4',
  '#FC7460',
  '#FC9838',
  '#F0BC3C',
  '#80D010',
  '#4CDC48',
  '#58F898',
  '#00E8D8',
  '#787878',
  '#000000',
  '#000000',
  '#FCFCFC',
  '#A8E4FC',
  '#C4D4FC',
  '#D4C8FC',
  '#FCC4FC',
  '#FCC4D8',
  '#FCBCB0',
  '#FCD8A8',
  '#FCE4A0',
  '#E0FCA0',
  '#A8F0BC',
  '#B0FCCC',
  '#9CFCF0',
  '#C4C4C4',
  '#000000',
  '#000000',
]


const PALETTE_NAMES = ['primary_colors', 'secondary_colors', 'alternate_colors']
const MANDATORY_ANIMATION_NAMES = ['menu_select_animation', 'defeat_animation', 'victory_animation']

class Utils {
  static frameRect(frame, { boxes = false, origin = false, margin = 0 }) {
    const sprites_x = frame.sprites.map(s => s.x);
    const sprites_y = frame.sprites.map(s => s.y);
    let left = Math.min.apply(Math, sprites_x);
    let right = Math.max.apply(Math, sprites_x) + 7;
    let top = Math.min.apply(Math, sprites_y);
    let bottom = Math.max.apply(Math, sprites_y) + 7;

    if (boxes) {
      if (frame.hitbox) {
        left = Math.min(left, frame.hitbox.left);
        right = Math.max(right, frame.hitbox.right);
        top = Math.min(top, frame.hitbox.top);
        bottom = Math.max(bottom, frame.hitbox.bottom);
      }
      if (frame.hurtbox) {
        left = Math.min(left, frame.hurtbox.left);
        right = Math.max(right, frame.hurtbox.right);
        top = Math.min(top, frame.hurtbox.top);
        bottom = Math.max(bottom, frame.hurtbox.bottom);
      }
    }

    if (origin) {
      // make sure it includes the (Y-shifted) origin
      left = Math.min(left, 0);
      right = Math.max(right, -1);
      top = Math.min(top, 16);
      bottom = Math.max(bottom, 15);
    }

    return {
      x: left - margin,
      y: top - margin,
      width: right - left + 1 + 2 * margin,
      height: bottom - top + 1 + 2 * margin,
    }
  }

  static animationRect(animation, { margin = 0 }) {
    const rects = animation.frames
      .filter(f => f.sprites.length !== 0)
      .map(f => this.frameRect(f, { margin }));
    const x0 = Math.min(...rects.map(r => r.x));
    const y0 = Math.min(...rects.map(r => r.y));
    const x1 = Math.max(...rects.map(r => r.x + r.width));
    const y1 = Math.max(...rects.map(r => r.y + r.height));
    return {
      x: x0,
      y: y0,
      width: x1 - x0,
      height: y1 - y0,
    };
  }

  static getAnimationByName(tree, name) {
    for (let k of MANDATORY_ANIMATION_NAMES) {
      if (tree[k].name == name) {
        return tree[k];
      }
    }
    return tree.animations.find(anim => anim.name === name);
  }

  static getTileByName(tree, name) {
    const tileset = tree.tileset;
    const idx = tileset.tilenames.indexOf(name);
    return tileset.tiles[idx];
  }

  static drawSingleTile(ctx, tree, tile, { zoom = 1, palette, x = 0, y = 0, flip_x = false, flip_y = false }) {
    for (let [yy, row] of tile.representation.entries()) {
      for (let [xx, value] of row.entries()) {
        if (value === 0) {
          continue;  // transparent, don't draw
        }
        const pixel_x = x + (flip_x ? 7-xx : xx);
        const pixel_y = y + (flip_y ? 7-yy : yy);

        ctx.fillStyle = palette[value-1];
        ctx.fillRect(pixel_x * zoom, pixel_y * zoom, zoom, zoom);
      }
    }
  }

  static drawTile(ctx, tree, tile, { zoom = 1, background, palette }) {
    ctx.canvas.width = 8 * zoom;
    ctx.canvas.height = 8 * zoom;

    ctx.fillStyle = background;
    ctx.fillRect(0, 0, 8 * zoom, 8 * zoom);

    this.drawSingleTile(ctx, tree, tile, { zoom, palette })
  }

  static drawSingleSprite(ctx, tree, sprite, { zoom = 1, palettes, x = 0, y = 0 }) {
      const tile = this.getTileByName(tree, sprite.tile);
      if (tile === undefined) {
        return;  // avoid error when reloading a tree
      }
      const palette = palettes[sprite.attr & 0x1];
      const flip_x = sprite.attr & 0x40;
      const flip_y = sprite.attr & 0x80;
      this.drawSingleTile(ctx, tree, tile, { zoom, palette, x, y, flip_x, flip_y })
  }

  static drawSprite(ctx, tree, sprite, { zoom = 1, background, palettes }) {
    ctx.canvas.width = 8 * zoom;
    ctx.canvas.height = 8 * zoom;

    ctx.fillStyle = background;
    ctx.fillRect(0, 0, 8 * zoom, 8 * zoom);

    this.drawSingleSprite(ctx, tree, sprite, { zoom, palettes })
  }

  static drawSingleFrame(ctx, tree, frame, { zoom = 1, background, palettes, dx, dy }) {
    for (let sprite of frame.sprites) {
      if (!sprite.foreground) {
        const x = sprite.x + dx;
        const y = sprite.y + dy;
        this.drawSingleSprite(ctx, tree, sprite, { zoom, palettes, x, y  });
      }
    }
    for (let sprite of frame.sprites) {
      if (sprite.foreground) {
        const x = sprite.x + dx;
        const y = sprite.y + dy;
        this.drawSingleSprite(ctx, tree, sprite, { zoom, palettes, x, y  });
      }
    }
  }

  static drawFrame(ctx, tree, frame, { zoom = 1, background, palettes, rect = null }) {
    rect ||= this.frameRect(frame, {});
    ctx.canvas.width = rect.width * zoom;
    ctx.canvas.height = rect.height * zoom;

    ctx.fillStyle = background;
    ctx.fillRect(0, 0, rect.width * zoom, rect.height * zoom);

    this.drawSingleFrame(ctx, tree, frame, { zoom, palettes, dx: -rect.x, dy: -rect.y });
  }

  static getPalettes(tree, swap) {
    return PALETTE_NAMES.map(k => (
      tree.color_swaps[k][swap].colors.map(v => NES_COLORS[v])
    ));
  }

  static getAllPalettes(tree) {
    return tree.color_swaps.primary_colors.map((_, swap) => this.getPalettes(tree, swap));
  }

  static newTileName(tree) {
    const prefix = tree.name.toUpperCase() + '_TILE_';
    for (let i = 0; ; ++i) {
      name = prefix + i;
      if (!tree.tileset.tilenames.includes(name)) {
        return name;
      }
    }
  }

  static addNewTile(tree) {
    tree.tileset.tilenames.push(this.newTileName(tree));
    tree.tileset.tiles.push({
      type: 'tile',
      representation: Array.from({length: 8}).map(_ => Array(8).fill(0)),
    });
  }

  static getAnimationsUsingTile(tree, name) {
    const useTile = anim => anim.frames.some(frame => frame.sprites.some(sprite => sprite.tile === name));
    let result = tree.animations.filter(useTile);
    for (let k of MANDATORY_ANIMATION_NAMES) {
      if (useTile(tree[k])) {
        result.push(tree[k]);
      }
    }
    return result;
  }

  static newAnimationName(tree, prefix) {
    for (let i = 0; ; ++i) {
      name = i == 0 ? prefix : prefix + i;
      if (this.getAnimationByName(tree, name) === undefined) {
        return name;
      }
    }
  }

  static floodFillTile(pixels, x, y, color) {
    let filled_color = pixels[y][x];
    let stack = [[x, y]];
    while (stack.length) {
      let [x, y] = stack.pop();
      if (x < 0 || x > 7 || y < 0 || y > 7) {
        continue;
      } else if (pixels[y][x] === filled_color) {
        pixels[y][x] = color;
        stack.push([x-1, y], [x+1, y], [x, y-1], [x, y+1]);
      }
    }
  }
}


// Manage storage of character data
//
// Each "file" is stored in key `stbeditor.data.<name>`.
// An index is stored as `stbeditor.index`
class CharacterFileStorage {
  constructor(storage, onchange) {
    this.storage = storage;
    this.onchange = onchange;

    window.onstorage
  }

  setCharacterFile(name, data) {
    const index = this.loadIndex();
    index[name] = {'updated_at': Date.now()};
    this.storage.setItem(`stbeditor.data.${name}`, JSON.stringify(data));
    this.storage.setItem('stbeditor.index', JSON.stringify(index));
    this.onchange();
  }

  getCharacterFile(name) {
    const data = this.storage.getItem(`stbeditor.data.${name}`);
    if (data === null) {
      return null;
    } else {
      return JSON.parse(data);
    }
  }

  removeCharacterFile(name) {
    const index = this.loadIndex();
    delete index[name];
    this.storage.removeItem(`stbeditor.data.${name}`);
    this.storage.setItem('stbeditor.index', JSON.stringify(index));
    this.onchange();
  }

  clear() {
    for (let i = 0; i < this.storage.length; ++i) {
      const key = this.storage.key(i);
      if (key.startsWith('stbeditor.')) {
        this.removeItem(key);
      }
    }
    this.storage.clear();
  }

  loadIndex() {
    const data = this.storage.getItem('stbeditor.index');
    if (data === null) {
      return {};
    } else {
      // Assume JSON data is valid
      return JSON.parse(data);
    }
  }

  uniqueFileName(name) {
    const index = this.loadIndex();
    if (index[name] === undefined) {
      return name;
    }
    // Note: add an upper limit just in case, to avoid infinite loops
    for (let i = 1; i < 1000; ++i) {
      const new_name = `${name} ${i}`;
      if (index[new_name] === undefined) {
        return new_name;
      }
    }
  }
}


class Conf {
  color = 1;  // manually selected color
  colorSwap = 0;  // index of color swap
  bgColor = '#3CBCFC';  // background color, for transparency
  zoom = 16;  // zoom value (display pixel per tile pixel)
  tool = 'brush';  // active tool (brush, fill, select)
  toggledTool = null;  // previous tool, before toggling to 'select'
  grid = 'tiles';  // grid mode (off, tiles, pixels)
  boxes = 'on';  // hitbox/hurtbox mode (off, on)
  // Toolbar configuration (see resetToolbar())
  toolbar = null;

  static ZOOM_LEVELS = [2, 4, 8, 16, 24, 32, 48];

  constructor() {
    this.resetToolbar();
  }

  resetToolbar() {
    this.toolbar = {
      cssPalettes: ['picker-p0', 'picker-p1'],
      gridModes: ['off', 'tiles', 'pixels'],
    }
  }

  cycleColor() {
    this.color = this.color == 3 ? 1 : this.color + 1;
  }

  zoomStep(step) {
    const LEVELS = this.constructor.ZOOM_LEVELS
    const zoom = LEVELS.reduce((prev, cur) => (
      Math.abs(cur - this.zoom) < Math.abs(prev - this.zoom) ? cur : prev
    ));
    let idx = LEVELS.indexOf(zoom) + step;
    idx = Math.min(Math.max(idx, 0), LEVELS.length - 1);  // clamp
    this.zoom = LEVELS[idx];
  }

  palettes(tree) {
    return Utils.getPalettes(tree, this.colorSwap);
  }

  setTool(tool) {
    this.toggledTool = null;
    this.tool = tool;
  }

  toggleSelectTool() {
    if (this.tool === 'select') {
      this.tool = this.toggledTool || 'brush';
    } else {
      this.toggledTool = this.tool;
      this.tool = 'select';
    }
  }

  cycleTool() {
    if (this.tool === 'select') {
      this.tool = 'brush';
    } else if (this.tool === 'brush') {
      this.tool = 'fill';
    } else {
      this.tool = 'select';
    }
  }

  cycleGrid() {
    const modes = this.toolbar.gridModes;
    // Note: works if 'idx == -1'
    this.grid = modes[(modes.indexOf(this.grid) + 1) % modes.length];
  }

  toggleBoxes() {
    if (this.boxes == 'off') {
      this.boxes = 'on';
    } else {
      this.boxes = 'off';
    }
  }
}


const HISTORY_STATES_COUNT = 20;

const app = Vue.createApp({
  data() {
    return {
      tree: null,
      conf: new Conf(),
      characterFileIndex: [],
      characterUrls: {},
      currentCharacterFile: null,
      historyStates: [],
      historyPausedChanges: null,  // null: normal, false: paused, true: changes during pause
      routerKey: 0,  // dummy value used to force a router refresh
    }
  },

  provide() {
    return {
      tree: Vue.computed(() => this.tree),
      conf: Vue.computed(() => this.conf),
    }
  },

  mounted() {
    this.fetchStaticConf();

    // Setup stylesheet for dynamic styling
    let style = document.createElement("style");
    document.head.appendChild(style);
    this.sheet = style.sheet;
    this.cssRules = {};

    Vue.watchEffect(() => this.updateColorSwapRule());

    this.$watch('conf.bgColor', () => this.updateBgColorRule(), { immediate: true });
    this.$watch('conf.zoom', () => this.updateZoomRule(), { immediate: true });
    this.$watch('conf.grid', (val, _) => {
      const classes = this.$refs.content.classList;
      for (let x of ['off', 'tiles', 'pixels']) {
        classes.toggle('tool-grid-' + x, val === x);
      }
    }, { immediate: true });
    this.$watch('conf.boxes', (val, _) => {
      const classes = this.$refs.content.classList;
      for (let x of ['off', 'on']) {
        classes.toggle('tool-boxes-' + x, val === x);
      }
    }, { immediate: true });
    this.$watch('conf.tool', (val, _) => {
      const classes = this.$refs.content.classList;
      for (let x of ['select', 'brush', 'fill']) {
        classes.toggle('tool-' + x, val === x);
      }
    }, { immediate: true });

    // Reset toolbar when changing tab
    this.$watch('$route', () => {
      this.conf.resetToolbar();
    });

    // Handle undo history
    this.$watch('tree', (new_val) => {
      this.commitHistoryState();
    }, { deep: true });
  },

  created() {
    this.eventHandlers = [];

    // Setup simple key bindings
    this.registerEventListener(document, 'keydown', (ev) => {
      if (ev.target !== document.body) {
        return;
      }
      if (ev.key == 'c') {
        this.conf.cycleColor();
      } else if (ev.key == '+') {
        this.conf.zoomStep(+1);
      } else if (ev.key == '-') {
        this.conf.zoomStep(-1);
      } else if (ev.key == 's') {
        this.conf.toggleSelectTool();
      } else if (ev.key == 't') {
        this.conf.cycleTool();
      } else if (ev.key == 'g') {
        this.conf.cycleGrid();
      } else if (ev.key == 'b') {
        this.conf.toggleBoxes();
      } else if (ev.key == 'z' && ev.ctrlKey) {
        this.restoreHistoryState();
      }
    });

    // Setup the storage
    this.storage = new CharacterFileStorage(localStorage, this.reloadCharacterFileIndex);
    this.registerEventListener(document, 'storage', (ev) => {
      if (ev.storageArea !== this.storage.storage) {
        return;
      }
      if (ev.key !== null && ev.key !== 'stbeditor.index') {
        return;
      }
      this.reloadCharacterFileIndex();
    });
    this.reloadCharacterFileIndex();

    // Group all mousemove changes from a single mouse down/up
    this.registerEventListener(window, 'mousedown', (ev) => {
      this.historyPausedChanges = false;
    });
    let unpauseHistoryHandler = (ev) => {
      let commit = this.historyPausedChanges;
      this.historyPausedChanges = null;
      if (commit) {
        this.commitHistoryState();
      }
    }
    this.registerEventListener(window, 'mouseup', unpauseHistoryHandler);
    this.registerEventListener(window, 'dragend', unpauseHistoryHandler);
  },

  beforeUnmount() {
    this.removeEventListeners();
  },

  methods: {
    fetchStaticConf() {
      console.debug('fetch static configuration');
      fetch('conf.json')
        .then(response => response.json())
        .then(data => { this.characterUrls = data.characterUrls; })
        .catch(err => console.info(`cannot load static configuration: ${err}`));
    },

    loadCharacterData(data) {
      this.tree = data;
      this.routerKey += 1;
    },

    loadCharacterFile(name) {
      const data = this.storage.getCharacterFile(name);
      if (data !== null) {
        this.currentCharacterFile = name;
        this.loadCharacterData(data);
      }
    },

    loadCharacterUrl(name, url) {
      console.debug(`load character data from URL: ${url}`);
      fetch(url)
        .then(response => response.json())
        .then(data => {
          const index = this.storage.loadIndex();
          this.currentCharacterFile = this.storage.uniqueFileName(name);
          this.loadCharacterData(data);
        })
        .catch(err => console.error(err));
    },

    loadCurrentCharacterFile() {
      if (this.currentCharacterFile !== null && this.currentCharacterFile !== '') {
        this.loadCharacterFile(this.currentCharacterFile);
      }
    },

    saveCurrentCharacterFile() {
      if (this.currentCharacterFile !== null && this.currentCharacterFile !== '') {
        this.storage.setCharacterFile(this.currentCharacterFile, this.tree);
      }
    },

    reloadCharacterFileIndex() {
      const index = Object.entries(this.storage.loadIndex())
        .map(([name, info]) => Object.assign(info, {name: name}));
      // Sort by data, newest first
      index.sort((a, b) => a.updated_at < b.updated_at);
      this.characterFileIndex = index;
    },

    deleteCharacterFile(name) {
      this.storage.removeCharacterFile(name);
    },

    importCharacterFile(ev) {
      console.log("loading character data from uploaded file");
      const reader = new FileReader();
      reader.addEventListener('load', ev => {
        const text = ev.target.result;
        const data = JSON.parse(text);
        if (typeof data !== 'object' || data.name === undefined) {
          console.error("invalid character data");
          return;
        }
        const name = this.storage.uniqueFileName(data.name);
        this.storage.setCharacterFile(name, data);
        this.loadCharacterFile(name);
      });
      reader.readAsText(ev.target.files[0]);
    },

    updateColorSwapRule() {
      if (!this.tree) {
        return;
      }
      const palettes = this.conf.palettes(this.tree);
      let rules = [];
      for (const [p, palette] of palettes.entries()) {
        for (const [c, color] of palette.entries()) {
          rules.push(`--color-p${p}-c${c+1}: ${color};`);
        }
      }
      this.setCssRule('palettes', `:root { ${rules.join('')} }`);
    },

    updateBgColorRule() {
      this.setCssRule('bgcolor', `:root { --color-none: ${this.conf.bgColor}; }`);
    },

    updateZoomRule() {
      this.setCssRule('zoom', `:root { --grid-zoom: ${this.conf.zoom}px; }`);
    },

    // Add or replace a CSS rule
    setCssRule(name, text) {
      if (this.cssRules[name] !== undefined) {
        deleteCssRule(this.cssRules[name]);
      }
      const i = this.sheet.insertRule(text);
      this.cssRules[name] = this.sheet.cssRules[i];
    },

    downloadAsJson() {
      console.debug("download character data as JSON");
      downloadJson(this.tree, this.tree.name + '.json');
    },

    registerEventListener(target, name, handler) {
      this.eventHandlers.push([target, name, handler]);
      target.addEventListener(name, handler);
    },

    removeEventListeners() {
      for (let [target, name, handler] of this.eventHandlers) {
        target.removeEventListener(name, handler);
      }
    },

    commitHistoryState() {
      if (this.historyPausedChanges === null) {
        console.debug("commit state");
        this.historyStates.unshift(cloneData(this.tree));
        this.historyStates.splice(HISTORY_STATES_COUNT);
      } else {
        this.historyPausedChanges = true;
      }
    },

    restoreHistoryState() {
      if (this.historyPausedChanges === null) {
        // The last pushed state is the current state, not the previous one
        if (this.historyStates.length > 1) {
          console.debug("restore state");
          this.historyStates.shift();
          this.tree = this.historyStates.shift();
          // Setting tree will trigger the watcher and re-push the new state
        }
      }
    },
  },

  template: `
    <div id="tree">
      <div class="tree-links">
        <ul>
          <li><i class="fas fa-fw fa-portrait" /> <router-link to="/illustrations">Illustrations</router-link></li>
          <li><i class="fas fa-fw fa-th" /> <router-link to="/tileset">Tileset</router-link></li>
          <li><i class="fas fa-fw fa-images" /> <router-link to="/animations">Animations</router-link></li>
          <li><i class="fas fa-fw fa-palette" /> <router-link to="/colors">Color swaps</router-link></li>
          <li><i class="fas fa-fw fa-code" /> <router-link to="/code">Source code</router-link></li>
        </ul>
        <p><router-link to="/help">Help</router-link></p>
      </div>
      <div class="tree-files">
        <div class="tree-file-bar">
          <input v-model.trim="currentCharacterFile" required/>
          <i class="fas fa-w fa-upload" title="Load" @click="loadCurrentCharacterFile()" />
          <i class="fas fa-w fa-download" title="Save" @click="saveCurrentCharacterFile()" />
          <i class="fas fa-w fa-file-export" title="Download as JSON" @click="downloadAsJson()" />
          <i class="fas fa-w fa-file-import" title="Import a JSON" @click="$refs.importCharacterFile.click()" />
          <input type="file" hidden ref="importCharacterFile" @change="importCharacterFile" />
        </div>
        <ul>
          <li v-for="info in characterFileIndex" @click="loadCharacterFile(info.name)">{{ info.name }}
            <i class="fas fa-trash-alt" style="float: right" @click="deleteCharacterFile(info.name)" /></li>
          <li v-for="(url, name) in characterUrls" @click="loadCharacterUrl(name, url)"><i class="fas fa-external-link-alt"/> {{ name }}</li>
        </ul>
      </div>
    </div>
    <div id="toolbar">
      <toolbar :conf.sync="conf" />
    </div>
    <div id="content-container">
      <div id="content" ref="content">
        <router-view :key="routerKey"></router-view>
      </div>
    </div>
  `,
});


app.component('toolbar', {
  props: ['conf'],
  inject: ['tree'],

  data() {
    return {
      palettePicker: false,
    }
  },

  methods: {
    colorSwapPalettes() {
      return Utils.getAllPalettes(this.tree);
    },

    pickBackgroundColor() {
      pickColor(this.conf.bgColor, (color) => {
        this.conf.bgColor = color;
      });
    },
  },

  template: `
    <table class="color-picker">
      <tr
        v-for="c in [0, 1, 2, 3]"
        :class="{ 'active-color': c === conf.color }"
        @click="conf.color = c"
       >
        <td v-for="name of conf.toolbar.cssPalettes" :class="name + '-c' + c" />
      </tr>
    </table>
    <div>
      <button class="icon" @click="palettePicker = !palettePicker" title="Palette selection"><i class="fas fa-palette"/></button>
      <button class="icon" @click="pickBackgroundColor()" title="Background color"><i class="fas fa-image"/></button>
    </div>
    <div class="palette-picker" v-if="palettePicker">
      <table v-if="tree" v-for="(palettes, swap) of colorSwapPalettes()" @click="conf.colorSwap = swap; palettePicker = false">
        <tr v-for="i in [0, 1, 2]">
          <td v-for="palette of palettes" :style="{ 'background-color': palette[i] }" />
        </tr>
      </table>
    </div>
    <div>
      <button class="icon" @click="conf.zoomStep(-1)" title="Zoom-out"><i class="fas fa-search-minus"/></button>
      <button class="icon" @click="conf.zoomStep(1)" title="Zoom in"><i class="fas fa-search-plus"/></button>
    </div>
    <div>
      <button class="icon" @click="conf.setTool('brush')" :class="{ enabled: conf.tool === 'brush' }" title="Brush"><i class="fas fa-paint-brush"/></button>
      <button class="icon" @click="conf.setTool('fill')" :class="{ enabled: conf.tool === 'fill' }" title="Fill"><i class="fas fa-fill-drip"/></button>
    </div>
    <div>
      <button class="icon" @click="conf.setTool('select')" :class="{ enabled: conf.tool === 'select' }" title="Select"><i class="fas fa-mouse-pointer"/></button>
    </div>
    <div>
      <button class="icon" @click="conf.cycleGrid()" title="Grid style"><i class="fas fa-border-all"/></button>
      <button class="icon" @click="conf.toggleBoxes()" :class="{ enabled: conf.boxes === 'on' }" title="Hitbox/hurtbox"><i class="fas fa-vector-square"/></button>
    </div>
  `,
});


app.component('stb-tile', {
  props: ['tile', 'palette', 'flip'],
  inject: ['conf'],

  methods: {
    getColorClass(x, y) {
      const px = this.flip?.[0] ? 7 - x : x;
      const py = this.flip?.[1] ? 7 - y : y;
      const pixel = this.tile.representation[py][px];
      return `bg-${this.palette}-c${pixel}`;
    },

    setPixel(x, y, color) {
      const px = this.flip?.[0] ? 7 - x : x;
      const py = this.flip?.[1] ? 7 - y : y;
      if (this.conf.tool === 'fill') {
        Utils.floodFillTile(this.tile.representation, px, py, color);
      } else {
        // Note: use 'brush' as fallback, even for 'select'
        this.tile.representation[py][px] = color;
      }
    },

    mouseMove(ev, x, y) {
      if (this.conf.tool !== 'fill') {
        if (ev.buttons & 1) {
          this.setPixel(x, y, this.conf.color);
        } else if (ev.buttons & 2) {
          this.setPixel(x, y, 0);
        }
      }
    },
  },

  template: `
    <table class="stb-tile">
      <tr v-for="(_, y) in 8">
        <td v-for="(_, x) in 8"
          :class="getColorClass(x, y)"
          @mousemove="mouseMove($event, x, y)"
          @click="setPixel(x, y, conf.color)"
          @contextmenu.prevent="setPixel(x, y, 0)"
         />
      </tr>
    </table>
  `,
});

app.component('stb-illustration', {
  props: ['tiles', 'width', 'height', 'palette'],
  inject: ['conf'],

  methods: {
    getStyle() {
      return {
        'grid-template-columns': `repeat(${this.width}, max-content)`,
        'grid-template-rows': `repeat(${this.height}, max-content)`,
      }
    },
  },

  template: `
    <div class="stb-illustration" :style="getStyle()">
      <stb-tile v-for="tile in tiles" :tile.sync="tile" :palette="palette" />
    </div>
  `,
});


app.component('stb-animation-frame', {
  props: ['frame'],
  inject: ['tree', 'conf'],

  data() {
    return {
      selectedSprite: null,
    }
  },

  computed: {
    rect() {
      return Utils.frameRect(this.frame, { boxes: true, origin: true, margin: 1 });
    },

    hitboxType() {
      return this.frame.hitbox === null ? 'none' : ({'animation_direct_hitbox': 'direct', 'animation_custom_hitbox': 'custom'}[this.frame.hitbox.type]);
    },
  },

  mounted() {
    this.$watch('frame.duration', (newval, oldval) => { if (newval < 1) this.frame.duration = oldval });
    this.$watch('frame.hurtbox.left', (newval, oldval) => { if (this.frame.hurtbox && newval > this.frame.hurtbox.right) this.frame.hurtbox.left = oldval });
    this.$watch('frame.hurtbox.top', (newval, oldval) => { if (this.frame.hurtbox && newval > this.frame.hurtbox.bottom) this.frame.hurtbox.top = oldval });
    this.$watch('frame.hurtbox.right', (newval, oldval) => { if (this.frame.hurtbox && newval < this.frame.hurtbox.left) this.frame.hurtbox.right = oldval });
    this.$watch('frame.hurtbox.bottom', (newval, oldval) => { if (this.frame.hurtbox && newval < this.frame.hurtbox.top) this.frame.hurtbox.bottom = oldval });
    this.$watch('frame.hitbox.left', (newval, oldval) => { if (this.frame.hitbox && newval > this.frame.hitbox.right) this.frame.hitbox.left = oldval });
    this.$watch('frame.hitbox.top', (newval, oldval) => { if (this.frame.hitbox && newval > this.frame.hitbox.bottom) this.frame.hitbox.top = oldval });
    this.$watch('frame.hitbox.right', (newval, oldval) => { if (this.frame.hitbox && newval < this.frame.hitbox.left) this.frame.hitbox.right = oldval });
    this.$watch('frame.hitbox.bottom', (newval, oldval) => { if (this.frame.hitbox && newval < this.frame.hitbox.top) this.frame.hitbox.bottom = oldval });
  },

  methods: {
    spriteTile(sprite) {
      const tileset = this.tree.tileset;
      const idx = tileset.tilenames.indexOf(sprite.tile);
      return tileset.tiles[idx];
    },

    spriteStyle(sprite) {
      const x = sprite.x - this.rect.x;
      const y = sprite.y - this.rect.y;
      const x8 = Math.floor(x / 8);
      const y8 = Math.floor(y / 8);

      return {
        left: `calc(${x} * var(--grid-zoom))`,
        top: `calc(${y} * var(--grid-zoom))`,
      }
    },

    hurtboxStyle() {
      const x = this.frame.hurtbox.left - this.rect.x;
      const y = this.frame.hurtbox.top -this.rect.y;
      const w = this.frame.hurtbox.right - this.frame.hurtbox.left;
      const h = this.frame.hurtbox.bottom - this.frame.hurtbox.top;
      return {
        left: `calc(${x} * var(--grid-zoom))`,
        top: `calc(${y} * var(--grid-zoom))`,
        width: `calc(${w} * var(--grid-zoom))`,
        height: `calc(${h} * var(--grid-zoom))`,
      }
    },

    boxStyle(box) {
      const x = box.left - this.rect.x;
      const y = box.top -this.rect.y;
      const w = box.right - box.left;
      const h = box.bottom - box.top;
      return {
        left: `calc(${x} * var(--grid-zoom))`,
        top: `calc(${y} * var(--grid-zoom))`,
        width: `calc(${w} * var(--grid-zoom))`,
        height: `calc(${h} * var(--grid-zoom))`,
      }
    },

    originStyle() {
      const x = -this.rect.x;
      const y = -this.rect.y;
      return {
        left: `calc((${x} - 0.2) * var(--grid-zoom))`,
        top: `calc((${y} + 16 - 0.2) * var(--grid-zoom))`,
        width: `calc(0.4 * var(--grid-zoom))`,
        height: `calc(0.4 * var(--grid-zoom))`,
      }
    },

    toggleHurtbox(value) {
      if ((this.frame.hurtbox !== null) === value) {
        return;  // no changes
      }
      if (value) {
        this.frame.hurtbox = {
          type: 'animation_hurtbox',
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
        };
      } else {
        this.frame.hurtbox = null;
      }
    },

    cycleHitbox(value) {
      if (this.hitboxType === value) {
        return;  // no changes
      }
      if (value === 'none') {
        this.frame.hitbox = null;
      } else if (value === 'direct') {
        this.frame.hitbox = {
          type: 'animation_direct_hitbox',
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          base_h: 0,
          base_v: 0,
          force_h: 0,
          force_v: 0,
          damages: 1,
          enabled: true,
        };
      } else if (value === 'custom') {
        this.frame.hitbox = {
          type: 'animation_custom_hitbox',
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          enabled: true,
          routine: '',
          directional1: 0,
          directional2: 0,
          value1: 0,
          value2: 0,
          value3: 0,
        };
      } else {
        throw new Error(`Unknown hitbox type '${value}'`);
      }
    },

    setHurtboxCoord(name, value) {
      let box = this.frame.hurtbox;
      if (name == 'left') {
        if (value > box.right) return;
      } else if (name == 'top') {
        if (value > box.bottom) return;
      } if (name == 'right') {
        if (value < box.left) return;
      } else if (name == 'bottom') {
        if (value < box.top) return;
      }
      box[name] = value;
    },

    newSprite() {
      const sprites = this.frame.sprites;
      sprites.push({
        type: 'animation_sprite',
        tile: this.tree.tileset.tilenames[0],
        attr: 0,
        foreground: false,
        x: 0,
        y: 0,
      });
      this.selectedSprite = sprites[sprites.length-1];
    },

    dropNewSprite(ev) {
      if (ev.dataTransfer.getData('group') === 'sprites') {
        const idx = parseInt(ev.dataTransfer.getData('idx'));
        const sprites = this.frame.sprites;
        sprites.push(cloneData(sprites[idx]));
        this.selectedSprite = sprites[sprites.length-1];
      }
    },

    dragNewSprite(ev) {
      if (ev.dataTransfer.getData('group') === 'sprites') {
        ev.dataTransfer.dropEffect = 'copy';
      }
    },

    removeSelectedSprite() {
      if (this.selectedSprite) {
        const sprites = this.frame.sprites;
        const idx = sprites.indexOf(this.selectedSprite);
        sprites.splice(idx, 1);
        this.selectedSprite = null;
      }
    },

    dragStartSpriteOnGrid(ev, sprite) {
      this.selectedSprite = sprite

      ev.dataTransfer.effectAllowed = 'move';
      ev.dataTransfer.dropEffect = 'move';

      const step = ev.target.offsetWidth / 8;
      const x0 = Math.floor(ev.offsetX / step);
      const y0 = Math.floor(ev.offsetY / step);
      ev.dataTransfer.setData('data', JSON.stringify({
        idx: this.frame.sprites.indexOf(sprite),
        x0, y0,
        //XXX This assumes zoom doesn't change
        step,
      }));
      ev.dataTransfer.setData('group', 'sprite-on-grid');
      // Hide the "ghost" by moving it outside the windows
      ev.dataTransfer.setDragImage(ev.target, window.outerWidth, window.outerHeight);
    },

    dragOverSpriteOnGrid(ev) {
      if (ev.dataTransfer.getData('group') === 'sprite-on-grid') {
        ev.dataTransfer.dropEffect = 'move';
        const data = JSON.parse(ev.dataTransfer.getData('data'));
        const sprite = this.frame.sprites[data.idx];
        const x = Math.floor((ev.pageX - ev.currentTarget.offsetLeft) / data.step);
        const y = Math.floor((ev.pageY - ev.currentTarget.offsetTop) / data.step);
        //XXX For now, prevent going beyond left/top, to avoid "infinite resizing"
        // Take account of the 1px margin
        sprite.x = this.rect.x + Math.max(x - data.x0, 1);
        sprite.y = this.rect.y + Math.max(y - data.y0, 1);
      } else {
        ev.dataTransfer.dropEffect = 'none';
      }
    },
  },

  template: `
    <div class="animation-frame">
      <div class="frame-canvas" @dragover.prevent="dragOverSpriteOnGrid($event)">
        <table class="stb-tile background bg-none">
          <tr v-for="y in rect.height">
            <td v-for="x in rect.width"
              @click.capture="conf.tool === 'select' && (selectedSprite = null, $event.stopPropagation())"
              @contextmenu.prevent
             />
          </tr>
        </table>
        <stb-tile
          v-for="sprite of frame.sprites"
          :class="['frame-sprite', { selected: sprite === selectedSprite, foreground: sprite.foreground }]"
          :tile.sync="spriteTile(sprite)"
          :flip="[sprite.attr & 0x40, sprite.attr & 0x80]"
          :palette="'p' + (sprite.attr & 0x1)"
          :style="spriteStyle(sprite)"
          @click.capture="conf.tool === 'select' && (selectedSprite = sprite, $event.stopPropagation())"
          @mousemove.capture="conf.tool === 'select' && $event.stopPropagation()"
          :draggable="conf.tool === 'select'"
          @dragstart="dragStartSpriteOnGrid($event, sprite)"
          />
        <div v-if="frame.hitbox" class="frame-hitbox" :style="boxStyle(frame.hitbox)" />
        <div v-if="frame.hurtbox" class="frame-hurtbox" :style="boxStyle(frame.hurtbox)" />
        <div class="frame-origin" :style="originStyle()"/>
      </div>
      <div class="frame-info">
        <div>
          <label>Duration: <input v-model="frame.duration" type="number" style="width: 3em" /> frames</label>
        </div>
        <div class="box-header">
          <label><input type="checkbox" :checked="frame.hurtbox !== null" @change="toggleHurtbox($event.target.checked)" /> Hurtbox</label>
        </div>
        <div v-if="frame.hurtbox !== null">
          Area: (<input v-model="frame.hurtbox.left" type="number" class="coordinate" />,<input v-model="frame.hurtbox.top" type="number" class="coordinate" />)
          to (<input v-model="frame.hurtbox.right" type="number" class="coordinate" />,<input v-model="frame.hurtbox.bottom" type="number" class="coordinate" />)
        </div>
        <div class="box-header">Hitbox</div>
        <label>Type:
          <select @change="cycleHitbox($event.target.value)" :value="hitboxType">
            <option value="none">None</option>
            <option value="direct">Direct</option>
            <option value="custom">Custom</option>
          </select>
        </label>
        <div v-if="frame.hitbox !== null">
          Area: (<input v-model="frame.hitbox.left" type="number" class="coordinate" />,<input v-model="frame.hitbox.top" type="number" class="coordinate" />)
          to (<input v-model="frame.hitbox.right" type="number" class="coordinate" />,<input v-model="frame.hitbox.bottom" type="number" class="coordinate" />)
          <br/>
          <div v-if="hitboxType === 'direct'">
            <label>Damages: <input v-model="frame.hitbox.damages" type="number" class="damages" /> %</label>
            <br/>
            Base knockback: (<input v-model="frame.hitbox.base_h" type="number" class="force" />,<input v-model="frame.hitbox.base_v" type="number" class="force" />)
            <br/>
            Knockback scaling: (<input v-model="frame.hitbox.force_h" type="number" class="force" />,<input v-model="frame.hitbox.force_v" type="number" class="force" />) per %
            <br/>
            <label><input type="checkbox" v-model="frame.hitbox.enabled" /> Enabled</label><br/>
          </div>
          <div v-if="hitboxType === 'custom'">
            <label>Routine: <input v-model="frame.hitbox.routine" type="string" /></label><br />
            <label>Directional value 1: <input v-model="frame.hitbox.directional1" type="number" /></label><br />
            <label>Directional value 2: <input v-model="frame.hitbox.directional2" type="number" /></label><br />
            <label>Immediate value 1: <input v-model="frame.hitbox.value1" type="number" /></label><br />
            <label>Immediate value 2: <input v-model="frame.hitbox.value2" type="number" /></label><br />
            <label>Immediate value 3: <input v-model="frame.hitbox.value3" type="number" /></label><br />
            <label><input type="checkbox" v-model="frame.hitbox.enabled" /> Enabled</label><br/>
          </div>
        </div>
        <hr/>
        <div class="sprite-thumbnails">
          <dnd-list
            :items="frame.sprites"
            group="sprites"
            direction="horizontal"
           >
            <template v-slot:item="props">
              <stb-sprite-thumbnail
                :sprite="props.item"
                :class="{ selected: props.item === selectedSprite }"
                @click="selectedSprite = props.item"
               />
            </template>
          </dnd-list>
          <div
            class="icon"
            @click="newSprite()"
            @drop="dropNewSprite($event)"
            @dragover.prevent="dragNewSprite($event)"
           >
            <i class="fas fa-plus-square" />
          </div>
          <div class="icon" @click="removeSelectedSprite()" v-show="selectedSprite">
            <i class="fas fa-trash-alt" />
          </div>
        </div>
        <hr/>
        <stb-sprite-info v-if="selectedSprite" :sprite="selectedSprite" />
      </div>
    </div>
  `,
});

app.component('stb-sprite-info', {
  props: ['sprite'],
  inject: ['tree'],

  methods: {
    newTile() {
      Utils.addNewTile(this.tree);
      const tilenames = this.tree.tileset.tilenames;
      this.sprite.tile = tilenames[tilenames.length-1];
    },
  },

  template: `
    <div class="sprite-info">
      Position: (<input v-model="sprite.x" type="number" class="coordinate" />,<input v-model="sprite.y" type="number" class="coordinate" />)
      <br/>
      <button class="icon" @click="sprite.attr ^= 0x40" :class="{ enabled: sprite.attr & 0x40 }" title="Horizontal flip"><i class="fas fa-arrows-alt-h"/></button>
      <button class="icon" @click="sprite.attr ^= 0x80" :class="{ enabled: sprite.attr & 0x80 }" title="Vertical flip"><i class="fas fa-arrows-alt-v"/></button>
      <button class="icon" @click="sprite.attr ^= 0x01" :class="{ enabled: sprite.attr & 0x01 }" title="Palette"><i class="fas fa-palette"/></button>
      <button class="icon" @click="sprite.foreground = !sprite.foreground" :class="{ enabled: sprite.foreground }" title="Foreground"><i class="fas fa-layer-group"/></button>
      <div class="sprite-tile-picker">
        <stb-tile-thumbnail v-for="(name, idx) in tree.tileset.tilenames"
          :tile="tree.tileset.tiles[idx]"
          :zoom="4"
          @click="sprite.tile = name"
          :class="{ selected: sprite.tile === name }"
         />
        <div class="icon" @click="newTile()">
          <i class="fas fa-plus-square" />
        </div>
      </div>
    </div>
  `,
});

app.component('stb-frame-thumbnail', {
  props: ['frame', 'zoom', 'rect'],
  inject: ['tree', 'conf'],

  methods: {
    drawFrame() {
      const ctx = this.$refs.canvas.getContext('2d');
      const palettes = this.conf.palettes(this.tree);
      return Utils.drawFrame(ctx, this.tree, this.frame, {
        zoom: this.zoom,
        rect: this.rect,
        background: this.conf.bgColor,
        palettes,
      });
    },
  },

  mounted() {
    Vue.watchEffect(() => this.drawFrame());
  },

  template: `
    <canvas ref="canvas" class="stb-frame-thumbnail" />
  `,
});

app.component('stb-tile-thumbnail', {
  props: ['tile', 'zoom'],
  inject: ['tree', 'conf'],

  methods: {
    drawTile() {
      const ctx = this.$refs.canvas.getContext('2d');
      const palette = this.conf.palettes(this.tree)[0];
      return Utils.drawTile(ctx, this.tree, this.tile, { zoom: this.zoom, background: this.conf.bgColor, palette });
    },
  },

  mounted() {
    Vue.watchEffect(() => this.drawTile());
  },

  template: `
    <canvas ref="canvas" class="stb-tile-thumbnail" />
  `,
});

app.component('stb-sprite-thumbnail', {
  props: ['sprite'],
  inject: ['tree', 'conf'],

  methods: {
    drawSprite() {
      const ctx = this.$refs.canvas.getContext('2d');
      const palettes = this.conf.palettes(this.tree);
      return Utils.drawSprite(ctx, this.tree, this.sprite, { zoom: 4, background: this.conf.bgColor, palettes });
    },
  },

  mounted() {
    Vue.watchEffect(() => this.drawSprite());
  },

  template: `
    <canvas ref="canvas" class="stb-sprite-thumbnail" />
  `,
});

app.component('stb-animation-thumbnail', {
  props: ['animation', 'zoom', 'rect', 'swap'],
  inject: ['tree', 'conf'],

  methods: {
    updateAnimation() {
      const rect = this.rect || Utils.animationRect(this.animation, {});
      const swap = this.swap === undefined ? this.conf.colorSwap : this.swap;
      const palettes = Utils.getPalettes(this.tree, swap);

      // Prepare the canvas
      const canvas = this.$refs.canvas;
      const ctx = canvas.getContext('2d');
      ctx.canvas.width = rect.width * this.zoom;
      ctx.canvas.height = rect.height * this.zoom;

      const frames = this.animation.frames;

      const promises = frames.map(frame => {
        ctx.fillStyle = this.conf.bgColor;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        Utils.drawSingleFrame(ctx, this.tree, frame, {
          zoom: this.zoom, palettes, dx: -rect.x, dy: -rect.y,
        });
        return createImageBitmap(canvas);
      });
      Promise.all(promises).then(images => {
        let position = null;
        let ticks = 0;
        this.stopAnimation();
        this.interval = setInterval(() => {
          ticks += 1;
          if (position === null) {
            position = 0;
          } else if (ticks >= frames[position].duration) {
            position = (position + 1) % frames.length;
            ticks = 0;
          } else {
            return;  // nothing to do
          }
          ctx.drawImage(images[position], 0, 0);
        }, 1000/60);
      });
    },

    stopAnimation() {
      if (this.interval !== null) {
        clearInterval(this.interval);
        this.interval = null;
      }
    },
  },

  mounted() {
    this.interval = null;
    Vue.watchEffect(() => this.updateAnimation());
  },

  beforeUnmount() {
    this.stopAnimation();
  },

  template: `
    <canvas ref="canvas" class="stb-animation-thumbnail" />
  `,
});

app.component('stb-state', {
  props: ['state'],
  emits: ['delete'],

  data() {
    return {
      unroll: false,
    }
  },

  template: `
    <div class="stb-state">
      <i class="fas fa-chevron-down" @click="unroll = !unroll" /> <input v-model="state.name" /> <i class="fas fa-trash-alt" @click="$emit('delete')" />
      <ul v-show="unroll">
        <li><label><span>Start routine:</span> <input :value="state.start_routine" @change="state.start_routine = $event.target.value || null" /></label></li>
        <li><label><span>Update routine:</span> <input v-model="state.update_routine" /></label></li>
        <li><label><span>Input routine:</span> <input v-model="state.input_routine" /></label></li>
        <li><label><span>On ground routine:</span> <input v-model="state.onground_routine" /></label></li>
        <li><label><span>Off ground routine:</span> <input v-model="state.offground_routine" /></label></li>
        <li><label><span>On hurt routine:</span> <input v-model="state.onhurt_routine" /></label></li>
      </ul>
    </div>
  `,
});


app.component('dnd-list', {
  props: ['items', 'group', 'direction'],
  emits: ['move'],

  methods: {
    dragStart(ev, idx) {
      //XXX Adding 'copy' should be configurable
      ev.dataTransfer.effectAllowed = 'moveCopy';
      ev.dataTransfer.dropEffect = 'move';
      ev.dataTransfer.setData('idx', idx);
      ev.dataTransfer.setData('group', this.group);
    },

    dragOver(ev) {
      if (ev.dataTransfer.getData('group') === this.group) {
        ev.dataTransfer.dropEffect = 'move';
      } else {
        ev.dataTransfer.dropEffect = 'none';
      }
    },

    drop(ev, idx) {
      if (ev.dataTransfer.getData('group') === this.group) {
        if (!this.isMouseOnFirstHalf(ev)) {
          idx += 1;
        }
        const src = parseInt(ev.dataTransfer.getData('idx'));
        this.moveItem(src, idx);
      }
    },

    moveItem(src, dst) {
      if (src !== dst) {
        this.items.splice(dst, 0, this.items[src]);
        this.items.splice(src < dst ? src : src + 1, 1);
        this.$emit('move', src, dst);
      }
    },

    // Return whether mouse points in the "first" half of the target element
    isMouseOnFirstHalf(ev) {
      if (this.direction === 'horizontal') {
        return ev.offsetX < ev.target.offsetWidth / 2;
      } else {
        return ev.offsetY < ev.target.offsetHeight / 2;
      }
    },
  },

  template: `
    <template v-for="(item, idx) of items">
      <div
        draggable="true"
        @dragstart="dragStart($event, idx)"
        @dragover.prevent="dragOver($event)"
        @drop="drop($event, idx)"
       >
        <slot name="item" :item="item" :idx="idx" />
      </div>
    </template>
  `,
});


const IllustrationsTab = {
  inject: ['tree', 'conf'],

  methods: {
    illustrationTiles(illustration, width, height) {
      return Array.from({length: height}, (_, y) => Array.from({length: width}, (_, x) => illustration.tiles[y * width + x]));
    },
  },

  created() {
    this.conf.toolbar.cssPalettes = ['bg-illu-token', 'bg-illu-small'];
  },

  template: `
    <div v-if="tree" class="tab-illustrations">
      <h2>Token</h2> 
      <stb-illustration :tiles.sync="tree.illustration_token.tiles" width="1" height="1" palette="illu-token" />
      <h2>Small </h2> 
      <stb-illustration :tiles.sync="tree.illustration_small.tiles" width="2" height="2" palette="illu-small" />
      <h2>Large</h2> 
      <stb-illustration :tiles.sync="tree.illustration_large.tiles" width="6" height="8" palette="illu-large" />
    </div>
  `,
}


const TilesetTab = {
  inject: ['tree', 'conf'],

  data() {
    return {
      selectedTile: null,
    }
  },

  created() {
    if (this.conf.grid !== 'pixels') {
      this.conf.grid = 'off';
    }
    this.conf.toolbar.gridModes = ['off', 'pixels'];
  },

  methods: {
    moveTile(src, dst) {
      const items = this.tree.tileset.tilenames;
      items.splice(dst, 0, items[src]);
      items.splice(src < dst ? src : src + 1, 1);
    },

    newTile() {
      Utils.addNewTile(this.tree);
      const tiles = this.tree.tileset.tiles;
      this.selectedTile = tiles[tiles.length-1];
    },

    dropNewTile(ev) {
      if (ev.dataTransfer.getData('group') === 'tileset') {
        const tileset = this.tree.tileset;
        const idx = parseInt(ev.dataTransfer.getData('idx'));
        tileset.tilenames.push(Utils.newTileName(this.tree));
        tileset.tiles.push(cloneData(tileset.tiles[idx]));
        this.selectedTile = tileset.tiles[tileset.tiles.length-1];
      }
    },

    dragNewTile(ev) {
      if (ev.dataTransfer.getData('group') === 'tileset') {
        ev.dataTransfer.dropEffect = 'copy';
      }
    },

    removeSelectedTile() {
      if (this.selectedTile) {
        const tileset = this.tree.tileset;
        const idx = tileset.tiles.indexOf(this.selectedTile);
        tileset.tiles.splice(idx, 1);
        tileset.tilenames.splice(idx, 1);
        this.selectedTile = null;
      }
    },

    setSelectedTileName(ev) {
      const new_name = ev.target.value;
      const idx = this.selectedTileIndex;
      if (idx === null) {
        return;
      }
      const old_name = this.tree.tileset.tilenames[idx];
      if (new_name == old_name) {
        return;
      }

      this.tree.tileset.tilenames[idx] = new_name;
      const animations = MANDATORY_ANIMATION_NAMES.map(x => this.tree[x]).concat(this.tree.animations);
      for (let anim of animations) {
        for (let frame of anim.frames) {
          for (let sprite of frame.sprites) {
            if (sprite.tile === old_name) {
              sprite.tile = new_name;
            }
          }
        }
      }
    },
  },

  computed: {
    selectedTileIndex() {
      if (this.selectedTile === null) {
        return null;
      } else {
        const idx = this.tree.tileset.tiles.indexOf(this.selectedTile);
        return idx === -1 ? null : idx;
      }
    },

    selectedTileName() {
      const idx = this.selectedTileIndex;
      if (this.selectedTile === null) {
        return null;
      }
      return this.tree.tileset.tilenames[idx];
    },

    selectedTileUses() {
      const idx = this.selectedTileIndex;
      if (this.selectedTile === null) {
        return null;
      }
      return Utils.getAnimationsUsingTile(this.tree, this.tree.tileset.tilenames[idx]).length;
    },
  },

  template: `
    <div v-if="tree" class="tab-tileset">
      <h2>Tileset</h2>
      <div class="tileset-tiles">
        <dnd-list
          :items="tree.tileset.tiles"
          group="tileset"
          direction="horizontal"
          @move="moveTile"
         >
          <template v-slot:item="props">
            <stb-tile-thumbnail
              :tile="props.item"
              :zoom="6"
              :class="{ selected: props.item === selectedTile }"
              @click="selectedTile = props.item"
             />
          </template>
        </dnd-list>
        <div
          class="icon"
          @click="newTile()"
          @drop="dropNewTile($event)"
          @dragover.prevent="dragNewTile($event)"
         >
          <i class="fas fa-plus-square" />
        </div>
      </div>
      <div v-if="selectedTile" class="tile-details">
        <div class="tile-canvas">
          <stb-tile :tile.sync="selectedTile" palette="p0" class="bg-none" />
        </div>
        <div class="tile-info">
          <div>
            <label>Name: <input :value="selectedTileName" @change="setSelectedTileName" style="width: 20%;"/></label>
          </div>
          <div>
            Animations using this tile: {{selectedTileUses}}
            <span v-if="selectedTileUses == 0" class="icon" @click="removeSelectedTile">
              <i class="fas fa-trash-alt" />
            </span>
          </div>
        </div>
      </div>
    </div>
  `,
}


const AnimationsTab = {
  inject: ['tree'],

  data() {
    return {
      animRect: {
        x: -12,
        y: -4,
        width: 32,
        height: 24,
      },
    }
  },

  methods: {
    getMandatoryAnimations() {
      return MANDATORY_ANIMATION_NAMES.map(x => this.tree[x]);
    },
  },

  template: `
    <div v-if="tree" class="tab-animations">
      <h2>Animations</h2>
      <ul>
        <li v-for="anim in getMandatoryAnimations()">
          <stb-animation-thumbnail :animation="anim" :zoom="2" :rect="animRect"
          />
          <router-link :to="'/animations/'+anim.name">{{ anim.name }}</router-link>
        </li>
        <li v-for="anim in tree.animations">
          <stb-animation-thumbnail :animation="anim" :zoom="2" :rect="animRect" />
          <router-link :to="'/animations/'+anim.name">{{ anim.name }}</router-link>
        </li>
      </ul>
    </div>
  `,
}


const AnimationTab = {
  inject: ['tree'],

  data() {
    return {
      animation: null,
      selectedFrame: null,
    }
  },

  computed: {
    rect() {
      //XXX Rect is "aligned" on sprites, not invidual pixels
      return Utils.animationRect(this.animation, { margin: 1 });
    },
  },

  created() {
    this.$watch(() => this.$route.params, () => this.updateAnimation());
    this.$watch('tree', () => this.updateAnimation());
    this.updateAnimation();
  },
 
  methods: {
    updateAnimation() {
      if (!this.tree) {
        return;
      }
      if (!this.$route.path.startsWith('/animations')) {
        return;
      }
      this.animation = Utils.getAnimationByName(this.tree, this.$route.params.name);
      if (this.animation === undefined) {
        this.$router.push('/animations');
        return;
      }
      const frame = this.$route.params.frame;
      if (frame === undefined) {
        this.selectedFrame = null;
      } else {
        this.selectedFrame = this.animation.frames[frame];
        if (this.selectedFrame === undefined) {
          this.selectedFrame = null;
          this.$router.replace(`/animations/${this.animation.name}`);
        }
      }
    },

    updateFrame(frame) {
      if (frame) {
        const idx = this.animation.frames.indexOf(frame);
        this.$router.replace(`/animations/${this.animation.name}/${idx}`);
      } else {
        this.$router.replace(`/animations/${this.animation.name}`);
      }
    },

    newFrame() {
      const frames = this.animation.frames;
      frames.push({
        type: 'animation_frame',
        duration: 1,
        sprites: [{
          type: 'animation_sprite',
          tile: this.tree.tileset.tilenames[0],
          attr: 0,
          foreground: false,
          x: 0,
          y: 0,
        }],
        hitbox: null,
        hurtbox: null,
      });
      this.updateFrame(frames[frames.length-1]);
    },

    dropNewFrame(ev) {
      if (ev.dataTransfer.getData('group') === 'frames') {
        const idx = parseInt(ev.dataTransfer.getData('idx'));
        const frames = this.animation.frames;
        frames.push(cloneData(frames[idx]));
        this.updateFrame(frames[frames.length-1]);
      }
    },

    dragNewFrame(ev) {
      if (ev.dataTransfer.getData('group') === 'frames') {
        ev.dataTransfer.dropEffect = 'copy';
      }
    },

    moveFrame(src, dst) {
      if (this.selectedFrame) {
        // Update URL (index may have changed)
        this.updateFrame(this.selectedFrame);
      }
    },

    removeSelectedFrame() {
      if (this.selectedFrame) {
        const frames = this.animation.frames;
        const idx = frames.indexOf(this.selectedFrame);
        frames.splice(idx, 1);
        this.updateFrame(null);
      }
    },

    isMandatoryAnimation() {
      return !this.tree.animations.includes(this.animation);
    },

    duplicateAnimation() {
      const animation = cloneData(this.animation);
      animation.name = Utils.newAnimationName(this.tree, this.animation.name + '_copy');
      const idx = this.tree.animations.indexOf(this.animation);
      this.tree.animations.splice(idx + 1, 0, animation);
      this.$router.push(`/animations/${animation.name}`);
    },

    removeAnimation() {
      const idx = this.tree.animations.indexOf(this.animation);
      this.tree.animations.splice(idx, 1);
      this.$router.push('/animations');
    },
  },

  template: `
    <div v-if="animation">
      <h2>Animation</h2>
      <div>
        <label>Name: <input v-model="animation.name" style="width: 20%;"/></label>
        <div class="animation-duplicate" @click="duplicateAnimation()" title="Duplicate animation">
          <i class="fas fa-clone" />
        </div>
        <div v-if="!isMandatoryAnimation()" class="animation-delete" @click="removeAnimation()" title="Delete animation">
          <i class="fas fa-trash-alt" />
        </div>
      </div>
      <div class="frame-thumbnails">
        <dnd-list
          :items="animation.frames"
          group="frames"
          direction="horizontal"
          @move="moveFrame"
         >
          <template v-slot:item="props">
            <stb-frame-thumbnail
              :frame="props.item"
              :zoom="2"
              :rect="rect"
              :class="{ selected: props.item === selectedFrame }"
              @click="updateFrame(props.item)"
             />
          </template>
        </dnd-list>
        <div
          class="icon"
          @click="newFrame()"
          @drop="dropNewFrame($event)"
          @dragover.prevent="dragNewFrame($event)"
         >
          <i class="fas fa-plus-square" />
        </div>
        <div class="icon" @click="removeSelectedFrame()" v-show="selectedFrame">
          <i class="fas fa-trash-alt" />
        </div>
      </div>
      <div>
        <stb-animation-frame v-if="selectedFrame" :frame="selectedFrame" draggable />
      </div>
    </div>
  `,
}


const ColorsTab = {
  inject: ['tree', 'conf'],

  data() {
    return {
      selectedSwap: this.conf.colorSwap,
      selectedPalette: 0,
      selectedColor: 1,
      previewedAnimationName: null,
    }
  },

  created() {
    if (this.tree && !this.previewedAnimationName) {
      this.previewedAnimationName = this.tree[MANDATORY_ANIMATION_NAMES[0]].name;
    }
  },

  methods: {
    colorSwapPalettes() {
      return Utils.getAllPalettes(this.tree);
    },

    fullPaletteCellStyle(i, j) {
      return { 'background-color': NES_COLORS[16 * i + j] }
    },

    setSelectedSwapColor(i, j) {
      const k = PALETTE_NAMES[this.selectedPalette];
      this.tree.color_swaps[k][this.selectedSwap].colors[this.selectedColor] = 16 * i + j;
    },

    getAnimations() {
      return MANDATORY_ANIMATION_NAMES.map(x => this.tree[x]).concat(this.tree.animations);
    },
  },

  computed: {
    selectedSwapPalettes() {
      return Utils.getPalettes(this.tree, this.selectedSwap);
    },

    selectedSwapColor() {
      if (this.selectedSwap === null) {
        return null;
      }
      const k = PALETTE_NAMES[this.selectedPalette];
      return this.tree.color_swaps[k][this.selectedSwap].colors[this.selectedColor];
    },

    previewedAnimation() {
      return Utils.getAnimationByName(this.tree, this.previewedAnimationName);
    },

    previewedAnimationRect() {
      return Utils.animationRect(this.previewedAnimation, { margin: 2 });
    },
  },

  template: `
    <div v-if="tree" class="color-swaps">
      <h2>Color swaps</h2>
      <div class="palette-picker">
        <table v-for="(palettes, swap) of colorSwapPalettes()"
          @click="selectedSwap = swap"
         >
          <tr v-for="c in [0, 1, 2]">
            <td v-for="p in [0, 1, 2]" :style="{ 'background-color': palettes[p][c] }" />
          </tr>
        </table>
      </div>
      <div class="selected-swap">
        <div class="color-picker">
          <table v-if="selectedSwap !== null">
            <tr v-for="c in [0, 1, 2]">
              <td v-for="p in [0, 1, 2]"
                :style="{ 'background-color': selectedSwapPalettes[p][c] }"
                :class="{ selected: p == selectedPalette && c == selectedColor }"
                @click="selectedPalette = p; selectedColor = c"
               />
            </tr>
          </table>
        </div>
        <div class="full-palette">
          <table>
            <tr v-for="(_, i) in 4">
              <td v-for="(_, j) in 16"
                :style="fullPaletteCellStyle(i, j)"
                :class="{ selected: selectedSwapColor === 16*i+j }"
                @click="setSelectedSwapColor(i, j)"
               >
                {{ (16*i+j).toString(16).padStart(2, '0') }}
              </td>
            </tr>
          </table>
        </div>
      </div>
      <div class="preview">
        <label>Preview animation: </label>
        <select v-model="previewedAnimationName">
          <option v-for="anim in getAnimations()" :value="anim.name">{{ anim.name }}</option>
        </select>
        <div>
          <stb-animation-thumbnail
            v-if="previewedAnimationName"
            :animation="previewedAnimation"
            :zoom="2"
            :rect="previewedAnimationRect"
            :swap="selectedSwap"
           />
        </div>
      </div>
    </div>
  `,
}


const CodeTab = {
  inject: ['tree'],

  methods: {
    newState() {
      this.tree.states.push({
        type: 'character_state',
        name: 'STATE_NAME',
        start_routine: null,
        update_routine: 'dummy_routine',
        input_routine: 'dummy_routine',
        onground_routine: 'dummy_routine',
        offground_routine: 'dummy_routine',
        onhurt_routine: 'hurt_player',
      });
    },

    removeState(idx) {
      this.tree.states.splice(idx, 1);
    },
  },

  template: `
    <div v-if="tree">
      <h2>Source code</h2>
      <div>
        <label>Net load routine: <input v-model="tree.netload_routine" style="width: 40%" /></label>
      </div>
      <div>
        <h3>States</h3>
        <ul class="code-states">
          <dnd-list
            :items="tree.states"
            direction="vertical"
            group="states"
          >
            <template v-slot:item="props">
              <stb-state :state="props.item" @delete="removeState(props.idx)" />
            </template>
          </dnd-list>
          <li><i class="fas fa-plus-square" @click="newState()" /></li>
        </ul>
      </div>
      <div>
        <h2>Source code</h2>
        <textarea class="sourcecode" v-model="tree.sourcecode" />
      </div>
    </div>
  `,
}

const HelpTab = {
  template: `
    <ul id="help">
      <li>
        General
        <ul>
          <li>Choose elements to edit from the left column</li>
          <li>Changes to a tile will propagate to everything that uses it</li>
          <li>Use left click to draw with selected color</li>
          <li>Use right click to draw with background color</li>
        </ul>
      </li>
      <li>
        Managing files
        <ul>
          <li>Use <i class="fas fa-file-import"/> to import JSON file</li>
          <li>Use <i class="fas fa-file-export"/> to export the current file as JSON</li>
          <li>Use <i class="fas fa-download"/> to save a file; name can be changed</li>
          <li>Use <i class="fas fa-upload"/> to reload the current file</li>
          <li>Click on a file name to reload it</li>
          <li>Use <i class="fas fa-trash-alt"/> to remove a saved file</li>
          <li>Files preceded with <i class="fa-external-link-alt" /> are loaded from a predefined URL.</li>
        </ul>
      </li>
      <li>
        Toolbar
        <ul>
          <li>The toolbar is the vertical panel on the left side</li>
          <li>Use <i class="fas fa-paint-brush"/> tool to draw</li>
          <li>Use <i class="fas fa-fill-drip"/> tool to fill a surface (limited to tile boundaries)</li>
          <li>Select drawing color from the palette</li>
          <li>Use <i class="fas fa-palette"/> to change palette used for display and drawing</li>
          <li>Use <i class="fas fa-image"/> to select the background color, for transparent pixels</li>
          <li>Use <i class="fas fa-border-all"/> to change grid and overlays: all borders / tile borders / nothing</li>
          <li>Use <i class="fas fa-search-minus"/> / <i class="fas fa-search-plus"/> to zoom-out/in</li>
        </ul>
      </li>
      <li>
        Animation edition
        <ul>
          <li>Select a frame from the thumbnails to edit it</li>
          <li>Drag and drop frames to reorder them</li>
          <li>Drop a frame on <i class="fas fa-plus-square" /> to clone it</li>
        </ul>
      </li>
      <li>
        Frame edition
        <ul>
          <li>Select a sprite from the thumbnails or using <i class="fas fa-mouse-pointer" /> tool to edit it</li>
          <li>Drag and drop sprites to reorder them</li>
          <li>Drop a sprite on <i class="fas fa-plus-square" /> to clone it</li>
          <li>Check/uncheck hurtbox and hitbox to enable/disable them</li>
          <li>Use <i class="fas fa-vector-square"/> to toggle hurtbox and hitbox display</li>
          <li>The red dot marks the origin (character's left, at ground level)</li>
        </ul>
      </li>
      <li>
        Sprite edition
        <ul>
          <li>Select sprite's tile from the thumbnails</li>
          <li>Use <i class="fas fa-arrows-alt-h"/> to flip the sprite horizontally</li>
          <li>Use <i class="fas fa-arrows-alt-v"/> to flip the sprite vertically</li>
          <li>Use <i class="fas fa-palette"/> to toggle between primary and secondary palette</li>
          <li>Use <i class="fas fa-layer-group"/> to toggle between foreground and background</li>
        </ul>
      </li>
      <li>
        Keyboard shortcuts
        <ul>
          <li><kbd>c</kbd> Cycle through draw color</li>
          <li><kbd>+</kbd> Zoom in</li>
          <li><kbd>-</kbd> Zoom out</li>
          <li><kbd>s</kbd> Toggle select tool</li>
          <li><kbd>t</kbd> Cycle through tools</li>
          <li><kbd>g</kbd> Cycle through grid modes</li>
          <li><kbd>b</kbd> Toggle display of hitboxes and hurtboxes</li>
          <li><kbd>Ctrl-Z</kbd> Undo changes</li>
        </ul>
      </li>
    </ul>
  `,
}


const routes = [
  { path: '/illustrations', component: IllustrationsTab },
  { path: '/tileset', component: TilesetTab },
  { path: '/animations', component: AnimationsTab },
  { path: '/animations/:name', component: AnimationTab },
  { path: '/animations/:name/:frame', component: AnimationTab },
  { path: '/colors/', component: ColorsTab },
  { path: '/code/', component: CodeTab },
  { path: '/help', component: HelpTab },
]

const router = VueRouter.createRouter({
  history: VueRouter.createWebHashHistory(),
  routes,
})

app.use(router);

app.config.unwrapInjectedRef = true;
app.mount('#app');

