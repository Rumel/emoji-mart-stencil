import buildSearch from './build-search'
import data from '../data'
import stringFromCodePoint from '../polyfills/stringFromCodePoint'

export default class Util {
  _JSON = JSON
  COLONS_REGEX = /^(?:\:([^\:]+)\:)(?:\:skin-tone-(\d)\:)?$/
  SKINS = ['1F3FA', '1F3FB', '1F3FC', '1F3FD', '1F3FE', '1F3FF']

  unifiedToNative(unified) {
    var unicodes = unified.split('-'),
      codePoints = unicodes.map(u => `0x${u}`)

    return stringFromCodePoint.apply(null, codePoints)
  };

  sanitize(emoji) {
    var {
      name,
      short_names,
      skin_tone,
      skin_variations,
      emoticons,
      unified,
      custom,
      imageUrl,
    } = emoji,
      id = emoji.id || short_names[0],
      colons = `:${id}:`

    if (custom) {
      return {
        id,
        name,
        colons,
        emoticons,
        custom,
        imageUrl,
      }
    }

    if (skin_tone) {
      colons += `:skin-tone-${skin_tone}:`
    }

    return {
      id,
      name,
      colons,
      emoticons,
      unified: unified.toLowerCase(),
      skin: skin_tone || (skin_variations ? 1 : null),
      native: this.unifiedToNative(unified),
    }
  };

  getSanitizedData(emoji, skin, set) {
    return this.sanitize(this.getData(emoji, skin, set))
  };

  public getData(emoji, skin, set) {
    var emojiData: any = {}

    if (typeof emoji == 'string') {
      let matches = emoji.match(this.COLONS_REGEX)

      if (matches) {
        emoji = matches[1]

        if (matches[2]) {
          skin = parseInt(matches[2])
        }
      }

      if (data.short_names.hasOwnProperty(emoji)) {
        emoji = data.short_names[emoji]
      }

      if (data.emojis.hasOwnProperty(emoji)) {
        emojiData = data.emojis[emoji]
      } else {
        return null
      }
    } else if (emoji.id) {
      if (data.short_names.hasOwnProperty(emoji.id)) {
        emoji.id = data.short_names[emoji.id]
      }

      if (data.emojis.hasOwnProperty(emoji.id)) {
        emojiData = data.emojis[emoji.id]
        skin || (skin = emoji.skin)
      }
    }

    if (!Object.keys(emojiData).length) {
      emojiData = emoji
      emojiData.custom = true

      if (!emojiData.search) {
        emojiData.search = buildSearch(emoji)
      }
    }

    emojiData.emoticons || (emojiData.emoticons = [])
    emojiData.variations || (emojiData.variations = [])

    if (emojiData.skin_variations && skin > 1 && set) {
      emojiData = JSON.parse(this._JSON.stringify(emojiData))

      var skinKey = this.SKINS[skin - 1],
        variationData = emojiData.skin_variations[skinKey]

      if (!variationData.variations && emojiData.variations) {
        delete emojiData.variations
      }

      if (variationData[`has_img_${set}`]) {
        emojiData.skin_tone = skin

        for (let k in variationData) {
          let v = variationData[k]
          emojiData[k] = v
        }
      }
    }

    if (emojiData.variations && emojiData.variations.length) {
      emojiData = JSON.parse(this._JSON.stringify(emojiData))
      emojiData.unified = emojiData.variations.shift()
    }

    return emojiData
  }

  uniq(arr) {
    return arr.reduce((acc, item) => {
      if (acc.indexOf(item) === -1) {
        acc.push(item)
      }
      return acc
    }, [])
  }

  intersect(a, b) {
    const uniqA = this.uniq(a)
    const uniqB = this.uniq(b)

    return uniqA.filter(item => uniqB.indexOf(item) >= 0)
  }

  deepMerge(a, b) {
    var o = {}

    for (let key in a) {
      let originalValue = a[key],
        value = originalValue

      if (b.hasOwnProperty(key)) {
        value = b[key]
      }

      if (typeof value === 'object') {
        value = this.deepMerge(originalValue, value)
      }

      o[key] = value
    }

    return o
  }

  // https://github.com/sonicdoe/measure-scrollbar
  measureScrollbar() {
    if (typeof document == 'undefined') return 0
    const div = document.createElement('div')

    div.style.width = '100px'
    div.style.height = '100px'
    div.style.overflow = 'scroll'
    div.style.position = 'absolute'
    div.style.top = '-9999px'

    document.body.appendChild(div)
    const scrollbarWidth = div.offsetWidth - div.clientWidth
    document.body.removeChild(div)

    return scrollbarWidth
  }

}