import { Plugin } from '@midgar/midgar'

/**
 * Test2Plugin
 */
class Test2Plugin extends Plugin {}

export default Test2Plugin
export const config = {
  rewrite: {
    files: {
      'test-plugin': {
        'views/pages/test-rw.html': 'views/pages/test.html'
      }
    }
  }
}
