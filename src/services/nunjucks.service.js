import nunjucks from 'nunjucks'
import path from 'path'
import { assignRecursive } from '@midgar/utils'

/**
 * MidgarLoader class
 * File loader for nunjucks
 */
class MidgarLoader {
  /**
   * @param {Midgar} mid Midgar instance
   */
  constructor(mid) {
    this.mid = mid
    this.async = true
  }

  /**
   * Check of a path is relative
   *
   * @param {string} filePath File path to check
   *
   * @returns {boolean}
   */
  isRelative(filePath) {
    return !path.isAbsolute(filePath)
  }

  /**
   * Resolve a relative file path
   *
   * @param {string} parentPath Parent path, must be like plugin-name:file-path
   * @param {string} filePath   Relative file path
   *
   * @returns {string} Absolute file path
   */
  resolve(parentPath, filePath) {
    const parts = parentPath.split(':')
    if (parts.length !== 2) throw new Error('Invalid parent path !')
    return parts[0] + ':' + path.resolve('/' + path.dirname(parts[1]), filePath).slice(1)
  }

  /**
   * Load a file and return file object to nunjucks
   *
   * @param {string}   filePath Absolute file path to load
   * @param {function} callback Callback function
   *
   * @return {Promise<void>}
   */
  async getSource(filePath, callback) {
    try {
      const src = await this.mid.pm.readFile(filePath)
      const file = {
        src,
        path: filePath
      }
      callback(null, file)
    } catch (error) {
      callback(error)
    }
  }
}

/**
 * Service name
 * @type {string}
 */
const serviceName = 'mid:nunjucks'

const dependencies = ['mid:i18n']

/**
 * NunjucksService class
 */
class NunjucksService {
  /**
   * Constructor
   *
   * @param {Midgar}      mid         Midgar instance
   * @param {I18nService} i18nService I18n service
   */
  constructor(mid, i18nService) {
    /**
     * Plugin config
     * @var {Midgar}}
     */
    this.mid = mid

    /**
     * Cache template dictionary
     * @var {object}
     */
    this._templates = {}

    /**
     * Plugin config
     * @var {object}
     */
    this.config = assignRecursive({}, this.mid.config.twig || {}, {
      cache: true
    })

    /**
     * Nunjucks environment
     * @var {nunjucks.Environment}
     */
    this.environement = new nunjucks.Environment(new MidgarLoader(this.mid))

    /**
     * Add Translate filer
     */
    this.environement.addFilter('__', function (msg, ...args) {
      if (!msg) throw new Error('Invalid message !')
      const data = this.getVariables()
      return i18nService.__(msg, data._locale, ...args)
    })
  }

  /**
   * Render a template file
   *
   * @param {string} filePath File path, must be like plugin-name:file-path
   * @param {object} data     Template data
   * @param {object} locale   Locale code for translation filter
   *
   * @return {Promise<string>}
   */
  async render(filePath, data = {}, locale = null) {
    // Get nunjumks template
    const template = await this._getTemplate(filePath)
    return new Promise((resolve, reject) => {
      // Add locale to data object
      data._locale = locale
      // Render template
      template.render(data, function (err, html) {
        if (err) {
          reject(err)
        } else {
          resolve(html)
        }
      })
    })
  }

  /**
   * Return a nunchuncks template
   *
   * @param {string} filePath File path, must be like plugin-name:file-path
   *
   * @returns {Promise<Template>}
   * @private
   */
  _getTemplate(filePath) {
    return new Promise((resolve, reject) => {
      if (this.config.cache && this._templates[filePath]) resolve(this._templates[filePath])
      else {
        this.environement.getTemplate(filePath, (err, template) => {
          if (err) reject(err)
          else {
            // If cache is enable save template
            if (this.config.cache) this._templates[filePath] = template
            resolve(template)
          }
        })
      }
    })
  }
}

export default {
  name: serviceName,
  service: NunjucksService,
  dependencies
}
